---
title: FlxNineSliceSprite (Class)
description: API reference documentation for FlxNineSliceSprite in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxNineSliceSprite

Resizable sprite with fixed corner and edge art via Pixi 9-slice scaling.

Use [link](#) or [link](#) instead of [link](#) so border insets are tracked for rendering.

```ts
export declare class FlxNineSliceSprite extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, width?: number, height?: number)
```

Constructs a new instance of the `FlxNineSliceSprite` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `width` | `number` | - |
| `height` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`bottomHeight`** | `readonly` | `number` | - |
| **`leftWidth`** | `readonly` | `number` | - |
| **`rightWidth`** | `readonly` | `number` | - |
| **`topHeight`** | `readonly` | `number` | - |

## Methods

### `createRenderHandle()`

```ts
createRenderHandle(): FlxNineSliceRenderHandle
```

**Returns:** `FlxNineSliceRenderHandle`

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

### `loadNineSliceFrame()`

```ts
loadNineSliceFrame(atlas: FlxAtlas, name: string, width: number, height: number, borders?: FlxNineSliceBorderInput): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `atlas` | `FlxAtlas` | - |
| `name` | `string` | - |
| `width` | `number` | - |
| `height` | `number` | - |
| `borders` | `FlxNineSliceBorderInput` | - |

**Returns:** `this`

### `loadNineSliceGraphic()`

```ts
loadNineSliceGraphic(source: FlxGraphic | Texture, animated?: boolean, reverse?: boolean, frameWidth?: number, frameHeight?: number, borders?: FlxNineSliceBorderInput, displayWidth?: number, displayHeight?: number): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `FlxGraphic \| Texture` | - |
| `animated` | `boolean` | - |
| `reverse` | `boolean` | - |
| `frameWidth` | `number` | - |
| `frameHeight` | `number` | - |
| `borders` | `FlxNineSliceBorderInput` | - |
| `displayWidth` | `number` | - |
| `displayHeight` | `number` | - |

**Returns:** `this`

### `loadNineSliceTexture()`

```ts
loadNineSliceTexture(texture: Texture, width: number, height: number, borders?: FlxNineSliceBorderInput): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `texture` | `Texture` | - |
| `width` | `number` | - |
| `height` | `number` | - |
| `borders` | `FlxNineSliceBorderInput` | - |

**Returns:** `this`

### `postUpdate()`

```ts
postUpdate(): void
```

**Returns:** `void`

### `resize()`

```ts
resize(width: number, height: number): this
```

Resize the stretched region without distorting corner art.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `width` | `number` | - |
| `height` | `number` | - |

**Returns:** `this`

### `setBorders()`

```ts
setBorders(left: number, top: number, right: number, bottom: number): this
```

Replace all border insets and resync renderer-owned geometry.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `left` | `number` | - |
| `top` | `number` | - |
| `right` | `number` | - |
| `bottom` | `number` | - |

**Returns:** `this`

