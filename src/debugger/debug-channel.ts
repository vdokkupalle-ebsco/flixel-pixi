/**
 * Typed lightweight event bus for engine → debugger communication.
 * Zero cost when no listeners are registered.
 * @public
 */

/** Payload shapes for each debug event type. */
export interface DebugEvents {
  /** Emitted after every simulation step. */
  'step-complete': {
    frame: number;
    updateMs: number;
  };
  /** A log message was added. */
  log: {
    color: number;
    message: string;
    timestamp: number;
  };
  /** Watch snapshot was taken. */
  watch: {
    entries: readonly { name: string; value: string }[];
  };
  /** Engine paused/unpaused. */
  'pause-change': { paused: boolean };
}

export type DebugEventType = keyof DebugEvents;
export type DebugHandler<T extends DebugEventType> = (
  payload: DebugEvents[T],
) => void;

/** Typed pub/sub channel that connects the game loop to optional debug consumers. @public */
export class DebugChannel {
  readonly #listeners = new Map<string, Set<(payload: unknown) => void>>();

  on<T extends DebugEventType>(type: T, handler: DebugHandler<T>): void {
    let bucket = this.#listeners.get(type);
    if (bucket === undefined) {
      bucket = new Set();
      this.#listeners.set(type, bucket);
    }
    bucket.add(handler as (payload: unknown) => void);
  }

  off<T extends DebugEventType>(type: T, handler: DebugHandler<T>): void {
    this.#listeners.get(type)?.delete(handler as (payload: unknown) => void);
  }

  emit<T extends DebugEventType>(type: T, payload: DebugEvents[T]): void {
    const bucket = this.#listeners.get(type);
    if (bucket === undefined || bucket.size === 0) return;
    for (const handler of bucket) handler(payload);
  }

  /** Removes all listeners. */
  destroy(): void {
    this.#listeners.clear();
  }
}
