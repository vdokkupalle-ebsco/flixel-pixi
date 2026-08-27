# Browser DX & Viewport Scaling

`createBrowserGame` and `FlxBrowserViewport` handle DOM mounting, automatic canvas scaling, letterboxing, mobile safe-area insets, and browser focus management.

---

## 1. Booting with `createBrowserGame`

```ts
import { createBrowserGame } from 'flixel-pixi';
import { PlayState } from './PlayState';

const app = await createBrowserGame({
  host: document.getElementById('game')!,
  initialState: PlayState,
  width: 640,
  height: 480,
  scaling: 'fit', // 'fit' | 'fill' | 'fixed' | 'integer'
  renderer: {
    preference: 'webgl', // 'webgl' | 'webgpu'
    antialias: false, // Pixel art crispness
  },
});
```

---

## 2. Viewport Scaling & Safe Areas

`FlxBrowserViewport` automatically calculates letterbox bars (pillarbox/letterbox) and respects iOS notch / dynamic island safe area insets:

```ts
const snapshot = app.viewport.snapshot;
console.log(`Current Scale Factor: ${snapshot.scale}`);
console.log('Safe Area Insets:', snapshot.safeAreaInsets);
```
