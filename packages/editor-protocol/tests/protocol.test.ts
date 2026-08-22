import { describe, expect, it, vi } from 'vitest';
import {
  createProtocolMessage,
  createProtocolPeer,
  diagnosticFromError,
  EDITOR_PROTOCOL_NAME,
  EDITOR_PROTOCOL_VERSION,
  isProtocolValidationError,
  parseProtocolMessage,
  ProtocolRequestError,
  ProtocolValidationError,
  type ProtocolMessage,
  type ProtocolTransport,
  validateProtocolMessage,
} from '../src/index.js';

function message(overrides: Record<string, unknown> = {}): unknown {
  return {
    id: 'message-1',
    payload: { command: 'start' },
    protocol: EDITOR_PROTOCOL_NAME,
    protocolVersion: EDITOR_PROTOCOL_VERSION,
    sessionId: 'session-1',
    source: 'editor',
    target: 'preview',
    type: 'preview.command',
    ...overrides,
  };
}

function createTransportPair(): [ProtocolTransport, ProtocolTransport] {
  const leftListeners = new Set<(value: unknown) => void>();
  const rightListeners = new Set<(value: unknown) => void>();
  return [
    {
      postMessage(value): void {
        rightListeners.forEach((listener) => listener(value));
      },
      subscribe(listener): () => void {
        leftListeners.add(listener);
        return () => leftListeners.delete(listener);
      },
    },
    {
      postMessage(value): void {
        leftListeners.forEach((listener) => listener(value));
      },
      subscribe(listener): () => void {
        rightListeners.add(listener);
        return () => rightListeners.delete(listener);
      },
    },
  ];
}

function ids(prefix: string): () => string {
  let next = 0;
  return () => `${prefix}-${++next}`;
}

