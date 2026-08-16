# Asset Loading & Preloaders

Flixel-Pixi provides asynchronous asset bundles and customizable preloaders via `FlxAssets`, `FlxLoadingSession`, and `FlxPreloader`.

---

## 1. Asset Manifest & Bundles

```ts
import { FlxAssets } from 'flixel-pixi';

await FlxAssets.loadBundle({
  name: 'level1',
  assets: [
    { alias: 'hero', src: 'assets/hero.png' },
    { alias: 'tiles', src: 'assets/tiles.png' },
    { alias: 'bgm', src: 'assets/music.ogg' },
  ],
  onProgress: (ratio) => {
    console.log(`Loading: ${Math.round(ratio * 100)}%`);
  },
});
```

---

## 2. Asynchronous Loading Session (`FlxLoadingSession`)

```ts
import { FlxLoadingSession } from 'flixel-pixi';

const session = new FlxLoadingSession();

session.addTask('textures', async () => {
  await loadTextures();
});

session.addTask('sounds', async () => {
  await loadAudio();
});

await session.run();
```
