import { afterEach, describe, expect, it } from 'vitest';

import {
  FlxBasic,
  FlxGame,
  FlxPhysicsWorld,
  FlxState,
  FlxSubState,
} from '../../src';
import type {
  FlxPhysicsAabb,
  FlxPhysicsBackendBody,
  FlxPhysicsBackendContact,
  FlxPhysicsBackendQueryHit,
  FlxPhysicsBackendWorld,
  FlxPhysicsBodyDefinition,
  FlxPhysicsBodyState,
  FlxPhysicsBodyType,
  FlxPhysicsQueryFilter,
  FlxPhysicsTransform,
  FlxPhysicsVector,
} from '../../src';

class RecordingBackend implements FlxPhysicsBackendWorld {
  readonly capabilities = Object.freeze({
    shapes: Object.freeze(['box', 'circle'] as const),
    queries: Object.freeze(['point', 'aabb'] as const),
    joints: Object.freeze([]),
    sleeping: false,
    continuousCollision: false,
    deterministicReplay: true,
    debugGeometry: false,
  });

  readonly trace: string[] = [];
  readonly steps: number[] = [];
  destroys = 0;
  resets = 0;
  gravity: FlxPhysicsVector = { x: 0, y: 0 };

  setGravity(gravity: FlxPhysicsVector): void {
    this.gravity = gravity;
    this.trace.push(`gravity:${gravity.x},${gravity.y}`);
  }

  createBody(definition: FlxPhysicsBodyDefinition): FlxPhysicsBackendBody {
    void definition;
    return {};
  }

  destroyBody(body: FlxPhysicsBackendBody): void {
    void body;
  }

  setBodyType(body: FlxPhysicsBackendBody, type: FlxPhysicsBodyType): void {
    void body;
    void type;
  }

  setBodyTransform(
    body: FlxPhysicsBackendBody,
    transform: FlxPhysicsTransform,
  ): void {
    void body;
    void transform;
  }

  setBodyVelocity(
    body: FlxPhysicsBackendBody,
    velocity: FlxPhysicsVector,
    angularVelocity: number,
  ): void {
    void body;
    void velocity;
    void angularVelocity;
  }

  getBodyState(body: FlxPhysicsBackendBody): FlxPhysicsBodyState {
    void body;
    return {
      position: { x: 0, y: 0 },
      angle: 0,
      velocity: { x: 0, y: 0 },
      angularVelocity: 0,
      awake: true,
    };
  }

  applyForce(
    body: FlxPhysicsBackendBody,
    force: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    void body;
    void force;
    void point;
  }

  applyImpulse(
    body: FlxPhysicsBackendBody,
    impulse: FlxPhysicsVector,
    point?: FlxPhysicsVector,
  ): void {
    void body;
    void impulse;
    void point;
  }

