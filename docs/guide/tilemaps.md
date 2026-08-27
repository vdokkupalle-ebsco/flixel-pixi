# Tilemaps & Level Design

`FlxTilemap` renders grid-based tile levels and handles optimized spatial tile collision.

---

## Loading a Map from CSV

You can load a level directly from a CSV string:

```ts
import { FlxObject, FlxTilemap } from 'flixel-pixi';

const mapData = `
1,1,1,1,1,1,1,1,1,1
1,0,0,0,0,0,0,0,0,1
1,0,0,0,1,1,0,0,0,1
1,0,1,0,0,0,0,1,0,1
1,1,1,1,1,1,1,1,1,1
`.trim();

const tilemap = new FlxTilemap();
// loadMap(mapData, tileGraphic, tileWidth, tileHeight, autoTile, startingIndex, drawIndex, collideIndex)
tilemap.loadMap(mapData, 'assets/tiles.png', 32, 32, FlxTilemap.OFF, 0, 1, 1);
this.add(tilemap);
```

---

## Tile Collision & Callbacks

You can set custom callbacks when the player touches specific tile types (e.g. spikes, doors, ladders):

```ts
// Tile index 5 is a hazard spike
tilemap.setTileProperties(5, FlxObject.ANY, (tile, obj) => {
  if (obj === player) {
    player.kill();
  }
});

// Tile index 8 is a one-way cloud platform (collide only from above)
tilemap.setTileProperties(8, FlxObject.FLOOR);
```

---

## Colliding with the Tilemap

In `update()`:

```ts
override update(): void {
  super.update();

  // Separate player from solid tiles
  FlxObject.separate(this.player, this.tilemap);
}
```
