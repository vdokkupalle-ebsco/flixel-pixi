---
title: FlxCamera (Class)
description: API reference documentation for FlxCamera in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxCamera

Renderer-neutral Flixel camera state.

Pixi render targets and display objects are owned by `FlxCameraRenderer`; this class owns only deterministic simulation and coordinate transforms.

```ts
export declare class FlxCamera extends FlxBasic
```

## Constructors

```ts
constructor(x: number, y: number, width: number, height: number, zoom?: number)
```

Constructs a new instance of the `FlxCamera` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `width` | `number` | - |
| `height` | `number` | - |
| `zoom` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`alpha`** | - | `number` | - |
| **`angle`** | - | `number` | - |
| **`antialiasing`** | - | `boolean` | - |
| **`bgColor`** | - | `number` | - |
| **`bounds`** | - | `FlxRect \| null` | - |
| **`color`** | - | `number` | - |
| **`deadzone`** | - | `FlxRect \| null` | - |
| **`defaultZoom`** | `static` | `number` | - |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`height`** | - | `number` | - |
| **`scale`** | `readonly` | `FlxPoint` | - |
| **`scroll`** | `readonly` | `FlxPoint` | - |
| **`SHAKE_BOTH_AXES`** | `static` `readonly` | `` | - |
| **`SHAKE_HORIZONTAL_ONLY`** | `static` `readonly` | `` | - |
| **`SHAKE_VERTICAL_ONLY`** | `static` `readonly` | `` | - |
| **`STYLE_LOCKON`** | `static` `readonly` | `` | - |
| **`STYLE_PLATFORMER`** | `static` `readonly` | `` | - |
| **`STYLE_TOPDOWN_TIGHT`** | `static` `readonly` | `` | - |
| **`STYLE_TOPDOWN`** | `static` `readonly` | `` | - |
| **`target`** | - | `FlxObject \| null` | - |
| **`width`** | - | `number` | - |
| **`x`** | - | `number` | - |
| **`y`** | - | `number` | - |
| **`zoom`** | - | `number` | - |

## Methods

### `containsScreenPoint()`

```ts
containsScreenPoint(point: Readonly<PointLike>): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<PointLike>` | - |

**Returns:** `boolean`

### `copyFrom()`

```ts
copyFrom(camera: FlxCamera): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |

**Returns:** `this`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `fade()`

```ts
fade(color?: number, duration?: number, onComplete?: FlxCameraEffectCallback | null, force?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `color` | `number` | - |
| `duration` | `number` | - |
| `onComplete` | `FlxCameraEffectCallback \| null` | - |
| `force` | `boolean` | - |

**Returns:** `void`

### `flash()`

```ts
flash(color?: number, duration?: number, onComplete?: FlxCameraEffectCallback | null, force?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `color` | `number` | - |
| `duration` | `number` | - |
| `onComplete` | `FlxCameraEffectCallback \| null` | - |
| `force` | `boolean` | - |

**Returns:** `void`

### `focusOn()`

```ts
focusOn(point: Readonly<PointLike>): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<PointLike>` | - |

**Returns:** `void`

### `follow()`

```ts
follow(target: FlxObject | null, style?: FlxCameraFollowStyle): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `target` | `FlxObject \| null` | - |
| `style` | `FlxCameraFollowStyle` | - |

**Returns:** `void`

### `getScale()`

```ts
getScale(point?: FlxPoint): FlxPoint
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `FlxPoint` | - |

**Returns:** `FlxPoint`

### `resize()`

```ts
resize(width: number, height: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `width` | `number` | - |
| `height` | `number` | - |

**Returns:** `void`

### `screenToWorld()`

```ts
screenToWorld(point: Readonly<PointLike>, output?: FlxPoint): FlxPoint
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<PointLike>` | - |
| `output` | `FlxPoint` | - |

**Returns:** `FlxPoint`

### `setBounds()`

```ts
setBounds(x?: number, y?: number, width?: number, height?: number, updateWorld?: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `width` | `number` | - |
| `height` | `number` | - |
| `updateWorld` | `boolean` | - |

**Returns:** `void`

### `setScale()`

```ts
setScale(x: number, y?: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |

**Returns:** `void`

### `shake()`

```ts
shake(intensity?: number, duration?: number, onComplete?: FlxCameraEffectCallback | null, force?: boolean, direction?: FlxCameraShakeDirection): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `intensity` | `number` | - |
| `duration` | `number` | - |
| `onComplete` | `FlxCameraEffectCallback \| null` | - |
| `force` | `boolean` | - |
| `direction` | `FlxCameraShakeDirection` | - |

**Returns:** `void`

### `stopFX()`

```ts
stopFX(): void
```

**Returns:** `void`

### `takeSnapshot()`

```ts
takeSnapshot(): Promise<{ height: number; pixels: Uint8ClampedArray; width: number; }>
```

Asynchronously extracts rendered RGBA pixel data for this camera from the active host renderer.

**Returns:** `Promise<{ height: number; pixels: Uint8ClampedArray; width: number; }>`

### `update()`

```ts
update(): void
```

**Returns:** `void`

### `updateWithElapsed()`

```ts
updateWithElapsed(elapsed: number): void
```

Advances follow state and effects with an explicit deterministic step.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `elapsed` | `number` | - |

**Returns:** `void`

### `worldToScreen()`

```ts
worldToScreen(point: Readonly<PointLike>, output?: FlxPoint, scrollFactor?: Readonly<PointLike>): FlxPoint
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `point` | `Readonly<PointLike>` | - |
| `output` | `FlxPoint` | - |
| `scrollFactor` | `Readonly<PointLike>` | - |

**Returns:** `FlxPoint`

