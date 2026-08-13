# ADR-0024: Explicit asynchronous renderer readback

- Status: Accepted
- Date: 2026-08-11

## Context

Games and diagnostic tools occasionally require CPU-side access to rendered pixel data for screenshots, save slot preview thumbnails, visual debugging, or image exports. However, in WebGL and WebGPU rendering architectures, performing synchronous GPU readbacks (`gl.readPixels` or blocking buffer mapping) stalls the GPU pipeline and causes multi-millisecond CPU frame drops.

Furthermore, relying on GPU readbacks for gameplay logic (such as collision detection or state evaluation) introduces non-deterministic frame timing and hardware-dependent behavior.

## Decision

1. Gameplay collision and physics simulation **must never** perform per-frame GPU readbacks. All gameplay collision decisions continue to use CPU-authoritative bounding boxes (`FlxObject`, `FlxGroup`, `FlxTilemap`) or pre-loaded CPU pixel masks (`PixelBuffer`).
2. Visual pixel extraction is strictly **asynchronous** (`Promise`-based). The `FlxCameraRenderer` provides `snapshotCamera(camera)` and `FlxCamera` exposes `takeSnapshot()`, both returning a `Promise` resolving to an independent `{ width: number; height: number; pixels: Uint8ClampedArray }` RGBA buffer.
3. Pixi rendering internals (`RenderTexture`, `Renderer.extract`, `WebGLRenderingContext`) are kept completely encapsulated inside `FlxCameraRenderer`. Gameplay and application code consume only standard typed arrays and plain result objects.
4. Snapshot operations copy extracted pixel data into independent typed array instances. Disposed or destroyed camera render targets do not affect previously returned snapshots, and snapshot calls on destroyed or unmounted cameras fail clearly with descriptive errors.

## Consequences

- Applications can capture camera screenshots and preview thumbnails asynchronously without stalling per-frame rendering loops.
- Renderer neutrality is preserved, maintaining a clean boundary between engine logic and PixiJS v8 execution.
- Deterministic simulation timing remains decoupled from GPU readback performance.
