import { FlxG } from './flx-g';
import { FlxGroup } from './flx-group';
import { FlxSignal } from './flx-signal';
import type { FlxSubState } from './flx-sub-state';
import type { FlxPhysicsWorld } from '../physics/flx-physics-world';

function markRenderablesDirty(): void {
  try {
    FlxG.context.markRenderablesDirty();
  } catch {
    // States may be constructed and exercised without an active context.
  }
}

/** Base game state; initialize state-owned objects in `create`. @public */
export class FlxState extends FlxGroup {
  persistentUpdate = false;
  persistentDraw = true;
  destroySubStates = true;
  subState: FlxSubState | null = null;
  #physicsWorld: FlxPhysicsWorld | null = null;

  readonly #subStateOpened = new FlxSignal<FlxSubState>();
  readonly #subStateClosed = new FlxSignal<FlxSubState>();
  #requestedSubState: FlxSubState | null = null;
  #subStateResetRequested = false;

  /** Dispatched after a requested substate has opened. */
  get subStateOpened(): FlxSignal<FlxSubState> {
    return this.#subStateOpened;
  }

  /** Dispatched after the current substate has closed. */
  get subStateClosed(): FlxSignal<FlxSubState> {
    return this.#subStateClosed;
  }

  create(): void {
    // State initialization hook.
  }

  /** Optional state-owned physics world, advanced after ordinary members. */
  get physicsWorld(): FlxPhysicsWorld | null {
    if (this.#physicsWorld?.destroyed) this.#physicsWorld = null;
    return this.#physicsWorld;
  }

  /**
   * Install a physics world and optionally destroy the previous one.
   * The same world may be installed repeatedly without resetting it.
   */
  setPhysicsWorld(
    world: FlxPhysicsWorld | null,
    destroyPrevious = true,
  ): FlxPhysicsWorld | null {
    if (world?.destroyed) {
      throw new Error('Cannot install a destroyed physics world.');
    }
    if (world === this.physicsWorld) return world;
    const previous = this.#physicsWorld;
    world?.attachOwner(this);
    this.#physicsWorld = world;
    previous?.detachOwner(this);
    if (destroyPrevious) previous?.destroy();
    return world;
  }

  /** Remove the current physics world and optionally release it. */
  removePhysicsWorld(destroy = true): FlxPhysicsWorld | null {
    const previous = this.#physicsWorld;
    this.#physicsWorld = null;
    previous?.detachOwner(this);
    if (destroy) previous?.destroy();
    return previous;
  }

  openSubState(subState: FlxSubState): void {
    this.#requestedSubState = subState;
    this.#subStateResetRequested = true;
  }

  closeSubState(): void {
    this.#requestedSubState = null;
    this.#subStateResetRequested = true;
  }

  /** Applies a deferred substate request. Normally called by the game loop. */
  resetSubState(): void {
    const previous = this.subState;
    const next = this.#requestedSubState;
    this.#requestedSubState = null;
    this.#subStateResetRequested = false;

    if (previous !== null) {
      previous.closeCallback?.();
      this.#subStateClosed.dispatch(previous);
      previous.deactivate();
      if (this.destroySubStates && previous !== next) previous.destroy();
    }

    this.subState = next;
    if (next !== null) {
      if (!this.persistentUpdate) {
        try {
          FlxG.resetInput();
        } catch {
          // A state lifecycle can also run under the headless core alone.
        }
      }
      next.activate(this);
      next.openCallback?.();
      this.#subStateOpened.dispatch(next);
    }
    markRenderablesDirty();
  }

  /** @internal Advances this state and its active nested substate. */
  tryUpdate(): void {
    if (this.persistentUpdate || this.subState === null) {
      this.update();
      this.physicsWorld?.step(FlxG.elapsed);
    }

    if (this.#subStateResetRequested) this.resetSubState();
    this.subState?.tryUpdate();
  }

  override draw(): void {
    if (this.persistentDraw || this.subState === null) super.draw();
    this.subState?.draw();
  }

  override destroy(): void {
    const activeSubState = this.subState;
    const requestedSubState = this.#requestedSubState;
    this.subState = null;
    this.#requestedSubState = null;
    this.#subStateResetRequested = false;
    this.removePhysicsWorld();
    activeSubState?.destroy();
    if (requestedSubState !== null && requestedSubState !== activeSubState) {
      requestedSubState.destroy();
    }
    this.#subStateOpened.destroy();
    this.#subStateClosed.destroy();
    super.destroy();
  }
}

/** Zero-argument state constructor used by reset and startup. @public */
export type FlxStateConstructor<T extends FlxState = FlxState> = new () => T;
