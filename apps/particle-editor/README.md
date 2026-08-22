# Flixel-Pixi Particle Lab

Private visual authoring application for deterministic Flixel-Pixi particle
presets. It consumes the public `flixel-pixi` package API; application code does
not import the private schema or particle-runtime workspaces.

```bash
npm run dev --workspace @flixel-pixi/particle-editor
```

The first shell milestone includes a responsive editor workspace, starter
preset, live `FlxParticleEmitter` preview, transport controls, diagnostics, and
accessible document structure. Property editing and persistence are deliberately
reserved for later mergeable slices.
