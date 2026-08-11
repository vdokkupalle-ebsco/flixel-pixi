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

/** Registry used by {@link FlxActions} to resolve serializable virtual sources. @public */
export class FlxVirtualInput {
  readonly #buttons = new Map<string, FlxVirtualButtonState>();

  registerButton(id: string, state: FlxVirtualButtonState): void {
    const name = normalizeVirtualInputId(id);
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

  /** Advance a stable snapshot once per fixed simulation step. @internal */
  update(): void {
    for (const [id, button] of [...this.#buttons]) {
      if (this.#buttons.get(id) === button) {
        button.updateVirtualInput?.();
      }
    }
  }

  clear(): void {
    this.#buttons.clear();
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