  queryPoint(
    point: FlxPhysicsVector,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[] {
    void point;
    void filter;
    return [];
  }

  queryAabb(
    bounds: FlxPhysicsAabb,
    filter?: FlxPhysicsQueryFilter,
  ): readonly FlxPhysicsBackendQueryHit[] {
    void bounds;
    void filter;
    return [];
  }

  drainContacts(): readonly FlxPhysicsBackendContact[] {
    return [];
  }

  step(elapsed: number): void {
    this.steps.push(elapsed);
    this.trace.push(`physics:${elapsed}`);
  }

  reset(): void {
    this.resets += 1;
  }

  destroy(): void {
    this.destroys += 1;
  }
}

let game: FlxGame | null = null;

afterEach(() => {
  game?.destroy();
  game = null;
});

describe('FlxPhysicsWorld', () => {
  it('uses logical gravity and advances once after ordinary state work', () => {
    const backend = new RecordingBackend();
    const trace = backend.trace;

    class Member extends FlxBasic {
      override postUpdate(): void {
        trace.push('member:post');
      }
    }

    class State extends FlxState {
      override create(): void {
        this.add(new Member());
        this.setPhysicsWorld(
          new FlxPhysicsWorld(backend, { gravity: { x: 0, y: 900 } }),
        );
      }

      override update(): void {
        trace.push('state:before');
        super.update();
        trace.push('state:after');
      }
    }

    game = new FlxGame(320, 240, State);
    game.step(1 / 30);

    expect(backend.gravity).toEqual({ x: 0, y: 900 });
    expect(backend.steps).toEqual([1 / 30]);
    expect(trace).toEqual([
      'gravity:0,900',
      'state:before',
      'member:post',
      'state:after',
      `physics:${1 / 30}`,
    ]);
  });

  it('pauses independently and validates fixed-step input', () => {
    const backend = new RecordingBackend();
    const world = new FlxPhysicsWorld(backend, { paused: true });

    world.step(1 / 60);
    expect(backend.steps).toEqual([]);
    world.paused = false;
    world.step(1 / 60);
    expect(backend.steps).toEqual([1 / 60]);
    expect(() => world.step(0)).toThrow(RangeError);
    expect(() => world.setGravity({ x: Number.NaN, y: 0 })).toThrow(RangeError);
    world.reset();
    expect(backend.resets).toBe(1);
    world.destroy();
    world.destroy();
    expect(backend.destroys).toBe(1);
    expect(() => world.step(1 / 60)).toThrow('destroyed');
  });

  it('owns replacement and removal without double destruction', () => {
    const state = new FlxState();
    const firstBackend = new RecordingBackend();
    const secondBackend = new RecordingBackend();
    const first = new FlxPhysicsWorld(firstBackend);
    const second = new FlxPhysicsWorld(secondBackend);

    expect(state.setPhysicsWorld(first)).toBe(first);
    expect(state.setPhysicsWorld(first)).toBe(first);
    expect(firstBackend.destroys).toBe(0);
    state.setPhysicsWorld(second);
    expect(firstBackend.destroys).toBe(1);
    expect(state.removePhysicsWorld(false)).toBe(second);
    expect(secondBackend.destroys).toBe(0);
    state.setPhysicsWorld(second);
    state.destroy();
    state.destroy();
    expect(secondBackend.destroys).toBe(1);
    expect(() => state.setPhysicsWorld(second)).toThrow('destroyed');
  });

  it('prevents two states from owning the same live world', () => {
    const firstState = new FlxState();
    const secondState = new FlxState();
    const world = new FlxPhysicsWorld(new RecordingBackend());

    firstState.setPhysicsWorld(world);
    expect(() => secondState.setPhysicsWorld(world)).toThrow(
      'already owned by another state',
    );
    expect(secondState.physicsWorld).toBeNull();
    firstState.removePhysicsWorld(false);
    expect(secondState.setPhysicsWorld(world)).toBe(world);
    world.destroy();
    expect(secondState.physicsWorld).toBeNull();
    secondState.destroy();
  });

  it('steps parent and nested worlds according to substate persistence', () => {
    const parentBackend = new RecordingBackend();
    const childBackend = new RecordingBackend();
    const overlay = new (class extends FlxSubState {
      override create(): void {
        this.setPhysicsWorld(new FlxPhysicsWorld(childBackend));
      }
    })();

    class State extends FlxState {
      override create(): void {
        this.setPhysicsWorld(new FlxPhysicsWorld(parentBackend));
        this.openSubState(overlay);
      }
    }

    game = new FlxGame(320, 240, State);
    game.step(1 / 60);
    expect(parentBackend.steps).toHaveLength(1);
    expect(childBackend.steps).toHaveLength(1);

    game.step(1 / 60);
    expect(parentBackend.steps).toHaveLength(1);
    expect(childBackend.steps).toHaveLength(2);

    if (game.state !== null) game.state.persistentUpdate = true;
    game.step(1 / 60);
    expect(parentBackend.steps).toHaveLength(2);
    expect(childBackend.steps).toHaveLength(3);
  });

  it('destroys worlds on state changes and failed state creation', () => {
    const firstBackend = new RecordingBackend();
    const failedBackend = new RecordingBackend();

    class FirstState extends FlxState {
      override create(): void {
        this.setPhysicsWorld(new FlxPhysicsWorld(firstBackend));
      }
    }

    class FailedState extends FlxState {
      override create(): void {
        this.setPhysicsWorld(new FlxPhysicsWorld(failedBackend));
        throw new Error('failed');
      }
    }

    game = new FlxGame(320, 240, FirstState);
    game.step();
    game.requestState(new FailedState());
    expect(() => game?.step()).toThrow('failed');
    expect(firstBackend.destroys).toBe(1);
    expect(failedBackend.destroys).toBe(1);
  });
});
