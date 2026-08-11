# Browser guide

Browser constraints for `flixel-pixi` games. Full matrix and CI policy: [browser-support.md](../browser-support.md).

## Audio unlock

Web Audio starts suspended until a user gesture. `FlxAudioManager` installs the
unlock listeners automatically; playback requested before the first click,
keydown, or touch is queued. `WebAudioBackend` accepts decoded `AudioBuffer`
objects, `HTMLAudioElement` objects, and URL strings. Resolve asset aliases
before passing them to the audio manager.

## Storage

`FlxSave` uses `LocalStorageBackend` or `IndexedDBBackend` (ADR 0011). Expect
quota errors and private-mode quirks. Check synchronous `flush()` results for
localStorage; with IndexedDB, use and check `await save.flushAsync()` and
`await save.eraseAsync()` so the result reflects transaction completion.

## Input

Keyboard and pointer bind to DOM targets you pass into `FlxGame` (canvas /
window). Fullscreen, focus loss, and visibility should pause or ignore stale
keys as needed for your game.

## Scaling and fullscreen

`createBrowserGame` keeps the game and cameras at their configured logical size
while `FlxBrowserViewport` controls the canvas size in CSS pixels:

```ts
const app = await createBrowserGame({
  host,
  initialState: PlayState,
  width: 640,
  height: 360,
  scaling: { mode: 'fit', alignX: 0.5, alignY: 0.5 },
});

app.viewport.setMode('integer');
await app.viewport.toggleFullscreen(); // Call from a user gesture.
```

- `fit` preserves aspect ratio and letterboxes inside the host. It is the
  default and works well for most games.
- `fill` preserves aspect ratio but crops the overflowing axis so the host is
  completely covered.
- `fixed` keeps one CSS pixel per logical pixel and may crop in a small host.
- `integer` uses whole-number enlargement with nearest-neighbor browser
  sampling. It never fractionally shrinks below the logical size, so small
  hosts crop rather than blur pixel art.

The viewport observes its host for resizes. `app.viewport.refresh()` is
available when application code changes layout synchronously and needs the new
placement immediately. Input and native accessibility overlays read the same
canvas bounds, including centered or cropped offsets.

### Safe HUD placement

Subscribe to immutable viewport snapshots instead of reading DOM bounds inside
game states:

```ts
const unsubscribe = app.viewport.onChange(({ safeRect }) => {
  score.x = safeRect.left + 12;
  score.y = safeRect.top + 12;
  pause.x = safeRect.right - pause.width - 12;
  pause.y = safeRect.top + 12;
});
```

`logicalRect` is always the configured game area. `visibleRect` is the portion
left after `fill`, `fixed`, or `integer` cropping. `safeRect` additionally
subtracts CSS `safe-area-inset-*` values and `scaling.safePadding`, expressed in
logical game pixels. The callback runs immediately and again after host resize,
alignment or mode changes, fullscreen transitions, orientation changes, DPR
changes, and calls to `setSafePadding()`.

For deterministic games, queue the snapshot in the callback and apply HUD
positions on the next fixed update. Add `viewport-fit=cover` to the page's
viewport meta tag when device cutout insets should be available.

Pointer values from `FlxG.mouse.getGlobalPosition()` use the full logical game
space. Convert them to coordinates local to the currently visible rectangle by
subtracting its origin:

```ts
const global = FlxG.mouse.getGlobalPosition();
const { visibleRect } = app.viewport.snapshot;
const visibleLocalX = global.x - visibleRect.left;
const visibleLocalY = global.y - visibleRect.top;
```

This distinction matters in `fill` mode: a pointer near the host's left edge
can still have a large logical `x` because the canvas content to its left was
cropped.

## Assets

Flash embeds are gone. Use `FlxAssets` / Pixi `Assets` with URLs or generated `makeGraphic` / pixel buffers (ADR 0005). Prefer nearest sampling for pixel art.

## Rendering

WebGL is the primary path; WebGPU may be available via Pixi preference. Camera FX and multi-camera layouts assume GPU render textures.
