import type {
  FlxPhysicsBackendWorld,
  FlxPhysicsCapabilities,
  FlxPhysicsVector,
  FlxPhysicsWorldOptions,
} from './flx-physics-types';

const DEFAULT_GRAVITY: FlxPhysicsVector = Object.freeze({ x: 0, y: 0 });

/**
 * State-scoped owner for an optional physics backend.
 *
 * The host advances after normal state members on the fixed Flixel clock. Body
 * binding, contacts, and portable queries are layered onto this owner without
 * exposing backend-native handles to game code.
 * @public
 */
export class FlxPhysicsWorld {
  paused: boolean;

  readonly #backend: FlxPhysicsBackendWorld;
  readonly #capabilities: FlxPhysicsCapabilities;
  #destroyed = false;
  #owner: object | null = null;

  constructor(
    backend: FlxPhysicsBackendWorld,
    options: FlxPhysicsWorldOptions = {},
  ) {
    if (backend === null || typeof backend !== 'object') {
      throw new TypeError('Physics backend must be an object.');
    }
    this.#backend = backend;
    this.#capabilities = freezeCapabilities(backend.capabilities);
    this.paused = options.paused ?? false;
    this.setGravity(options.gravity ?? DEFAULT_GRAVITY);
  }

  /** Immutable feature report supplied by the installed adapter. */
  get capabilities(): FlxPhysicsCapabilities {
    return this.#capabilities;
  }

  /** Whether this world has released its adapter resources. */
  get destroyed(): boolean {
    return this.#destroyed;
  }

  /** Change gravity in logical pixels per second squared. */
  setGravity(gravity: FlxPhysicsVector): void {
    this.#assertUsable();
    validateVector(gravity, 'Physics gravity');
    this.#backend.setGravity({ x: gravity.x, y: gravity.y });
  }

  /** Advance the backend exactly once on the fixed simulation clock. */
  step(elapsed: number): void {
    this.#assertUsable();
    if (!Number.isFinite(elapsed) || elapsed <= 0) {
      throw new RangeError('Physics elapsed time must be positive and finite.');
    }
    if (!this.paused) this.#backend.step(elapsed);
  }

  /** Reset adapter-owned simulation state while keeping the world installed. */
  reset(): void {
    this.#assertUsable();
    this.#backend.reset();
  }

  /** Release the backend once. Safe to call repeatedly. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#backend.destroy();
  }

  /** Claim this world for one state. @internal */
  attachOwner(owner: object): void {
    this.#assertUsable();
    if (this.#owner !== null && this.#owner !== owner) {
      throw new Error('Physics world is already owned by another state.');
    }
    this.#owner = owner;
  }

  /** Release this world from its current state. @internal */
  detachOwner(owner: object): void {
    if (this.#owner === owner) this.#owner = null;
  }

  #assertUsable(): void {
    if (this.#destroyed) throw new Error('Physics world has been destroyed.');
  }
}

function freezeCapabilities(
  capabilities: FlxPhysicsCapabilities,
): FlxPhysicsCapabilities {
  return Object.freeze({
    shapes: Object.freeze([...capabilities.shapes]),
    queries: Object.freeze([...capabilities.queries]),
    joints: Object.freeze([...capabilities.joints]),
    sleeping: capabilities.sleeping,
    continuousCollision: capabilities.continuousCollision,
    deterministicReplay: capabilities.deterministicReplay,
    debugGeometry: capabilities.debugGeometry,
  });
}

function validateVector(vector: FlxPhysicsVector, label: string): void {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new RangeError(`${label} must contain finite x and y values.`);
  }
}
