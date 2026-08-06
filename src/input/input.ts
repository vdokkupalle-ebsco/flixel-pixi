/** A recorded key transition compatible with the AS3 replay shape. @public */
export interface FlxKeyRecord {
  readonly code: number;
  readonly value: number;
}

interface KeyState {
  current: number;
  readonly name: string;
}

interface QueuedKeyEvent {
  readonly code: number;
  readonly down: boolean;
}

/** Deterministic named digital-input state machine. @public */
export class Input {
  protected readonly lookup = new Map<string, number>();
  private readonly map = new Map<number, KeyState>();
  readonly #queue: QueuedKeyEvent[] = [];
  #destroyed = false;

  /** Publishes queued transitions for one authoritative simulation step. */
  update(): void {
    this.#assertUsable();
    for (const state of this.map.values()) {
      if (state.current === -1) state.current = 0;
      else if (state.current === 2) state.current = 1;
    }

    const transitioned = new Set<number>();
    const deferred: QueuedKeyEvent[] = [];
    for (const event of this.#queue) {
      if (transitioned.has(event.code)) {
        deferred.push(event);
        continue;
      }
      const state = this.map.get(event.code);
      if (state === undefined) continue;
      state.current = event.down
        ? state.current > 0
          ? 1
          : 2
        : state.current > 0
          ? -1
          : 0;
      transitioned.add(event.code);
    }
    this.#queue.length = 0;
    this.#queue.push(...deferred);
  }

  reset(): void {
    this.#assertUsable();
    this.#queue.length = 0;
    for (const state of this.map.values()) {
      state.current = 0;
    }
  }

  pressed(key: string): boolean {
    const state = this.#stateForName(key);
    return state !== null && state.current > 0;
  }

  justPressed(key: string): boolean {
    return this.#stateForName(key)?.current === 2;
  }

  justReleased(key: string): boolean {
    return this.#stateForName(key)?.current === -1;
  }

  record(): FlxKeyRecord[] | null {
    this.#assertUsable();
    const data: FlxKeyRecord[] = [];
    for (const [code, state] of this.map) {
      if (state.current !== 0) data.push({ code, value: state.current });
    }
    return data.length === 0 ? null : data;
  }

  playback(record: readonly FlxKeyRecord[] | null): void {
    this.#assertUsable();
    this.#queue.length = 0;
    for (const state of this.map.values()) state.current = 0;
    if (record === null) return;
    for (const item of record) {
      const state = this.map.get(item.code);
      if (state === undefined) continue;
      state.current = item.value;
    }
  }

  getKeyCode(keyName: string): number {
    return this.lookup.get(keyName.toUpperCase()) ?? -1;
  }

  any(): boolean {
    for (const state of this.map.values()) {
      if (state.current > 0) return true;
    }
    return false;
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#queue.length = 0;
    this.lookup.clear();
    this.map.clear();
  }

  protected addKey(keyName: string, keyCode: number): void {
    const name = keyName.toUpperCase();
    if (!Number.isInteger(keyCode) || keyCode < 0) {
      throw new RangeError('Key code must be a non-negative integer.');
    }
    this.lookup.set(name, keyCode);
    this.map.set(keyCode, { current: 0, name });
    if (!(name in this)) {
      Object.defineProperty(this, name, {
        configurable: true,
        enumerable: true,
        get: () => this.pressed(name),
      });
    }
  }

  protected addAlias(alias: string, keyName: string): void {
    const code = this.getKeyCode(keyName);
    if (code < 0) throw new Error(`Cannot alias unknown key "${keyName}".`);
    this.lookup.set(alias.toUpperCase(), code);
  }

  protected queueKeyCode(keyCode: number, down: boolean): void {
    if (!this.map.has(keyCode)) return;
    this.#queue.push({ code: keyCode, down });
  }

  protected hasKeyCode(keyCode: number): boolean {
    return this.map.has(keyCode);
  }

  /** Drops unpublished events and queues releases for every published key. */
  protected queueReleaseAll(): void {
    this.#queue.length = 0;
    for (const [code, state] of this.map) {
      if (state.current > 0) this.#queue.push({ code, down: false });
    }
  }

  #stateForName(key: string): KeyState | null {
    const code = this.lookup.get(key.toUpperCase());
    return code === undefined ? null : (this.map.get(code) ?? null);
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('Input has been destroyed.');
  }
}
