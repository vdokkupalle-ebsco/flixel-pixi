import { FlxG } from '../core/flx-g';

/**
 * Maps logical action names to one or more key names for thin input querying.
 * @public
 */
export class FlxActions {
  readonly #bindings = new Map<string, string[]>();

  /**
   * Bind an action name to one or more key names.
   * Overwrites existing key bindings for this action name.
   */
  bind(action: string, ...keys: string[]): void {
    this.#bindings.set(action, keys);
  }

  /** Unbind an action name. */
  unbind(action: string): void {
    this.#bindings.delete(action);
  }

  /** Clear all action bindings. */
  reset(): void {
    this.#bindings.clear();
  }

  /** Returns true if ANY bound key for this action is currently pressed down. */
  pressed(action: string): boolean {
    const keys = this.#bindings.get(action);
    if (!keys) return false;
    for (const key of keys) {
      if (FlxG.keys.pressed(key)) return true;
    }
    return false;
  }

  /** Returns true if ANY bound key for this action was just pressed in this frame. */
  justPressed(action: string): boolean {
    const keys = this.#bindings.get(action);
    if (!keys) return false;
    for (const key of keys) {
      if (FlxG.keys.justPressed(key)) return true;
    }
    return false;
  }

  /** Returns true if ANY bound key for this action was just released in this frame. */
  justReleased(action: string): boolean {
    const keys = this.#bindings.get(action);
    if (!keys) return false;
    for (const key of keys) {
      if (FlxG.keys.justReleased(key)) return true;
    }
    return false;
  }
}
