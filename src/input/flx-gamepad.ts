import { clamp, clamp01 } from '../math/flx-math';

/** Standard Web Gamepad button indices. @public */
export enum FlxGamepadButton {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LEFT_SHOULDER = 4,
  RIGHT_SHOULDER = 5,
  LEFT_TRIGGER = 6,
  RIGHT_TRIGGER = 7,
  BACK = 8,
  START = 9,
  LEFT_STICK = 10,
  RIGHT_STICK = 11,
  DPAD_UP = 12,
  DPAD_DOWN = 13,
  DPAD_LEFT = 14,
  DPAD_RIGHT = 15,
  HOME = 16,
}

/** Minimal browser gamepad button shape used by the injectable provider. @public */
export interface FlxGamepadButtonLike {
  readonly pressed: boolean;
  readonly touched?: boolean;
  readonly value: number;
}

/** Browser-neutral gamepad snapshot accepted by the manager. @public */
export interface FlxGamepadLike {
  readonly axes: readonly number[];
  readonly buttons: readonly FlxGamepadButtonLike[];
  readonly connected: boolean;
  readonly id: string;
  readonly index: number;
  readonly mapping?: string;
  readonly timestamp?: number;
}

/** Serializable authoritative gamepad state for one replay frame. @public */
export interface FlxGamepadFrameRecord {
  readonly axes: number[];
  readonly buttons: { state: number; value: number }[];
  readonly id: string;
  readonly index: number;
  readonly mapping: string;
  readonly uid: number;
}

/** Function polled exactly once at each authoritative simulation step. @public */
export type FlxGamepadProvider = () => readonly (FlxGamepadLike | null)[];

interface ButtonState {
  current: number;
  value: number;
}

/** One stable logical controller, retained across disconnect/reconnect. @public */
export class FlxGamepad {
  readonly uid: number;
  readonly id: string;
  readonly mapping: string;
  connected = false;
  deadZone = 0.15;

  readonly #buttons: ButtonState[] = [];
  #axes: number[] = [];
  #index: number;

  /** @internal */
  constructor(uid: number, source: FlxGamepadLike) {
    this.uid = uid;
    this.#index = source.index;
    this.id = source.id;
    this.mapping = source.mapping ?? '';
  }

  get axisCount(): number {
    return this.#axes.length;
  }

  get buttonCount(): number {
    return this.#buttons.length;
  }

  get index(): number {
    return this.#index;
  }

  pressed(button: number): boolean {
    return (this.#buttons[button]?.current ?? 0) > 0;
  }

  justPressed(button: number): boolean {
    return this.#buttons[button]?.current === 2;
  }

  justReleased(button: number): boolean {
    return this.#buttons[button]?.current === -1;
  }

  getButtonValue(button: number): number {
    return this.#buttons[button]?.value ?? 0;
  }

  getAxis(axis: number, deadZone = this.deadZone): number {
    const value = this.#axes[axis] ?? 0;
    const boundedDeadZone = clamp(deadZone, 0, 0.99);
    const magnitude = Math.abs(value);
    if (magnitude <= boundedDeadZone) return 0;
    return (
      Math.sign(value) *
      clamp01((magnitude - boundedDeadZone) / (1 - boundedDeadZone))
    );
  }

  axisPressed(axis: number, direction: -1 | 1, threshold = 0.5): boolean {
    const boundedThreshold = clamp01(threshold);
    return this.getAxis(axis) * direction >= boundedThreshold;
  }

  /** @internal */
  update(source: FlxGamepadLike | null): void {
    const connected = source?.connected === true;
    const buttonCount = Math.max(
      source?.buttons.length ?? 0,
      this.#buttons.length,
    );
    for (let index = 0; index < buttonCount; index += 1) {
      const state = this.#buttons[index] ?? { current: 0, value: 0 };
      const sourceButton = source?.buttons[index];
      const value = connected ? clamp01(sourceButton?.value ?? 0) : 0;
      const down =
        connected && (sourceButton?.pressed === true || value >= 0.5);
      const wasDown = state.current > 0;
      state.current = down ? (wasDown ? 1 : 2) : wasDown ? -1 : 0;
      state.value = value;
      this.#buttons[index] = state;
    }
    this.#axes = connected
      ? source.axes.map((value) =>
          clamp(Number.isFinite(value) ? value : 0, -1, 1),
        )
      : this.#axes.map(() => 0);
    this.connected = connected;
  }

  /** @internal */
  record(): FlxGamepadFrameRecord {
    return {
      axes: [...this.#axes],
      buttons: this.#buttons.map((button) => ({
        state: button.current,
        value: button.value,
      })),
      id: this.id,
      index: this.index,
      mapping: this.mapping,
      uid: this.uid,
    };
  }

  /** @internal */
  reset(): void {
    this.connected = false;
    this.#axes.fill(0);
    for (const button of this.#buttons) {
      button.current = 0;
      button.value = 0;
    }
  }

  /** @internal */
  reconnectAt(index: number): void {
    this.#index = index;
  }

  /** @internal */
  playback(record: FlxGamepadFrameRecord): void {
    const buttonCount = Math.max(record.buttons.length, this.#buttons.length);
    for (let index = 0; index < buttonCount; index += 1) {
      const button = record.buttons[index];
      const state = this.#buttons[index] ?? { current: 0, value: 0 };
      state.current =
        button === undefined ? 0 : clamp(Math.trunc(button.state), -1, 2);
      state.value = button === undefined ? 0 : clamp01(button.value);
      this.#buttons[index] = state;
    }
    this.#axes = record.axes.map((value) =>
      clamp(Number.isFinite(value) ? value : 0, -1, 1),
    );
    this.connected = true;
  }
}

