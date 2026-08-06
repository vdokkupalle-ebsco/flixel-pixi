# Performance guide

Practical notes for keeping Flixel simulation and Pixi rendering cheap. Deeper decisions live in ADRs under `docs/adr/`.

## Prefer simulation authority

Keep gameplay state in Flixel objects (`x`, `y`, velocity, animation frame). Treat Pixi display objects as views updated by render handles. Do not drive gameplay from Pixi transforms.

## Hot paths

- **Text:** use BitmapText / fast text mode when you have many labels; styled `FlxText` is fine for HUDs.
- **Particles:** recycle via `FlxEmitter` pools; consider the opt-in `ParticleContainer` projection (ADR 0009) for large bursts.
- **Tilemaps:** dirty only changed regions; production drawing uses chunked `FlxTilemapRenderHandle`s (Phase 6).
- **Cameras:** each camera is a render-texture pass — extra cameras cost fill rate (ADR 0003).

## Fixed step

Simulation runs on a fixed accumulator (`FlxGame` / ADR 0002). Display refresh rate must not change gameplay. Prefer fixed-step benches over wall-clock when profiling logic.

## Cleanup

Destroy states, unload asset bundles you no longer need, and drop render handles when objects leave the world. Leaked textures and listeners show up in long sessions (Phase 13 soak will gate this harder).

## Benchmarks

- Sprite atlas stress: `examples/games/bench-sprites/` (`npm run dev:games` → Bench Sprites). Presets **2k / 5k / 10k** via UI buttons, keys `1`/`2`/`3`, or `?active=5000`. Report-only FPS via `window.__FLIXEL_PIXI_BENCH__`.
- Boot/destroy soak: `examples/games/bench-soak/`. See `docs/phase13-evidence.md`.
