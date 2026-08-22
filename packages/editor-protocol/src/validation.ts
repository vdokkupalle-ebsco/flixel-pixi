import {
  EDITOR_PROTOCOL_NAME,
  EDITOR_PROTOCOL_VERSION,
  type ProtocolDiagnostic,
  type ProtocolEndpoint,
  type ProtocolMessage,
  type ProtocolMessageType,
  type ProtocolValidationIssue,
  type ProtocolValidationResult,
} from './types.js';

const MESSAGE_TYPES = new Set<ProtocolMessageType>([
  'diagnostics.publish',
  'editor.hello',
  'preview.command',
  'preview.ready',
  'preview.state',
  'project.load',
  'project.loaded',
  'project.rejected',
  'protocol.error',
  'selection.set',
]);
const ENDPOINTS = new Set<ProtocolEndpoint>(['editor', 'preview']);
const COMMANDS = new Set(['pause', 'reset', 'resume', 'start', 'step', 'stop']);
const STATES = new Set([
  'error',
  'idle',
  'loading',
  'paused',
  'running',
  'stopped',
]);
const SEVERITIES = new Set(['error', 'info', 'warning']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: ProtocolValidationIssue[],
  path: string,
  code: ProtocolValidationIssue['code'],
  message: string,
): void {
  issues.push({ code, message, path });
}

function requireNonEmptyString(
  value: unknown,
  path: string,
  issues: ProtocolValidationIssue[],
): value is string {
  if (typeof value !== 'string') {
    addIssue(
      issues,
      path,
      value === undefined ? 'missing_value' : 'invalid_type',
      'Expected a string.',
    );
    return false;
  }
  if (value.trim().length === 0) {
    addIssue(issues, path, 'invalid_value', 'Expected a non-empty string.');
    return false;
  }
  return true;
}

function requireRevision(
  value: unknown,
  path: string,
  issues: ProtocolValidationIssue[],
): value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    addIssue(
      issues,
      path,
      'invalid_value',
      'Expected a non-negative safe integer.',
    );
    return false;
  }
  return true;
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: ProtocolValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    addIssue(
      issues,
      path,
      value === undefined ? 'missing_value' : 'invalid_type',
      'Expected an array.',
    );
    return;
  }
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (requireNonEmptyString(entry, `${path}[${index}]`, issues)) {
      if (seen.has(entry)) {
        addIssue(
          issues,
          `${path}[${index}]`,
          'invalid_value',
          `Duplicate value "${entry}".`,
        );
      }
      seen.add(entry);
    }
  });
}

function validateDiagnostics(
  value: unknown,
  path: string,
  issues: ProtocolValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    addIssue(
      issues,
      path,
      value === undefined ? 'missing_value' : 'invalid_type',
      'Expected an array.',
    );
    return;
  }
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      addIssue(
        issues,
        entryPath,
        'invalid_type',
        'Expected a diagnostic object.',
      );
      return;
    }
    requireNonEmptyString(entry.code, `${entryPath}.code`, issues);
    requireNonEmptyString(entry.message, `${entryPath}.message`, issues);
    if (!SEVERITIES.has(entry.severity as string)) {
      addIssue(
        issues,
        `${entryPath}.severity`,
        'invalid_value',
        'Expected error, info, or warning.',
      );
    }
    if (entry.path !== undefined) {
      requireNonEmptyString(entry.path, `${entryPath}.path`, issues);
    }
  });
}

