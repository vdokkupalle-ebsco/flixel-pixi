---
title: FlxSprite (Class)
description: API reference documentation for FlxSprite in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSprite

Renderer-neutral Flixel sprite state with adapter-owned Pixi views.

```ts
export declare class FlxSprite extends FlxObject
```

## Constructors

```ts
constructor(x?: number, y?: number, simpleGraphic?: FlxGraphic | Texture | null)
```

Constructs a new instance of the `FlxSprite` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `simpleGraphic` | `FlxGraphic \| Texture \| null` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`alpha`** | - | `number` | - |
| **`animation`** | `readonly` | `FlxAnimationController` | - |
| **`animationFrame`** | `readonly` | `number` | - |
| **`animationName`** | `readonly` | `string \| null` | - |
| **`animationPaused`** | `readonly` | `boolean` | - |
| **`antialiasing`** | - | `boolean` | - |
| **`blend`** | - | `BLEND_MODES \| null` | - |
| **`color`** | - | `number` | - |
| **`dirty`** | - | `boolean` | - |
| **`facing`** | - | `number` | - |
| **`filterArea`** | - | `Readonly<RectangleLike> \| null` | Optional local render rectangle that skips automatic filter bounds measurement. |
| **`filters`** | - | `readonly FlxFilter[]` | Immutable renderer-neutral effects applied in declaration order. |
| **`finished`** | - | `boolean` | - |
| **`frame`** | - | `number` | - |
| **`frameCollection`** | `readonly` | `FlxFramesCollection \| null` | - |
| **`frameHeight`** | - | `number` | - |
| **`frames`** | - | `number` | - |
| **`frameWidth`** | - | `number` | - |
| **`offset`** | - | `FlxPoint` | - |
| **`origin`** | - | `FlxPoint` | - |
| **`renderHandleCount`** | `readonly` | `number` | Number of live adapter handles owned by this gameplay object. |
| **`scale`** | - | `FlxPoint` | - |

## Methods

### `addAnimation()`

```ts
addAnimation(name: string, frames: readonly number[] | FlxAtlasFrameList, frameRateOrOptions?: number | FlxAtlasAnimationOptions, looped?: boolean): void
```

Register a named animation.

**Strip form (legacy-compatible):**


```ts
sprite.addAnimation('walk', [0, 1, 2], 12, true);

```
**Atlas frame form:**


```ts
sprite.addAnimation('walk', atlas.framesByPrefix('walk_', 1, 2), {
  frameWidth: 64,
  frameHeight: 128,
});

```
Atlas frames are baked into a shared strip internally (append-only).

Replaces any existing animation with the same name.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | - |
| `frames` | `readonly number[] \| FlxAtlasFrameList` | - |
| `frameRateOrOptions` | `number \| FlxAtlasAnimationOptions` | - |
| `looped` | `boolean` | - |

**Returns:** `void`

### `addAnimationCallback()`

```ts
addAnimationCallback(callback: FlxAnimationCallback | null): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `callback` | `FlxAnimationCallback \| null` | - |

**Returns:** `void`

### `centerOffsets()`

```ts
centerOffsets(adjustPosition?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `adjustPosition` | `boolean` | - |

**Returns:** `void`

### `clearFilterArea()`

```ts
clearFilterArea(): this
```

Restore automatic filter bounds measurement.

**Returns:** `this`

### `createRenderHandle()`

```ts
createRenderHandle(): FlxRenderHandle
```

**Returns:** `FlxRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `draw()`

```ts
draw(): void
```

**Returns:** `void`

### `drawFrame()`

```ts
drawFrame(force?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `force` | `boolean` | - |

**Returns:** `void`

### `loadFrames()`

```ts
loadFrames(collection: FlxFramesCollection, reverse?: boolean): this
```

Loads named texture views without baking them into a new strip.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `collection` | `FlxFramesCollection` | - |
| `reverse` | `boolean` | - |

**Returns:** `this`

### `loadGraphic()`

```ts
loadGraphic(source: FlxGraphic | Texture, animated?: boolean, reverse?: boolean, width?: number, height?: number, unique?: boolean): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `FlxGraphic \| Texture` | - |
| `animated` | `boolean` | - |
| `reverse` | `boolean` | - |
| `width` | `number` | - |
| `height` | `number` | - |
| `unique` | `boolean` | - |

**Returns:** `this`

### `loadPixelBuffer()`

```ts
protected loadPixelBuffer(buffer: PixelBuffer, key?: string): this
```

Installs a generated CPU pixel buffer as this sprite's owned texture.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `buffer` | `PixelBuffer` | - |
| `key` | `string` | - |

**Returns:** `this`

### `makeGraphic()`

```ts
makeGraphic(width: number, height: number, color?: number, unique?: boolean, key?: string | null): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `width` | `number` | - |
| `height` | `number` | - |
| `color` | `number` | - |
| `unique` | `boolean` | - |
| `key` | `string \| null` | - |

**Returns:** `this`

### `onScreen()`

```ts
onScreen(camera?: FlxCameraLike): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCameraLike` | - |

**Returns:** `boolean`

### `pauseAnimation()`

```ts
pauseAnimation(): void
```

**Returns:** `void`

### `play()`

```ts
play(name: string, forceOrOptions?: boolean | FlxAnimationPlayOptions): void
```

Play a named animation.

**Legacy form:** `play(name)` or `play(name, force: boolean)` — uses the `looped` / `frameRate` values stored when `addAnimation` was called.

**Options form:** `play(name, { loop, speed, force })` - `loop` defaults to `false` - `speed` defaults to `1` (one anim frame per game update) - `force` defaults to `false`

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | - |
| `forceOrOptions` | `boolean \| FlxAnimationPlayOptions` | - |

**Returns:** `void`

### `postUpdate()`

```ts
postUpdate(): void
```

**Returns:** `void`

### `randomFrame()`

```ts
randomFrame(): void
```

**Returns:** `void`

### `restartAnimation()`

```ts
restartAnimation(): void
```

**Returns:** `void`

### `resumeAnimation()`

```ts
resumeAnimation(): void
```

**Returns:** `void`

### `setFilterArea()`

```ts
setFilterArea(x: number, y: number, width: number, height: number): this
```

Define a local render rectangle for filter bounds optimization.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `width` | `number` | - |
| `height` | `number` | - |

**Returns:** `this`

### `setOriginToCorner()`

```ts
setOriginToCorner(): void
```

**Returns:** `void`

### `syncRenderHandles()`

```ts
syncRenderHandles(): void
```

**Returns:** `void`

### `trackRenderHandle()`

```ts
protected trackRenderHandle<T extends FlxRenderHandle>(create: (onDestroy: () => void) => T): T
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `create` | `(onDestroy: () => void) => T` | - |

**Returns:** `T`

### `updateAnimation()`

```ts
protected updateAnimation(): void
```

**Returns:** `void`

