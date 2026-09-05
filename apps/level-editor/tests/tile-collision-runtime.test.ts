import { describe, expect, it, vi } from 'vitest';
import { FlxObject, FlxPhysicsWorld, FlxState } from 'flixel-pixi';
import { createPlanckPhysicsBackend } from '@flixel-pixi/physics-planck';
import { addTileCollisionBodies } from '../src/tile-collision-runtime';
import { layerTileColliders, type TileCollider } from '../src/tile-collision';

const floor = (): TileCollider[] =>
  layerTileColliders(
    {
      id: 'floor',
      name: 'Floor',
      purpose: 'gameplay',
      order: 0,
      locked: false,
      visible: true,
      tileCollision: { enabled: true, friction: 0.6, restitution: 0 },
      tilemap: {
        tileSize: 16,
        cells: Object.fromEntries(
          [0, 1, 2, 3, 7, 8, 9, 10].map((x) => [
            `${x},8`,
            { assetId: 'ground', x: 0, y: 0, width: 16, height: 16 },
          ]),
        ),
      },
    },
    { width: 320, height: 320 },
  );

describe('generated tile physics', () => {
  it('lands a dynamic object on merged tiles while another falls through the gap', () => {
    const world = new FlxPhysicsWorld(createPlanckPhysicsBackend(), {
      gravity: { x: 0, y: 900 },
    });
    const state = new FlxState();
    state.setPhysicsWorld(world);
    try {
      const spy = vi.spyOn(world, 'addBody');
      for (const ground of addTileCollisionBodies(world, floor()))
        state.add(ground);
      expect(world.bodyCount).toBe(2);
      expect(spy.mock.calls[0]?.[1]).toMatchObject({
        type: 'static',
        shapes: [{ kind: 'box', width: 64, height: 16 }],
        material: { friction: 0.6, restitution: 0 },
      });
      const player = new FlxObject(24, 0, 16, 16);
      state.add(player);
      const falling = new FlxObject(80, 0, 16, 16);
      state.add(falling);
      for (const object of [player, falling])
        world.addBody(object, {
          type: 'dynamic',
          fixedRotation: true,
          shapes: [{ kind: 'box', width: 16, height: 16 }],
        });
      for (let i = 0; i < 120; i++) world.step(1 / 60);
      expect(player.y + player.height).toBeGreaterThan(125);
      expect(player.y + player.height).toBeLessThan(129);
      expect(player.velocity.y).toBeCloseTo(0, 1);
      expect(falling.y).toBeGreaterThan(320);
    } finally {
      state.destroy();
    }
    expect(world.destroyed).toBe(true);
    expect(world.bodyCount).toBe(0);
  });
  it('avoids user body IDs and releases generated objects cleanly on reset', () => {
    const world = new FlxPhysicsWorld(createPlanckPhysicsBackend());
    const existing = new FlxObject(0, 0, 10, 10);
    try {
      world.addBody(existing, {
        id: 'tile-collision-1',
        type: 'static',
        shapes: [{ kind: 'box', width: 10, height: 10 }],
      });
      const objects = addTileCollisionBodies(world, floor());
      expect(world.bodyCount).toBe(3);
      expect(world.getBody(objects[0] ?? existing)?.id).toBe(
        'tile-collision-2',
      );
      for (const object of objects) object.destroy();
      expect(world.bodyCount).toBe(1);
      const rebuilt = addTileCollisionBodies(world, floor());
      expect(rebuilt).toHaveLength(2);
      expect(world.bodyCount).toBe(3);
      for (const object of rebuilt) object.destroy();
    } finally {
      existing.destroy();
      world.destroy();
    }
  });
});
