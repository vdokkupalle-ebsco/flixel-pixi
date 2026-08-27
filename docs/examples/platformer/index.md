# Retro Platformer Example

A full platformer demonstrating tilemap collisions, gravity, jump mechanics, coin pickups, and camera target tracking with deadzones.

<DemoEmbed
  src="/games/platformer/index.html"
  title="Retro Platformer"
  controlsHint="Arrow keys or WASD to move and jump. Collect coins!"
  height="480px"
/>

---

## Features Demonstrated

- **Tilemap Level**: Loaded with `FlxTilemap` and collision indices.
- **Physics**: Player acceleration, gravity, max velocity limits, and ground friction drag.
- **Collision Separation**: `FlxObject.separate(player, tilemap)` handles solid ground and walls.
- **Item Overlaps**: `FlxObject.overlap(player, coins, callback)` detects coin collection.
- **Camera Following**: `this.camera.follow(player, 'PLATFORMER')` provides smooth horizontal tracking.

---

## Code Overview

```ts
import {
  FlxCamera,
  FlxObject,
  FlxSprite,
  FlxState,
  FlxTilemap,
} from 'flixel-pixi';

export class PlatformerState extends FlxState {
  private player!: FlxSprite;
  private map!: FlxTilemap;

  override create(): void {
    super.create();

    // 1. Create Tilemap
    this.map = new FlxTilemap();
    this.map.loadMap(csvData, 'assets/tiles.png', 16, 16);
    this.add(this.map);

    // 2. Create Player with gravity
    this.player = new FlxSprite(32, 32);
    this.player.makeGraphic(14, 20, 0x10b981);
    this.player.acceleration.y = 600;
    this.add(this.player);

    // 3. Camera Follow
    this.camera.follow(this.player, 'PLATFORMER', 0.1);
    this.camera.setBounds(0, 0, this.map.width, this.map.height);
  }

  override update(): void {
    super.update();

    // Separate from tiles
    FlxObject.separate(this.player, this.map);
  }
}
```

[View Source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/platformer)
