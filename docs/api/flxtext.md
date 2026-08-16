---
title: FlxText (Class)
description: API reference documentation for FlxText in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxText

Flixel-compatible text state rendered by Pixi `Text` or `BitmapText`.

```ts
export declare class FlxText extends FlxSprite
```

## Constructors

```ts
constructor(x: number, y: number, width: number, text?: string | null, embeddedFont?: boolean, renderMode?: FlxTextRenderMode)
```

Constructs a new instance of the `FlxText` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `width` | `number` | - |
| `text` | `string \| null` | - |
| `embeddedFont` | `boolean` | - |
| `renderMode` | `FlxTextRenderMode` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`alignment`** | - | `TextStyleAlign` | - |
| **`borderColor`** | `readonly` | `number` | - |
| **`borderSize`** | `readonly` | `number` | - |
| **`color`** | - | `number` | - |
| **`embeddedFont`** | `readonly` | `boolean` | - |
| **`font`** | - | `string` | - |
| **`renderMode`** | `readonly` | `FlxTextRenderMode` | - |
| **`shadow`** | - | `number` | - |
| **`size`** | - | `number` | - |
| **`text`** | - | `string` | - |

## Methods

### `createRenderHandle()`

```ts
createRenderHandle(): FlxTextRenderHandle
```

**Returns:** `FlxTextRenderHandle`

### `setBorderStyle()`

```ts
setBorderStyle(color?: number, size?: number): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `color` | `number` | - |
| `size` | `number` | - |

**Returns:** `this`

### `setFormat()`

```ts
setFormat(font?: string | null, size?: number, color?: number, alignment?: TextStyleAlign | null, shadowColor?: number): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `font` | `string \| null` | - |
| `size` | `number` | - |
| `color` | `number` | - |
| `alignment` | `TextStyleAlign \| null` | - |
| `shadowColor` | `number` | - |

**Returns:** `this`

