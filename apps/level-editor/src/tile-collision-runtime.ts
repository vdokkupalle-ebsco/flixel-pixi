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
      shapes: [{ kind: 'box', width: collider.width, height: collider.height }],
    });
    return object;
  });
}