describe('protocol messages', () => {
  it('creates a versioned message and preserves optional correlation', () => {
    expect(
      createProtocolMessage({
        id: 'response-1',
        payload: { revision: 3 },
        replyTo: 'request-1',
        sessionId: 'session-1',
        source: 'preview',
        target: 'editor',
        type: 'project.loaded',
      }),
    ).toEqual({
      id: 'response-1',
      payload: { revision: 3 },
      protocol: 'flixel-pixi/editor',
      protocolVersion: 1,
      replyTo: 'request-1',
      sessionId: 'session-1',
      source: 'preview',
      target: 'editor',
      type: 'project.loaded',
    });
  });

  it.each([
    ['id', { id: ' ' }],
    ['sessionId', { sessionId: '' }],
    ['replyTo', { replyTo: '' }],
  ])('rejects an empty %s', (_name, override) => {
    expect(() =>
      createProtocolMessage({
        id: 'message-1',
        payload: { command: 'start' },
        sessionId: 'session-1',
        source: 'editor',
        target: 'preview',
        type: 'preview.command',
        ...override,
      }),
    ).toThrow(TypeError);
  });

  it.each([
    [
      'editor.hello',
      { capabilities: ['reload'], supportedProtocolVersions: [1] },
    ],
    ['preview.ready', { capabilities: ['reload'], protocolVersion: 1 }],
    ['project.load', { revision: 0, serializedProject: '{"schemaVersion":1}' }],
    ['project.loaded', { revision: 0 }],
    [
      'project.rejected',
      {
        diagnostics: [
          {
            code: 'bad_project',
            message: 'Invalid project.',
            severity: 'error',
          },
        ],
        revision: 1,
      },
    ],
    ['preview.command', { command: 'pause' }],
    ['preview.state', { revision: 2, state: 'running' }],
    ['selection.set', { entityIds: ['player'], sceneId: 'level-1' }],
    [
      'diagnostics.publish',
      {
        diagnostics: [
          {
            code: 'missing_asset',
            message: 'Asset is missing.',
            path: '$.assets[0]',
            severity: 'warning',
          },
        ],
      },
    ],
    [
      'protocol.error',
      { code: 'unsupported', message: 'Unsupported operation.' },
    ],
  ])('validates %s messages', (type, payload) => {
    expect(validateProtocolMessage(message({ payload, type }))).toMatchObject({
      success: true,
    });
  });

  it('reports envelope problems with actionable paths', () => {
    const result = validateProtocolMessage(
      message({
        id: '',
        protocol: 'another/protocol',
        protocolVersion: 2,
        replyTo: '',
        sessionId: 4,
        source: 'editor',
        target: 'editor',
        type: 'unknown',
      }),
    );
    expect(result).toMatchObject({ success: false });
    if (result.success) throw new Error('Expected validation to fail.');
    expect(result.issues.map((issue) => issue.path)).toEqual([
      '$.protocol',
      '$.protocolVersion',
      '$.id',
      '$.sessionId',
      '$.replyTo',
      '$.target',
      '$.type',
    ]);
  });

  it('rejects non-object input and payloads', () => {
    expect(validateProtocolMessage(null)).toMatchObject({
      issues: [{ path: '$' }],
      success: false,
    });
    expect(validateProtocolMessage(message({ payload: null }))).toMatchObject({
      issues: [{ path: '$.payload' }],
      success: false,
    });
  });

  it.each([
    [
      'editor.hello',
      {
        capabilities: ['reload', 'reload'],
        supportedProtocolVersions: [0, 1.5],
      },
    ],
    ['preview.ready', { capabilities: null, protocolVersion: 0 }],
    ['project.load', { revision: -1, serializedProject: '' }],
    ['project.loaded', { revision: 1.5 }],
    ['project.rejected', { diagnostics: null, revision: -1 }],
    ['preview.command', { command: 'explode' }],
    ['preview.state', { revision: -1, state: 'unknown' }],
    ['selection.set', { entityIds: ['player', 'player'], sceneId: '' }],
    ['diagnostics.publish', { diagnostics: {}, revision: -1 }],
    ['protocol.error', { code: '', message: null }],
  ])('rejects malformed %s payloads', (type, payload) => {
    expect(validateProtocolMessage(message({ payload, type }))).toMatchObject({
      success: false,
    });
  });

  it('validates each diagnostic field', () => {
    const result = validateProtocolMessage(
      message({
        payload: {
          diagnostics: [
            null,
            { code: '', message: '', path: '', severity: 'fatal' },
          ],
        },
        type: 'diagnostics.publish',
      }),
    );
    expect(result).toMatchObject({ success: false });
    if (result.success) throw new Error('Expected validation to fail.');
    expect(result.issues.map((issue) => issue.path)).toContain(
      '$.payload.diagnostics[1].severity',
    );
  });

  it('parses valid input and throws a recognizable validation error', () => {
    expect(parseProtocolMessage(message())).toMatchObject({
      type: 'preview.command',
    });
    try {
      parseProtocolMessage(message({ payload: {} }));
      throw new Error('Expected parsing to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(ProtocolValidationError);
      expect(isProtocolValidationError(error)).toBe(true);
      expect((error as Error).message).toContain('$.payload.command');
    }
    expect(isProtocolValidationError(new Error('different error'))).toBe(false);
  });

  it('turns thrown and non-error values into diagnostics', () => {
    expect(
      diagnosticFromError('load_failed', new Error('No project.')),
    ).toEqual({
      code: 'load_failed',
      message: 'No project.',
      severity: 'error',
    });
    expect(diagnosticFromError('notice', 42, 'info')).toEqual({
      code: 'notice',
      message: '42',
      severity: 'info',
    });
  });
});

describe('protocol peers', () => {
  it('sends typed messages and notifies subscribers', () => {
    const [editorTransport, previewTransport] = createTransportPair();
    const editor = createProtocolPeer({
      createMessageId: ids('editor'),
      role: 'editor',
      sessionId: 'session-1',
      transport: editorTransport,
    });
    const preview = createProtocolPeer({
      createMessageId: ids('preview'),
      role: 'preview',
      sessionId: 'session-1',
      transport: previewTransport,
    });
    const received: ProtocolMessage[] = [];
    const stopListening = preview.onMessage((receivedMessage) =>
      received.push(receivedMessage),
    );

    const sent = editor.send('preview.command', { command: 'start' });
    expect(received).toEqual([sent]);
    stopListening();
    editor.send('preview.command', { command: 'pause' });
    expect(received).toHaveLength(1);

    editor.destroy();
    preview.destroy();
  });

  it('correlates requests with allowed response types', async () => {
    const [editorTransport, previewTransport] = createTransportPair();
    const editor = createProtocolPeer({
      createMessageId: ids('editor'),
      role: 'editor',
      sessionId: 'session-1',
      transport: editorTransport,
    });
    const preview = createProtocolPeer({
      createMessageId: ids('preview'),
      role: 'preview',
      sessionId: 'session-1',
      transport: previewTransport,
    });
    preview.onMessage((request) => {
      if (request.type === 'project.load') {
        preview.reply(request, 'project.loaded', {
          revision: request.payload.revision,
        });
      }
    });

    await expect(
      editor.request(
        'project.load',
        { revision: 7, serializedProject: '{}' },
        { expect: ['project.loaded', 'project.rejected'] },
      ),
    ).resolves.toMatchObject({
      payload: { revision: 7 },
      type: 'project.loaded',
    });

    editor.destroy();
    preview.destroy();
  });

  it('rejects an unexpected correlated response', async () => {
    const [editorTransport, previewTransport] = createTransportPair();
    const editor = createProtocolPeer({
      createMessageId: ids('editor'),
      role: 'editor',
      sessionId: 'session-1',
      transport: editorTransport,
    });
    const preview = createProtocolPeer({
      createMessageId: ids('preview'),
      role: 'preview',
      sessionId: 'session-1',
      transport: previewTransport,
    });
    preview.onMessage((request) => {
      preview.reply(request, 'preview.state', { state: 'running' });
    });

    await expect(
      editor.request(
        'preview.command',
        { command: 'start' },
        { expect: 'project.loaded' },
      ),
    ).rejects.toThrow('Expected project.loaded, received preview.state.');
    editor.destroy();
    preview.destroy();
  });

  it('times out unanswered requests and validates timeout options', async () => {
    vi.useFakeTimers();
    const [editorTransport] = createTransportPair();
    const editor = createProtocolPeer({
      createMessageId: ids('editor'),
      requestTimeoutMs: 20,
      role: 'editor',
      sessionId: 'session-1',
      transport: editorTransport,
    });
    const response = editor.request(
      'preview.command',
      { command: 'start' },
      { expect: 'preview.state' },
    );
    const timeoutAssertion = expect(response).rejects.toThrow(
      'timed out after 20ms',
    );
    await vi.advanceTimersByTimeAsync(20);
    await timeoutAssertion;
    expect(() =>
      editor.request(
        'preview.command',
        { command: 'start' },
        { expect: 'preview.state', timeoutMs: 0 },
      ),
    ).toThrow(RangeError);
    editor.destroy();
    vi.useRealTimers();
  });

  it('rejects pending work and future calls after destruction', async () => {
    const [editorTransport] = createTransportPair();
    const editor = createProtocolPeer({
      createMessageId: ids('editor'),
      role: 'editor',
      sessionId: 'session-1',
      transport: editorTransport,
    });
    const response = editor.request(
      'preview.command',
      { command: 'start' },
      { expect: 'preview.state' },
    );
    editor.destroy();
    editor.destroy();
    await expect(response).rejects.toThrow('peer was destroyed');
    expect(() => editor.send('preview.command', { command: 'start' })).toThrow(
      ProtocolRequestError,
    );
  });

  it('filters other sessions and targets and reports malformed input', () => {
    const invalid = vi.fn();
    let deliver: ((value: unknown) => void) | undefined;
    const peer = createProtocolPeer({
      createMessageId: ids('preview'),
      onInvalidMessage: invalid,
      role: 'preview',
      sessionId: 'session-1',
      transport: {
        postMessage(): void {
          // This test injects inbound messages only.
        },
        subscribe(listener): () => void {
          deliver = listener;
          return () => undefined;
        },
      },
    });
    const received = vi.fn();
    peer.onMessage(received);
    if (deliver === undefined)
      throw new Error('Expected transport subscription.');

    deliver({ bad: true });
    deliver(message({ sessionId: 'other-session' }));
    deliver(message({ source: 'preview', target: 'editor' }));
    expect(invalid).toHaveBeenCalledOnce();
    expect(received).not.toHaveBeenCalled();
    peer.destroy();
  });

  it('rejects invalid default timeout configuration', () => {
    const [transport] = createTransportPair();
    expect(() =>
      createProtocolPeer({
        createMessageId: ids('editor'),
        requestTimeoutMs: Number.NaN,
        role: 'editor',
        sessionId: 'session-1',
        transport,
      }),
    ).toThrow(RangeError);
  });

  it('requires a response type and unique in-flight request ids', () => {
    const [transport] = createTransportPair();
    const peer = createProtocolPeer({
      createMessageId: () => 'same-id',
      role: 'editor',
      sessionId: 'session-1',
      transport,
    });
    expect(() =>
      peer.request('preview.command', { command: 'start' }, { expect: [] }),
    ).toThrow('At least one expected response type');
    const pendingResponse = peer.request(
      'preview.command',
      { command: 'start' },
      { expect: 'preview.state' },
    );
    expect(() =>
      peer.request(
        'preview.command',
        { command: 'pause' },
        { expect: 'preview.state' },
      ),
    ).toThrow('already in flight');
    peer.destroy();
    return expect(pendingResponse).rejects.toThrow('peer was destroyed');
  });

  it('cleans up an in-flight request when the transport throws', async () => {
    const peer = createProtocolPeer({
      createMessageId: () => 'request-1',
      role: 'editor',
      sessionId: 'session-1',
      transport: {
        postMessage(): void {
          throw new Error('Preview detached.');
        },
        subscribe(): () => void {
          return () => undefined;
        },
      },
    });
    await expect(
      peer.request(
        'preview.command',
        { command: 'start' },
        { expect: 'preview.state' },
      ),
    ).rejects.toThrow('Preview detached.');
    await expect(
      peer.request(
        'preview.command',
        { command: 'start' },
        { expect: 'preview.state' },
      ),
    ).rejects.toThrow('Preview detached.');
    peer.destroy();
  });
});
