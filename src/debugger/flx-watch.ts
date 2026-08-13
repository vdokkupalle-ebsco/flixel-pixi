/** A single watched field entry. @public */
export interface WatchEntry {
  readonly displayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly obj: Record<string, any>;
  readonly field: string;
}

/** A resolved snapshot value. @public */
export interface WatchSnapshot {
  readonly editable: boolean;
  readonly id: string;
  readonly name: string;
  readonly value: string;
}

/** Explicit mutation contract for an editable tracked value. @public */
export interface FlxWatchEditor<T> {
  readonly parse: (input: string, currentValue: T) => T;
  readonly set: (value: T, currentValue: T) => void;
  readonly validate?: (value: T, currentValue: T) => string | null | undefined;
}

/** Getter-backed tracked value definition. @public */
export interface FlxWatchDefinition<T> {
  readonly editor?: FlxWatchEditor<T>;
  readonly format?: (value: T) => string;
  readonly name: string;
  readonly read: () => T;
}

/** Result of an attempted debugger watch mutation. @public */
export interface FlxWatchMutationResult {
  readonly error?: string;
  readonly ok: boolean;
  readonly snapshot?: WatchSnapshot;
}

/** Guard result: true permits mutation; false or a message rejects it. @public */
export type FlxWatchMutationGuard = () => boolean | string;

interface StoredWatchEntry {
  readonly editor?: FlxWatchEditor<unknown>;
  readonly field?: string;
  readonly format?: (value: unknown) => string;
  readonly id: string;
  readonly obj?: Record<string, unknown>;
  displayName: string;
  readonly read: () => unknown;
}

/** Service token for the watch service in FlxContext. @public */
export const FLX_WATCH_SERVICE = Symbol('flixel-pixi.watch');

/** Live field watcher. Mirrors AS3 FlxG.watch. @public */
export class FlxWatch {
  readonly #entries: StoredWatchEntry[] = [];
  #mutationGuard: FlxWatchMutationGuard | null = null;
  #nextId = 1;

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
      const entry = this.#entries[existing];
      if (entry !== undefined) entry.displayName = name;
    } else {
      this.#entries.push({
        displayName: name,
        field,
        id: `watch-${this.#nextId++}`,
        obj,
        read: () => obj[field],
      });
    }
  }

  /**
   * Tracks a getter-backed value. Editing is disabled unless an explicit
   * parser, validator, and setter contract is supplied through `editor`.
   * Returns an idempotent function that removes this tracked value.
   */
  track<T>(definition: FlxWatchDefinition<T>): () => void {
    if (definition.name.trim().length === 0) {
      throw new Error('Tracked watch values require a non-empty name.');
    }
    const id = `watch-${this.#nextId++}`;
    const entry: StoredWatchEntry = {
      displayName: definition.name,
      ...(definition.editor === undefined
        ? {}
        : { editor: definition.editor as FlxWatchEditor<unknown> }),
      ...(definition.format === undefined
        ? {}
        : { format: definition.format as (value: unknown) => string }),
      id,
      read: definition.read,
    };
    this.#entries.push(entry);
    return () => {
      const index = this.#entries.indexOf(entry);
      if (index >= 0) this.#entries.splice(index, 1);
    };
  }

  /**
   * Tracks an explicit shallow field list from an object as read-only values.
   * No prototype traversal or implicit property discovery is performed.
   */
  trackObject<T extends object, K extends Extract<keyof T, string>>(
    name: string,
    obj: T,
    fields: readonly K[],
  ): () => void {
    if (name.trim().length === 0) {
      throw new Error('Tracked objects require a non-empty name.');
    }
    const removers = fields.map((field) =>
      this.track({
        name: `${name}.${field}`,
        read: () => obj[field],
      }),
    );
    return () => {
      for (const remove of removers) remove();
    };
  }

  /** Installs or clears the global policy checked before editable mutations. */
  setMutationGuard(guard: FlxWatchMutationGuard | null): void {
    this.#mutationGuard = guard;
  }

  /** Parses, validates, and applies an explicitly registered editable value. */
  edit(id: string, input: string): FlxWatchMutationResult {
    const entry = this.#entries.find((candidate) => candidate.id === id);
    if (entry === undefined)
      return { error: 'Tracked value no longer exists.', ok: false };
    if (entry.editor === undefined) {
      return { error: 'Tracked value is read-only.', ok: false };
    }

    try {
      const guardResult = this.#mutationGuard?.() ?? true;
      if (guardResult !== true) {
        return {
          error:
            typeof guardResult === 'string'
              ? guardResult
              : 'Debugger mutations are currently disabled.',
          ok: false,
        };
      }
      const currentValue = entry.read();
      const value = entry.editor.parse(input, currentValue);
      const validationError = entry.editor.validate?.(value, currentValue);
      if (validationError != null) return { error: validationError, ok: false };
      entry.editor.set(value, currentValue);
      return { ok: true, snapshot: this.#snapshotEntry(entry) };
    } catch (cause) {
      return {
        error: cause instanceof Error ? cause.message : String(cause),
        ok: false,
      };
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
    return this.#entries.map((entry) => this.#snapshotEntry(entry));
  }

  #snapshotEntry(entry: StoredWatchEntry): WatchSnapshot {
    let value: string;
    try {
      const raw = entry.read();
      value = entry.format
        ? entry.format(raw)
        : typeof raw === 'number'
          ? raw.toFixed(2)
          : String(raw ?? 'undefined');
    } catch {
      value = '<error>';
    }
    return {
      editable: entry.editor !== undefined,
      id: entry.id,
      name: entry.displayName,
      value,
    };
  }
}
