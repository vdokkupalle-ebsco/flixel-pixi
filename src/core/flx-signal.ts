/** Listener registered with {@link FlxSignal}. @public */
export type FlxSignalListener<T> = (value: T) => void;

/** Small mutation-safe signal used by state lifecycle events. @public */
export class FlxSignal<T> {
  readonly #listeners = new Set<FlxSignalListener<T>>();

  add(listener: FlxSignalListener<T>): FlxSignalListener<T> {
    this.#listeners.add(listener);
    return listener;
  }

  remove(listener: FlxSignalListener<T>): boolean {
    return this.#listeners.delete(listener);
  }

  dispatch(value: T): void {
    for (const listener of Array.from(this.#listeners)) {
      if (this.#listeners.has(listener)) listener(value);
    }
  }

  clear(): void {
    this.#listeners.clear();
  }

  destroy(): void {
    this.clear();
  }
}
