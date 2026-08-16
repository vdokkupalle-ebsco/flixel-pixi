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
  scaleMode: 'letterbox', // 'letterbox' | 'stretch' | 'fit-width' | 'fit-height' | 'none'
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
const viewport = this.context.getService(FlxBrowserViewport);
console.log(`Current Scale Factor: ${viewport.scale}`);
console.log(`Safe Area Insets:`, viewport.safeInsets);
```
