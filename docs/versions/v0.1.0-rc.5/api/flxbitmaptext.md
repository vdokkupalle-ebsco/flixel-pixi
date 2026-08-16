---
title: FlxBitmapText (Class)
description: API reference documentation for FlxBitmapText in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBitmapText

Bitmap-font text rendered through Pixi `BitmapText`.

```ts
export declare class FlxBitmapText extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, text?: string, font?: FlxBitmapFont | null, fieldWidth?: number)
```

Constructs a new instance of the `FlxBitmapText` class

| Parameter    | Type                    | Description |
| :----------- | :---------------------- | :---------- |
| `x`          | `number`                | -           |
| `y`          | `number`                | -           |
| `text`       | `string`                | -           |
| `font`       | `FlxBitmapFont \| null` | -           |
| `fieldWidth` | `number`                | -           |

## Properties

| Property            | Modifiers | Type             | Description |
| :------------------ | :-------- | :--------------- | :---------- |
| **`alignment`**     | -         | `TextStyleAlign` | -           |
| **`fieldWidth`**    | -         | `number`         | -           |
| **`font`**          | -         | `FlxBitmapFont`  | -           |
| **`letterSpacing`** | -         | `number`         | -           |
| **`lineSpacing`**   | -         | `number`         | -           |
| **`text`**          | -         | `string`         | -           |

## Methods

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

### `postUpdate()`

```ts
postUpdate(): void
```

**Returns:** `void`

### `setFormat()`

```ts
setFormat(_font?: string | null, size?: number, color?: number, alignment?: TextStyleAlign | null): this
```

**Parameters:**

| Parameter   | Type                     | Description |
| :---------- | :----------------------- | :---------- |
| `_font`     | `string \| null`         | -           |
| `size`      | `number`                 | -           |
| `color`     | `number`                 | -           |
| `alignment` | `TextStyleAlign \| null` | -           |

**Returns:** `this`