/** Fixed-step Web Gamepad poller with reconnect-stable logical IDs. @public */
export class FlxGamepadManager {
  readonly #provider: FlxGamepadProvider;
  readonly #byIndex = new Map<number, FlxGamepad>();
  readonly #byUid = new Map<number, FlxGamepad>();
  #nextUid = 0;
  #destroyed = false;

  constructor(provider: FlxGamepadProvider = defaultGamepadProvider) {
    this.#provider = provider;
  }

  get connected(): readonly FlxGamepad[] {
    return [...this.#byUid.values()].filter((gamepad) => gamepad.connected);
  }

  getByID(uid: number): FlxGamepad | null {
    return this.#byUid.get(uid) ?? null;
  }

  getByIndex(index: number): FlxGamepad | null {
    return this.#byIndex.get(index) ?? null;
  }

  get firstActive(): FlxGamepad | null {
    return this.connected[0] ?? null;
  }

  update(): void {
    this.#assertUsable();
    this.#apply(this.#provider());
  }

  record(): FlxGamepadFrameRecord[] {
    return this.connected.map((gamepad) => gamepad.record());
  }

  playback(records: readonly FlxGamepadFrameRecord[]): void {
    this.#assertUsable();
    const seen = new Set<number>();
    for (const record of records) {
      seen.add(record.uid);
      let gamepad = this.#byUid.get(record.uid);
      if (gamepad === undefined || gamepad.id !== record.id) {
        gamepad = new FlxGamepad(record.uid, {
          axes: record.axes,
          buttons: record.buttons.map((button) => ({
            pressed: button.state > 0,
            value: button.value,
          })),
          connected: true,
          id: record.id,
          index: record.index,
          mapping: record.mapping,
        });
        this.#nextUid = Math.max(this.#nextUid, record.uid + 1);
        this.#byUid.set(record.uid, gamepad);
      }
      if (gamepad.index !== record.index) {
        if (this.#byIndex.get(gamepad.index) === gamepad) {
          this.#byIndex.delete(gamepad.index);
        }
        gamepad.reconnectAt(record.index);
      }
      const indexed = this.#byIndex.get(record.index);
      if (indexed !== undefined && indexed !== gamepad) indexed.update(null);
      this.#byIndex.set(record.index, gamepad);
      gamepad.playback(record);
    }
    for (const gamepad of this.#byUid.values()) {
      if (!seen.has(gamepad.uid)) gamepad.update(null);
    }
  }

  reset(): void {
    this.#assertUsable();
    for (const gamepad of this.#byUid.values()) gamepad.reset();
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#byIndex.clear();
    this.#byUid.clear();
  }

  #apply(sources: readonly (FlxGamepadLike | null)[]): void {
    const seen = new Set<number>();
    for (const source of sources) {
      if (source === null || !source.connected) continue;
      seen.add(source.index);
      let gamepad = this.#byIndex.get(source.index);
      if (gamepad === undefined) {
        const candidates = [...this.#byUid.values()].filter(
          (candidate) => !candidate.connected && candidate.id === source.id,
        );
        if (candidates.length === 1) gamepad = candidates[0];
      }
      if (gamepad === undefined || gamepad.id !== source.id) {
        gamepad = new FlxGamepad(this.#nextUid, source);
        this.#nextUid = Math.max(this.#nextUid, gamepad.uid + 1);
        this.#byUid.set(gamepad.uid, gamepad);
      }
      if (gamepad.index !== source.index) {
        if (this.#byIndex.get(gamepad.index) === gamepad) {
          this.#byIndex.delete(gamepad.index);
        }
        gamepad.reconnectAt(source.index);
      }
      const indexed = this.#byIndex.get(source.index);
      if (indexed !== undefined && indexed !== gamepad) indexed.update(null);
      this.#byIndex.set(source.index, gamepad);
      gamepad.update(source);
    }
    for (const gamepad of this.#byUid.values()) {
      if (!seen.has(gamepad.index)) gamepad.update(null);
    }
  }

  #assertUsable(): void {
    if (this.#destroyed)
      throw new Error('FlxGamepadManager has been destroyed.');
  }
}

function defaultGamepadProvider(): readonly (FlxGamepadLike | null)[] {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.getGamepads !== 'function'
  )
    return [];
  return Array.from(navigator.getGamepads());
}
