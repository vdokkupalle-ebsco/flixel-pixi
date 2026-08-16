---
title: FlxNineSliceButton (Class)
description: API reference documentation for FlxNineSliceButton in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxNineSliceButton

[link](#) with a renderer-owned Pixi `NineSliceSprite` background.

```ts
export declare class FlxNineSliceButton extends FlxButton
```

## Properties

| Property           | Modifiers  | Type     | Description |
| :----------------- | :--------- | :------- | :---------- |
| **`bottomHeight`** | `readonly` | `number` | -           |
| **`leftWidth`**    | `readonly` | `number` | -           |
| **`rightWidth`**   | `readonly` | `number` | -           |
| **`topHeight`**    | `readonly` | `number` | -           |

## Methods

### `createRenderHandle()`

```ts
createRenderHandle(): FlxNineSliceButtonRenderHandle
```

**Returns:** `FlxNineSliceButtonRenderHandle`

### `loadGraphic()`

```ts
loadGraphic(source: FlxGraphic | Texture, animated?: boolean, reverse?: boolean, width?: number, height?: number, unique?: boolean): this
```

**Parameters:**

| Parameter  | Type                    | Description |
| :--------- | :---------------------- | :---------- |
| `source`   | `FlxGraphic \| Texture` | -           |
| `animated` | `boolean`               | -           |
| `reverse`  | `boolean`               | -           |
| `width`    | `number`                | -           |
| `height`   | `number`                | -           |
| `unique`   | `boolean`               | -           |

**Returns:** `this`

### `loadNineSliceFrame()`

```ts
loadNineSliceFrame(atlas: FlxAtlas, name: string, width: number, height: number, borders?: FlxNineSliceBorderInput): this
```

**Parameters:**

| Parameter | Type                      | Description |
| :-------- | :------------------------ | :---------- |
| `atlas`   | `FlxAtlas`                | -           |
| `name`    | `string`                  | -           |
| `width`   | `number`                  | -           |
| `height`  | `number`                  | -           |
| `borders` | `FlxNineSliceBorderInput` | -           |

**Returns:** `this`

### `loadNineSliceGraphic()`

```ts
loadNineSliceGraphic(source: FlxGraphic | Texture, animated?: boolean, reverse?: boolean, frameWidth?: number, frameHeight?: number, borders?: FlxNineSliceBorderInput, displayWidth?: number, displayHeight?: number): this
```

**Parameters:**

| Parameter       | Type                      | Description |
| :-------------- | :------------------------ | :---------- |
| `source`        | `FlxGraphic \| Texture`   | -           |
| `animated`      | `boolean`                 | -           |
| `reverse`       | `boolean`                 | -           |
| `frameWidth`    | `number`                  | -           |
| `frameHeight`   | `number`                  | -           |
| `borders`       | `FlxNineSliceBorderInput` | -           |
| `displayWidth`  | `number`                  | -           |
| `displayHeight` | `number`                  | -           |

**Returns:** `this`

### `loadNineSliceTexture()`

```ts
loadNineSliceTexture(texture: Texture, width: number, height: number, borders?: FlxNineSliceBorderInput): this
```

**Parameters:**

| Parameter | Type                      | Description |
| :-------- | :------------------------ | :---------- |
| `texture` | `Texture`                 | -           |
| `width`   | `number`                  | -           |
| `height`  | `number`                  | -           |
| `borders` | `FlxNineSliceBorderInput` | -           |

**Returns:** `this`

### `postUpdate()`

```ts
postUpdate(): void
```

**Returns:** `void`

### `setBorders()`

```ts
setBorders(left: number, top: number, right: number, bottom: number): this
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `left`    | `number` | -           |
| `top`     | `number` | -           |
| `right`   | `number` | -           |
| `bottom`  | `number` | -           |

**Returns:** `this`
