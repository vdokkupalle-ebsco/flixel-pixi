# Particle Editor & Layered Effects

The **Flixel-Pixi Particle Editor** is a deterministic, visual authoring tool for building high-performance 2D particle systems and multi-emitter layered effects.

You can launch the live editor directly in your browser:
👉 [Open Particle Editor](/particle-editor/)

---

## Overview

In games, rich visual phenomena are rarely produced by a single particle emitter alone:

- **Campfire**: Flames + rising smoke plume + floating glowing embers.
- **Explosion**: Core flash burst + fast fiery sparks + expanding smoke debris.
- **Rainstorm**: Falling rain streaks + ground puddle splashes + atmospheric mist.
- **Magic Spell**: Core energy orb + orbiting sparks + radial burst shockwave.

The Particle Editor lets you layer multiple emitters into a single composed effect document while preserving the standard `ParticlePresetV1` runtime format for each individual emitter.

---

## Emitter Layer Management

### Adding and Selecting Layers

- Click the **`+`** button in the sidebar to add a new emitter layer (up to 8 layers per effect).
- Click any layer row to select it. The inspector on the right updates to display and edit properties for the selected layer.
- Active layers are indicated with an active gradient highlight.

### Enable and Disable Layers

- Click the toggle dot on the left of any layer row to enable or disable it.
- Disabled layers are muted in the preview and omitted from exported game code, allowing you to test layers in isolation without deleting them.

### Layer Ordering & Rendering

- Use the **`↑`** and **`↓`** buttons below the layer list to reorder layers.
- In Flixel-Pixi, emitters are rendered in sequence: **layers lower down the list render on top of earlier layers**. For example, place background smoke at the top of the list and foreground sparks at the bottom.

### Duplicating and Deleting

- Click **Duplicate** to clone the selected layer with a new identifier and independent settings.
- Click **Delete** to remove a layer. The editor automatically selects the nearest remaining layer. (The last remaining layer cannot be deleted).

---

## Layer Offsets

Each layer supports local **Offset X** and **Offset Y** coordinates in the inspector:

- Offsets position the emitter relative to the overall effect origin.
- For example, in a campfire effect:
  - Flames at `[0, 0]`
  - Smoke plume at `[0, -16]`
  - Embers at `[0, -4]`

When the effect moves in your game (e.g. following a rocket or character), all emitters maintain their relative offsets automatically.

---

## Combined Capacity & Performance

Each emitter allocates a deterministic particle pool based on its `capacity`.

- The live preview aggregates the active count, capacity, dropped particles, and pool reuse across all enabled layers.
- If the combined capacity across all enabled layers exceeds **2,000 particles**, a capacity warning is displayed.
- Keeping capacity tuned to your particle emission rate and lifespan ensures consistent 60fps / 120fps performance on mobile and desktop devices without garbage collection spikes.

---

## Exporting Effects

The Particle Editor offers several export workflows:

### 1. Export Bundle (ZIP)

Click **Export Bundle** in the top bar to download a complete, self-contained ZIP archive:

```text
campfire/
  campfire.effect.json    # Composed multi-emitter document
  textures/
    editor-flame.png      # Generated or uploaded textures
    editor-smoke.png
    editor-spark.png
  campfire.ts             # Ready-to-use TypeScript instantiation helper
  README.md               # Quickstart guide
```

### 2. Export Composed Effect (JSON)

Click **Export Effect** to download the portable `*.effect.json` file. This contains all layer presets, offsets, and texture settings. You can re-import this JSON into the editor anytime using the **Import** button.

### 3. Export Single Layer Preset (JSON)

Click **Export Layer** to download only the currently selected layer as a standalone `ParticlePresetV1` JSON file (`*.particle.json`).

### 4. Copy TypeScript

Click **Copy TypeScript** to copy a complete code snippet for the entire effect directly to your clipboard.

---

## Game Integration Example

Integrating a composed multi-emitter effect into your Flixel-Pixi game is straightforward using the generated TypeScript:

```ts
import {
  FlxG,
  FlxParticleEffect,
  FlxState,
  parseParticleEffect,
} from 'flixel-pixi';
import campfireJson from './campfire.effect.json';

const campfire = parseParticleEffect(campfireJson);

export class PlayState extends FlxState {
  override create(): void {
    super.create();

    // Load every preset.appearance.texture.assetId with FlxAssets first.
    const effect = FlxParticleEffect.fromAssets(campfire, {
      autoStart: true,
      x: FlxG.width / 2,
      y: FlxG.height / 2,
    });
    this.add(effect);
  }
}
```

`FlxParticleEffect` preserves layer ordering and offsets, ignores disabled
layers, aggregates diagnostics, and moves local-space particles with the effect
origin. Its textures must be loaded through Flixel-Pixi's built-in asset
preloader before the effect is created.
