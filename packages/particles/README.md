# `@flixel-pixi/particles`

Deterministic, fixed-capacity particle simulation for the Flixel-Pixi ecosystem.

The package consumes particle presets from `@flixel-pixi/schemas` and provides:

- seeded burst and continuous emission;
- point, rectangle, and area-correct circle spawning;
- fixed-capacity particle reuse with dropped-particle diagnostics;
- lifespan, velocity, acceleration, drag, rotation, scale, alpha, and color;
- random or sequential texture-frame selection;
- local and world-space coordinates;
- start, pause, resume, stop, reset, and destroy lifecycle;
- renderer-free snapshots and zero-allocation active-particle iteration.

The package is private while its API is integrated with Flixel-Pixi rendering and the first particle editor. Game code should continue installing `flixel-pixi`; the editor will use this workspace for deterministic authoring and the installed engine package for its final live preview.
