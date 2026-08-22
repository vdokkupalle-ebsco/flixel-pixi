import {
  EDITOR_PROTOCOL_NAME,
  EDITOR_PROTOCOL_VERSION,
  type ProtocolEndpoint,
  type ProtocolMessageFor,
  type ProtocolMessageType,
  type ProtocolPayloadMap,
} from './types.js';

export interface CreateProtocolMessageOptions<T extends ProtocolMessageType> {
  id: string;
  payload: ProtocolPayloadMap[T];
  replyTo?: string;
  sessionId: string;
  source: ProtocolEndpoint;
  target: ProtocolEndpoint;
  type: T;
}

function requireIdentifier(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${name} must not be empty.`);
  }
}

export function createProtocolMessage<T extends ProtocolMessageType>(
  options: CreateProtocolMessageOptions<T>,
): ProtocolMessageFor<T> {
  requireIdentifier(options.id, 'id');
  requireIdentifier(options.sessionId, 'sessionId');
  if (options.replyTo !== undefined) {
    requireIdentifier(options.replyTo, 'replyTo');
  }

  return {
    id: options.id,
    payload: options.payload,
    protocol: EDITOR_PROTOCOL_NAME,
    protocolVersion: EDITOR_PROTOCOL_VERSION,
    ...(options.replyTo === undefined ? {} : { replyTo: options.replyTo }),
    sessionId: options.sessionId,
    source: options.source,
    target: options.target,
    type: options.type,
  };
}
