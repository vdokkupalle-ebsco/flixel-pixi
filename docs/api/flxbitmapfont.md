---
title: FlxBitmapFont (Class)
description: API reference documentation for FlxBitmapFont in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBitmapFont

Bitmap glyph font backed by a Pixi `BitmapFont` and registered for `BitmapText`.

```ts
export declare class FlxBitmapFont
```

## Constructors

```ts
constructor(pixiFont: BitmapFont, ownsPixiFont?: boolean)
```

Constructs a new instance of the `FlxBitmapFont` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `pixiFont` | `BitmapFont` | - |
| `ownsPixiFont` | `boolean` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`destroyed`** | `readonly` | `boolean` | - |
| **`fontFamily`** | `readonly` | `string` | - |
| **`lineHeight`** | `readonly` | `number` | - |
| **`size`** | `readonly` | `number` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `static` `fromAngelCode()`

```ts
static fromAngelCode(source: FlxBitmapFontPageSource | readonly FlxBitmapFontPageSource[], xmlText: string, fontFamily?: string): FlxBitmapFont
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `FlxBitmapFontPageSource \| readonly FlxBitmapFontPageSource[]` | - |
| `xmlText` | `string` | - |
| `fontFamily` | `string` | - |

**Returns:** `FlxBitmapFont`

### `static` `fromMonospace()`

```ts
static fromMonospace(source: FlxGraphic | Texture, letters: string | undefined, charWidth: number, charHeight: number, options?: { fontFamily?: string; spacingX?: number; spacingY?: number; }): FlxBitmapFont
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `FlxGraphic \| Texture` | - |
| `letters` | `string \| undefined` | - |
| `charWidth` | `number` | - |
| `charHeight` | `number` | - |
| `options` | `{ fontFamily?: string; spacingX?: number; spacingY?: number; }` | - |

**Returns:** `FlxBitmapFont`

### `static` `getDefaultFont()`

```ts
static getDefaultFont(): FlxBitmapFont
```

**Returns:** `FlxBitmapFont`

