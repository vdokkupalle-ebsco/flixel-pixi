import type { FlxContext } from '../core/flx-context';

/** Service token for controls that expose deterministic virtual input. @public */
export const FLX_VIRTUAL_INPUT_SERVICE = Symbol('flixel-pixi.virtual-input');

/** Read-only digital state published by one virtual control. @public */
export interface FlxVirtualButtonState {
  readonly pressed: boolean;
  readonly justPressed: boolean;
  readonly justReleased: boolean;
  /** Advance this control after authoritative pointer/replay input is ready. @internal */
  updateVirtualInput?(): void;
}

/** Read-only two-axis state published by one virtual stick. @public */
export interface FlxVirtualStickState {
  readonly xAxis: number;
  readonly yAxis: number;
  /** Advance this control after authoritative pointer/replay input is ready. @internal */
  updateVirtualInput?(): void;
}

/** Registry used by {@link FlxActions} to resolve serializable virtual sources. @public */
export class FlxVirtualInput {
  readonly #buttons = new Map<string, FlxVirtualButtonState>();
  readonly #sticks = new Map<string, FlxVirtualStickState>();

  registerButton(id: string, state: FlxVirtualButtonState): void {
    const name = normalizeVirtualInputId(id);
    this.#assertAvailable(name, state);
    const current = this.#buttons.get(name);
    if (current !== undefined && current !== state) {
      throw new Error(`Virtual input id "${name}" is already registered.`);
    }
    this.#buttons.set(name, state);
  }

  unregisterButton(id: string, state: FlxVirtualButtonState): boolean {
    const name = normalizeVirtualInputId(id);
    if (this.#buttons.get(name) !== state) return false;
    return this.#buttons.delete(name);
  }

  getButton(id: string): FlxVirtualButtonState | null {
    return this.#buttons.get(id.trim()) ?? null;
  }

  registerStick(id: string, state: FlxVirtualStickState): void {
    const name = normalizeVirtualInputId(id);
    this.#assertAvailable(name, state);
    const current = this.#sticks.get(name);
    if (current !== undefined && current !== state) {
      throw new Error(`Virtual input id "${name}" is already registered.`);
    }
    this.#sticks.set(name, state);
  }

  unregisterStick(id: string, state: FlxVirtualStickState): boolean {
    const name = normalizeVirtualInputId(id);
    if (this.#sticks.get(name) !== state) return false;
    return this.#sticks.delete(name);
  }

  getStick(id: string): FlxVirtualStickState | null {
    return this.#sticks.get(id.trim()) ?? null;
  }

  /** Advance a stable snapshot once per fixed simulation step. @internal */
  update(): void {
    for (const [id, button] of [...this.#buttons]) {
      if (this.#buttons.get(id) === button) {
        button.updateVirtualInput?.();
      }
    }
    for (const [id, stick] of [...this.#sticks]) {
      if (this.#sticks.get(id) === stick) {
        stick.updateVirtualInput?.();
      }
    }
  }

  clear(): void {
    this.#buttons.clear();
    this.#sticks.clear();
  }

  #assertAvailable(
    id: string,
    state: FlxVirtualButtonState | FlxVirtualStickState,
  ): void {
    const current = this.#buttons.get(id) ?? this.#sticks.get(id);
    if (current !== undefined && current !== state) {
      throw new Error(`Virtual input id "${id}" is already registered.`);
    }
  }
}

/** Return the context-owned virtual-input registry, creating it on demand. @internal */
export function virtualInputForContext(context: FlxContext): FlxVirtualInput {
  let service = context.getService<FlxVirtualInput>(FLX_VIRTUAL_INPUT_SERVICE);
  if (service === undefined) {
    service = new FlxVirtualInput();
    context.setService(FLX_VIRTUAL_INPUT_SERVICE, service);
  }
  return service;
}

export function normalizeVirtualInputId(id: string): string {
  const name = String(id).trim();
  if (name.length === 0) {
    throw new RangeError('Virtual input id cannot be empty.');
  }
  return name;
}
