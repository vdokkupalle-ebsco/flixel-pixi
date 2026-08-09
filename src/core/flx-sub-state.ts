import { FlxState } from './flx-state';

/** Lifecycle callback invoked when a substate opens or closes. @public */
export type FlxSubStateCallback = () => void;

/** A state that can be layered over another state, including another substate. @public */
export class FlxSubState extends FlxState {
  openCallback: FlxSubStateCallback | null = null;
  closeCallback: FlxSubStateCallback | null = null;

  #created = false;
  #parentState: FlxState | null = null;

  /** Closes this substate through its owning state at the next safe boundary. */
  close(): void {
    if (this.#parentState?.subState === this) {
      this.#parentState.closeSubState();
    }
  }

  override destroy(): void {
    this.#parentState = null;
    this.openCallback = null;
    this.closeCallback = null;
    super.destroy();
  }

  /** @internal */
  activate(parentState: FlxState): void {
    this.#parentState = parentState;
    if (!this.#created) {
      this.#created = true;
      this.create();
    }
  }

  /** @internal */
  deactivate(): void {
    this.#parentState = null;
  }
}
