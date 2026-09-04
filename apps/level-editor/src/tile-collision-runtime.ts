import { FlxObject, type FlxPhysicsWorld } from 'flixel-pixi';
import type { TileCollider } from './tile-collision';

/** Runtime-only objects; callers add these to the state so reset/close destroys them. */
export function addTileCollisionBodies(
  world: FlxPhysicsWorld,
  colliders: readonly TileCollider[],
): FlxObject[] {
  let nextId = 1;
  return colliders.map((collider) => {
    const object = new FlxObject(
      collider.x,
      collider.y,
      collider.width,
      collider.height,
    );
    object.visible = false;
    let id: string;
    do {
      id = `tile-collision-${nextId++}`;
    } while (world.getBody(id));
    world.addBody(object, {
      id,
      type: 'static',
      material: {
        friction: collider.friction,
        restitution: collider.restitution,
      },
      shapes: collider.points
        ? [
            {
              kind: 'polygon',
              vertices: collider.points.map((p) => ({
                x: p.x - collider.x - collider.width / 2,
                y: p.y - collider.y - collider.height / 2,
              })),
            },
          ]
        : [{ kind: 'box', width: collider.width, height: collider.height }],
    });
    return object;
  });
}
