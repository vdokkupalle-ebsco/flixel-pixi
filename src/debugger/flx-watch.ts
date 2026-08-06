/** A single watched field entry. @public */
export interface WatchEntry {
  readonly displayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly obj: Record<string, any>;
  readonly field: string;
}

/** A resolved snapshot value. @public */
export interface WatchSnapshot {
  readonly name: string;
  readonly value: string;
}

/** Service token for the watch service in FlxContext. @public */
export const FLX_WATCH_SERVICE = Symbol('flixel-pixi.watch');

/** Live field watcher. Mirrors AS3 FlxG.watch. @public */
export class FlxWatch {
  readonly #entries: WatchEntry[] = [];

  /**
   * Begins watching `obj[field]` each step.
   * @param obj - Object to read from.
   * @param field - Property name on the object.
   * @param displayName - Label shown in the Watch panel (defaults to field name).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(obj: Record<string, any>, field: string, displayName?: string): void {
    const name = displayName ?? field;
    const existing = this.#entries.findIndex(
      (e) => e.obj === obj && e.field === field,
    );
    if (existing >= 0) {
      // Update display name in place
      this.#entries[existing] = { displayName: name, field, obj };
    } else {
      this.#entries.push({ displayName: name, field, obj });
    }
  }

  /**
   * Stops watching `obj[field]`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove(obj: Record<string, any>, field: string): void {
    const index = this.#entries.findIndex(
      (e) => e.obj === obj && e.field === field,
    );
    if (index >= 0) this.#entries.splice(index, 1);
  }

  /** Removes all watched fields. */
  clear(): void {
    this.#entries.length = 0;
  }

  /** Returns current values for all watched fields. */
  snapshot(): WatchSnapshot[] {
    return this.#entries.map((e) => {
      let value: string;
      try {
        const raw: unknown = e.obj[e.field];
        value =
          typeof raw === 'number' ? raw.toFixed(2) : String(raw ?? 'undefined');
      } catch {
        value = '<error>';
      }
      return { name: e.displayName, value };
    });
  }
}
