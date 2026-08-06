/** A single log entry stored in the ring buffer. @public */
export interface LogEntry {
  readonly color: number;
  readonly message: string;
  readonly timestamp: number;
}

/** Service token for the log service in FlxContext. @public */
export const FLX_LOG_SERVICE = Symbol('flixel-pixi.log');

/** Ring-buffer log that keeps the last MAX_ENTRIES messages. Mirrors AS3 FlxG.log. @public */
export class FlxLog {
  static readonly MAX_ENTRIES = 1024;

  readonly #entries: LogEntry[] = [];
  #onChange: (() => void) | null = null;

  /** Live snapshot of stored entries (oldest first). */
  get entries(): readonly LogEntry[] {
    return this.#entries;
  }

  /** Adds a message. Oldest entry is dropped when capacity is exceeded. */
  add(message: string, color = 0xffffff): void {
    if (this.#entries.length >= FlxLog.MAX_ENTRIES) {
      this.#entries.shift();
    }
    this.#entries.push({ color, message, timestamp: Date.now() });
    this.#onChange?.();
  }

  /** Adds an error-styled (red) message. */
  error(message: string): void {
    this.add(`[ERROR] ${message}`, 0xff4444);
  }

  /** Adds a warning-styled (yellow) message. */
  warn(message: string): void {
    this.add(`[WARN] ${message}`, 0xffcc00);
  }

  /** Removes all stored entries. */
  clear(): void {
    this.#entries.length = 0;
    this.#onChange?.();
  }

  /** @internal — called by FlxDebugger to subscribe to updates. */
  setOnChange(handler: (() => void) | null): void {
    this.#onChange = handler;
  }
}
