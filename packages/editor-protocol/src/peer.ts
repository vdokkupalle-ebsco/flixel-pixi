import { createProtocolMessage } from './messages.js';
import type {
  ProtocolEndpoint,
  ProtocolMessage,
  ProtocolMessageFor,
  ProtocolMessageType,
  ProtocolPayloadMap,
  ProtocolTransport,
  ProtocolValidationIssue,
} from './types.js';
import { validateProtocolMessage } from './validation.js';

interface PendingRequest {
  expectedTypes: ReadonlySet<ProtocolMessageType>;
  reject(error: Error): void;
  resolve(message: ProtocolMessage): void;
  timeout: ReturnType<typeof setTimeout>;
}

export interface ProtocolPeerOptions {
  createMessageId: () => string;
  onInvalidMessage?: (
    issues: ProtocolValidationIssue[],
    value: unknown,
  ) => void;
  requestTimeoutMs?: number;
  role: ProtocolEndpoint;
  sessionId: string;
  transport: ProtocolTransport;
}

export interface SendProtocolMessageOptions {
  replyTo?: string;
}

export interface RequestProtocolMessageOptions<R extends ProtocolMessageType> {
  expect: R | readonly R[];
  timeoutMs?: number;
}

export class ProtocolRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolRequestError';
  }
}

export interface ProtocolPeer {
  destroy(): void;
  onMessage(listener: (message: ProtocolMessage) => void): () => void;
  reply<T extends ProtocolMessageType>(
    request: ProtocolMessage,
    type: T,
    payload: ProtocolPayloadMap[T],
  ): ProtocolMessageFor<T>;
  request<T extends ProtocolMessageType, R extends ProtocolMessageType>(
    type: T,
    payload: ProtocolPayloadMap[T],
    options: RequestProtocolMessageOptions<R>,
  ): Promise<ProtocolMessage<R>>;
  send<T extends ProtocolMessageType>(
    type: T,
    payload: ProtocolPayloadMap[T],
    options?: SendProtocolMessageOptions,
  ): ProtocolMessageFor<T>;
}

function opposite(role: ProtocolEndpoint): ProtocolEndpoint {
  return role === 'editor' ? 'preview' : 'editor';
}

export function createProtocolPeer(options: ProtocolPeerOptions): ProtocolPeer {
  const listeners = new Set<(message: ProtocolMessage) => void>();
  const pending = new Map<string, PendingRequest>();
  const requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
  let destroyed = false;

  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new RangeError('requestTimeoutMs must be greater than zero.');
  }

  function assertActive(): void {
    if (destroyed)
      throw new ProtocolRequestError('The protocol peer has been destroyed.');
  }

  function makeMessage<T extends ProtocolMessageType>(
    type: T,
    payload: ProtocolPayloadMap[T],
    sendOptions?: SendProtocolMessageOptions,
  ): ProtocolMessageFor<T> {
    return createProtocolMessage({
      id: options.createMessageId(),
      payload,
      ...(sendOptions?.replyTo === undefined
        ? {}
        : { replyTo: sendOptions.replyTo }),
      sessionId: options.sessionId,
      source: options.role,
      target: opposite(options.role),
      type,
    });
  }

  const unsubscribe = options.transport.subscribe((value) => {
    if (destroyed) return;
    const result = validateProtocolMessage(value);
    if (!result.success) {
      options.onInvalidMessage?.(result.issues, value);
      return;
    }
    const message = result.data;
    if (
      message.sessionId !== options.sessionId ||
      message.target !== options.role
    )
      return;

    if (message.replyTo !== undefined) {
      const request = pending.get(message.replyTo);
      if (request !== undefined) {
        clearTimeout(request.timeout);
        pending.delete(message.replyTo);
        if (request.expectedTypes.has(message.type)) {
          request.resolve(message);
        } else {
          request.reject(
            new ProtocolRequestError(
              `Expected ${[...request.expectedTypes].join(' or ')}, received ${message.type}.`,
            ),
          );
        }
      }
    }
    listeners.forEach((listener) => listener(message));
  });

  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      unsubscribe();
      listeners.clear();
      pending.forEach((request) => {
        clearTimeout(request.timeout);
        request.reject(
          new ProtocolRequestError('The protocol peer was destroyed.'),
        );
      });
      pending.clear();
    },
    onMessage(listener): () => void {
      assertActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reply(request, type, payload) {
      assertActive();
      const message = makeMessage(type, payload, { replyTo: request.id });
      options.transport.postMessage(message);
      return message;
    },
    request(type, payload, requestOptions) {
      assertActive();
      const message = makeMessage(type, payload);
      const expectedTypes = new Set(
        Array.isArray(requestOptions.expect)
          ? requestOptions.expect
          : [requestOptions.expect],
      );
      if (expectedTypes.size === 0) {
        throw new RangeError(
          'At least one expected response type is required.',
        );
      }
      if (pending.has(message.id)) {
        throw new ProtocolRequestError(
          `Request message id ${message.id} is already in flight.`,
        );
      }
      const timeoutMs = requestOptions.timeoutMs ?? requestTimeoutMs;
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new RangeError('timeoutMs must be greater than zero.');
      }

      const response = new Promise<ProtocolMessage>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(message.id);
          reject(
            new ProtocolRequestError(
              `Request ${message.id} timed out after ${timeoutMs}ms.`,
            ),
          );
        }, timeoutMs);
        pending.set(message.id, { expectedTypes, reject, resolve, timeout });
      });
      try {
        options.transport.postMessage(message);
      } catch (error) {
        const request = pending.get(message.id);
        if (request !== undefined) {
          clearTimeout(request.timeout);
          request.reject(
            error instanceof Error
              ? error
              : new ProtocolRequestError(String(error)),
          );
        }
        pending.delete(message.id);
      }
      return response as Promise<
        ProtocolMessage<
          typeof requestOptions.expect extends readonly (infer U)[]
            ? Extract<U, ProtocolMessageType>
            : Extract<typeof requestOptions.expect, ProtocolMessageType>
        >
      >;
    },
    send(type, payload, sendOptions) {
      assertActive();
      const message = makeMessage(type, payload, sendOptions);
      options.transport.postMessage(message);
      return message;
    },
  };
}
