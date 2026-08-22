export const EDITOR_PROTOCOL_NAME = 'flixel-pixi/editor' as const;
export const EDITOR_PROTOCOL_VERSION = 1 as const;

export type ProtocolEndpoint = 'editor' | 'preview';

export type PreviewCommand =
  'pause' | 'reset' | 'resume' | 'start' | 'step' | 'stop';

export type PreviewLifecycleState =
  'error' | 'idle' | 'loading' | 'paused' | 'running' | 'stopped';

export type ProtocolDiagnosticSeverity = 'error' | 'info' | 'warning';

export interface ProtocolDiagnostic {
  code: string;
  message: string;
  path?: string;
  severity: ProtocolDiagnosticSeverity;
}

export interface ProtocolPayloadMap {
  'diagnostics.publish': {
    diagnostics: ProtocolDiagnostic[];
    revision?: number;
  };
  'editor.hello': {
    capabilities: string[];
    supportedProtocolVersions: number[];
  };
  'preview.command': {
    command: PreviewCommand;
  };
  'preview.ready': {
    capabilities: string[];
    protocolVersion: number;
  };
  'preview.state': {
    revision?: number;
    state: PreviewLifecycleState;
  };
  'project.load': {
    revision: number;
    serializedProject: string;
  };
  'project.loaded': {
    revision: number;
  };
  'project.rejected': {
    diagnostics: ProtocolDiagnostic[];
    revision: number;
  };
  'protocol.error': {
    code: string;
    message: string;
  };
  'selection.set': {
    entityIds: string[];
    sceneId: string;
  };
}

export type ProtocolMessageType = keyof ProtocolPayloadMap;

export interface ProtocolMessageFor<T extends ProtocolMessageType> {
  id: string;
  payload: ProtocolPayloadMap[T];
  protocol: typeof EDITOR_PROTOCOL_NAME;
  protocolVersion: typeof EDITOR_PROTOCOL_VERSION;
  replyTo?: string;
  sessionId: string;
  source: ProtocolEndpoint;
  target: ProtocolEndpoint;
  type: T;
}

export type ProtocolMessage<
  T extends ProtocolMessageType = ProtocolMessageType,
> = T extends ProtocolMessageType ? ProtocolMessageFor<T> : never;

export interface ProtocolValidationIssue {
  code:
    'invalid_type' | 'invalid_value' | 'missing_value' | 'unsupported_version';
  message: string;
  path: string;
}

export type ProtocolValidationResult =
  | { data: ProtocolMessage; success: true }
  | { issues: ProtocolValidationIssue[]; success: false };

export interface ProtocolTransport {
  postMessage(message: unknown): void;
  subscribe(listener: (message: unknown) => void): () => void;
}
