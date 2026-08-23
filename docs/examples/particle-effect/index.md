---
title: Composed Particle Effect
description: Load and play an exported multi-emitter Particle Editor effect with FlxParticleEffect and FlxAssets.
---

# Composed Particle Effect

This campfire is one exported effect document containing three ordered layers: flame, embers, and smoke. Click or tap inside the game to move its origin, use the arrow keys to nudge it, and pause or reset the complete effect as one object.

<DemoEmbed
  src="/games/particle-effect/index.html"
  title="Composed Particle Effect Demo"
  controlsHint="Click or tap to move. Arrow keys nudge. P pauses and R resets."
  height="500px"
/>

## Load the export and its textures

The demo registers the editor export and every referenced texture with the built-in browser preloader. The state is not created until the initial bundle has loaded.

```ts
assets: {
  bundles: [{
    name: 'particle-effect-demo',
    assets: [
      { alias: 'campfire-effect-document', parser: 'text', src: effectUrl },
      { alias: 'campfire-flame', src: flameUrl },
      { alias: 'campfire-ember', src: emberUrl },
      { alias: 'campfire-smoke', src: smokeUrl },
    ],
  }],
  initialBundles: 'particle-effect-demo',
}
```

The preload callback parses the JSON with the public schema contract. That catches missing layers, duplicate IDs, invalid offsets, and invalid nested presets before gameplay begins.

```ts
preload({ assets }) {
  const json = assets.get<string>('campfire-effect-document');
  registerCampfireDocument(JSON.parse(json));
}
```

## Create one movable runtime object

`FlxParticleEffect.fromAssets` resolves each layer's `assetId` from the same `FlxAssets` service. Add the composed effect to the state once; its child emitters retain their exported order and local offsets.

```ts
const effect = FlxParticleEffect.fromAssets(campfireDocument, {
  autoStart: true,
  x: 320,
  y: 304,
});

add(effect);
effect.setPosition(pointer.x, pointer.y);
effect.pause();
effect.resume();
effect.reset();
```

## Try the editor-to-game workflow

Download the same portable files used by this demo, import the JSON into the Particle Editor, adjust it, and export it again. The runtime accepts the editor's exported document directly; texture asset IDs remain the link between each layer and its preloaded graphic.

- [Download the campfire effect JSON](/downloads/campfire-particle-effect/campfire-effect.json)
- [Download the flame texture](/downloads/campfire-particle-effect/flame.svg)
- [Download the ember texture](/downloads/campfire-particle-effect/ember.svg)
- [Download the smoke texture](/downloads/campfire-particle-effect/smoke.svg)
- [Download the starter instructions](/downloads/campfire-particle-effect/STARTER.txt)

[Open the Particle Editor](/particle-editor/) · [View the complete example source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/particle-effect)
