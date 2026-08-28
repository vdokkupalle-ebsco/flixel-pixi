import type { ProtocolTransport } from '@flixel-pixi/editor-protocol';

export function createWindowTransport(
  source: Window,
  target: Window,
  targetOrigin = window.location.origin,
): ProtocolTransport {
  return {
    postMessage(message: unknown): void {
      target.postMessage(message, targetOrigin);
    },
    subscribe(listener: (message: unknown) => void): () => void {
      const receive = (event: MessageEvent): void => {
        if (event.source !== source || event.origin !== targetOrigin) return;
        listener(event.data);
      };
      window.addEventListener('message', receive);
      return () => window.removeEventListener('message', receive);
    },
  };
}