function validatePayload(
  type: ProtocolMessageType,
  payload: unknown,
  issues: ProtocolValidationIssue[],
): void {
  if (!isRecord(payload)) {
    addIssue(
      issues,
      '$.payload',
      payload === undefined ? 'missing_value' : 'invalid_type',
      'Expected an object.',
    );
    return;
  }
  switch (type) {
    case 'editor.hello':
      validateStringArray(
        payload.capabilities,
        '$.payload.capabilities',
        issues,
      );
      if (!Array.isArray(payload.supportedProtocolVersions)) {
        addIssue(
          issues,
          '$.payload.supportedProtocolVersions',
          'invalid_type',
          'Expected an array.',
        );
      } else {
        payload.supportedProtocolVersions.forEach((version, index) => {
          if (!Number.isSafeInteger(version) || (version as number) < 1) {
            addIssue(
              issues,
              `$.payload.supportedProtocolVersions[${index}]`,
              'invalid_value',
              'Expected a positive integer.',
            );
          }
        });
      }
      return;
    case 'preview.ready':
      validateStringArray(
        payload.capabilities,
        '$.payload.capabilities',
        issues,
      );
      if (
        !Number.isSafeInteger(payload.protocolVersion) ||
        (payload.protocolVersion as number) < 1
      ) {
        addIssue(
          issues,
          '$.payload.protocolVersion',
          'invalid_value',
          'Expected a positive integer.',
        );
      }
      return;
    case 'project.load':
      requireRevision(payload.revision, '$.payload.revision', issues);
      requireNonEmptyString(
        payload.serializedProject,
        '$.payload.serializedProject',
        issues,
      );
      return;
    case 'project.loaded':
      requireRevision(payload.revision, '$.payload.revision', issues);
      return;
    case 'project.rejected':
      requireRevision(payload.revision, '$.payload.revision', issues);
      validateDiagnostics(payload.diagnostics, '$.payload.diagnostics', issues);
      return;
    case 'preview.command':
      if (!COMMANDS.has(payload.command as string)) {
        addIssue(
          issues,
          '$.payload.command',
          'invalid_value',
          'Unknown preview command.',
        );
      }
      return;
    case 'preview.state':
      if (!STATES.has(payload.state as string)) {
        addIssue(
          issues,
          '$.payload.state',
          'invalid_value',
          'Unknown preview state.',
        );
      }
      if (payload.revision !== undefined) {
        requireRevision(payload.revision, '$.payload.revision', issues);
      }
      return;
    case 'selection.set':
      requireNonEmptyString(payload.sceneId, '$.payload.sceneId', issues);
      validateStringArray(payload.entityIds, '$.payload.entityIds', issues);
      return;
    case 'diagnostics.publish':
      validateDiagnostics(payload.diagnostics, '$.payload.diagnostics', issues);
      if (payload.revision !== undefined) {
        requireRevision(payload.revision, '$.payload.revision', issues);
      }
      return;
    case 'protocol.error':
      requireNonEmptyString(payload.code, '$.payload.code', issues);
      requireNonEmptyString(payload.message, '$.payload.message', issues);
  }
}

export class ProtocolValidationError extends TypeError {
  readonly issues: ProtocolValidationIssue[];

  constructor(issues: ProtocolValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
    this.name = 'ProtocolValidationError';
    this.issues = issues;
  }
}

export function validateProtocolMessage(
  value: unknown,
): ProtocolValidationResult {
  const issues: ProtocolValidationIssue[] = [];
  if (!isRecord(value)) {
    return {
      issues: [
        {
          code: 'invalid_type',
          message: 'Expected a message object.',
          path: '$',
        },
      ],
      success: false,
    };
  }

  if (value.protocol !== EDITOR_PROTOCOL_NAME) {
    addIssue(
      issues,
      '$.protocol',
      'invalid_value',
      `Expected "${EDITOR_PROTOCOL_NAME}".`,
    );
  }
  if (value.protocolVersion !== EDITOR_PROTOCOL_VERSION) {
    addIssue(
      issues,
      '$.protocolVersion',
      'unsupported_version',
      `Only protocol version ${EDITOR_PROTOCOL_VERSION} is supported.`,
    );
  }
  requireNonEmptyString(value.id, '$.id', issues);
  requireNonEmptyString(value.sessionId, '$.sessionId', issues);
  if (value.replyTo !== undefined) {
    requireNonEmptyString(value.replyTo, '$.replyTo', issues);
  }
  if (!ENDPOINTS.has(value.source as ProtocolEndpoint)) {
    addIssue(
      issues,
      '$.source',
      'invalid_value',
      'Expected editor or preview.',
    );
  }
  if (!ENDPOINTS.has(value.target as ProtocolEndpoint)) {
    addIssue(
      issues,
      '$.target',
      'invalid_value',
      'Expected editor or preview.',
    );
  }
  if (
    value.source === value.target &&
    ENDPOINTS.has(value.source as ProtocolEndpoint)
  ) {
    addIssue(
      issues,
      '$.target',
      'invalid_value',
      'Source and target must be different.',
    );
  }

  if (!MESSAGE_TYPES.has(value.type as ProtocolMessageType)) {
    addIssue(issues, '$.type', 'invalid_value', 'Unknown message type.');
  } else {
    validatePayload(value.type as ProtocolMessageType, value.payload, issues);
  }

  return issues.length === 0
    ? { data: value as unknown as ProtocolMessage, success: true }
    : { issues, success: false };
}

export function parseProtocolMessage(value: unknown): ProtocolMessage {
  const result = validateProtocolMessage(value);
  if (!result.success) throw new ProtocolValidationError(result.issues);
  return result.data;
}

export function isProtocolValidationError(
  error: unknown,
): error is ProtocolValidationError {
  return error instanceof ProtocolValidationError;
}

export function diagnosticFromError(
  code: string,
  error: unknown,
  severity: ProtocolDiagnostic['severity'] = 'error',
): ProtocolDiagnostic {
  return {
    code,
    message: error instanceof Error ? error.message : String(error),
    severity,
  };
}
