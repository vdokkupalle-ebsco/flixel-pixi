# Animation and frames

`FlxSprite` keeps animation time in the deterministic Flixel update loop. Pixi
only renders the texture selected by that loop; do not attach a second
`AnimatedSprite` clock to the render adapter.

## Existing sprite API

The original API remains supported:

```ts
sprite.addAnimation('walk', [0, 1, 2, 3], 12, true);
sprite.play('walk');
sprite.pauseAnimation();
sprite.resumeAnimation();
```

## Animation controller

The `animation` property provides HaxeFlixel-style management and playback:

```ts
sprite.animation.add('walk', [0, 1, 2, 3], 12, true);
sprite.animation.add('jump', [4, 5, 6], 10, false);
sprite.animation.play('walk');

sprite.animation.onLoop.add((name) => console.log(`${name} looped`));
sprite.animation.onFinish.add((name) => console.log(`${name} finished`));
sprite.animation.onFrameChange.add((event) => {
  console.log(event.animationName, event.frameNumber, event.frameIndex);
});
```

Animations expose `loopPoint`, `reversed`, `flipX`, `flipY`, `timeScale`,
`curFrame`, `frameRate`, `paused`, and `finished`. The controller also supports
reverse playback and an initial animation-frame offset:

```ts
sprite.animation.play('walk', true, true, 1);
```

This forces a restart, plays backward, and starts one frame from the end.

## Named frame collections

`FlxFramesCollection` represents ordered, named texture views. Grid textures
are resolved lazily through `FlxGraphic`, while atlas collections retain the
atlas subtextures directly rather than copying GPU data.

```ts
const frames = FlxFramesCollection.fromAtlas(
  atlas.framesByPrefix('hero_walk_', 0, 5, { padding: 2 }),
);

sprite.loadFrames(frames);
sprite.animation.addByPrefix('walk', 'hero_walk_', 12, true);
sprite.animation.play('walk');
```

The collection passed to `loadFrames()` remains caller-owned and must outlive
the sprite. Asset bundles or the atlas registry should normally own it and its
textures. Collections loaded into a sprite currently require uniform frame
dimensions. TexturePacker JSON frame textures retain trim and rotation
metadata. Atlas-backed strip animations undo packed rotation and place trimmed
pixels within the original logical frame, so differently trimmed animation
frames keep a stable cell size. Frame `duration` values, when present, override
the animation's default frame rate for that frame.

Grid collections support custom names and durations:

```ts
const frames = FlxFramesCollection.fromGraphicGrid(graphic, 16, 16, {
  names: ['idle', 'walk_0', 'walk_1'],
  durations: [0.5, 0.08, 0.12],
});
```

Use `getFrame`, `getByName`, `getByNames`, `getByPrefix`, or `getByIndices` to
build other selections without changing texture ownership.
