# Texture Atlases

Flixel-Pixi supports texture atlases via `FlxAtlas` and `FlxAtlasRegistry`. Atlases pack multiple sprites and UI frames into a single image to minimize GPU state changes and draw calls.

---

## Loading TexturePacker JSON Atlases

```ts
import { FlxAtlas, FlxSprite } from 'flixel-pixi';

// Load atlas JSON + image
const atlas = await FlxAtlas.fromTexturePackerJson(
  'assets/sprites.json',
  'assets/sprites.png',
);

// Create a sprite from a named frame inside the atlas
const coin = new FlxSprite(100, 100);
coin.loadAtlasFrame(atlas, 'coin_gold_01.png');
this.add(coin);

// Create an animation from atlas frame prefixes
const hero = new FlxSprite(200, 100);
hero.addAnimation('run', atlas.framesByPrefix('hero_run_'), 12, true);
hero.playAnimation('run');
this.add(hero);
```
