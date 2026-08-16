---
title: FlxGraphics (Class)
description: API reference documentation for FlxGraphics in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGraphics

Stable renderer-neutral vector drawing object.

Commands are tessellated per camera only when the revision changes. Use a mesh for shapes whose geometry changes every frame.

```ts
export declare class FlxGraphics extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, width?: number, height?: number)
```

Constructs a new instance of the `FlxGraphics` class

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `width`   | `number` | -           |
| `height`  | `number` | -           |

## Properties

| Property               | Modifiers  | Type     | Description                                    |
| :--------------------- | :--------- | :------- | :--------------------------------------------- |
| **`commandCount`**     | `readonly` | `number` | Number of retained drawing commands.           |
| **`graphicsRevision`** | `readonly` | `number` | Monotonic version consumed by camera adapters. |

## Methods

### `circle()`

```ts
circle(x: number, y: number, radius: number, style: FlxGraphicsStyle): this
```

Append a filled and/or stroked circle.

**Parameters:**

| Parameter | Type               | Description |
| :-------- | :----------------- | :---------- |
| `x`       | `number`           | -           |
| `y`       | `number`           | -           |
| `radius`  | `number`           | -           |
| `style`   | `FlxGraphicsStyle` | -           |

**Returns:** `this`

### `clearGraphics()`

```ts
clearGraphics(): this
```

Remove every retained command and publish one rebuild revision.

**Returns:** `this`

### `createRenderHandle()`

```ts
createRenderHandle(): FlxRenderHandle
```

**Returns:** `FlxRenderHandle`

### `ellipse()`

```ts
ellipse(x: number, y: number, radiusX: number, radiusY: number, style: FlxGraphicsStyle): this
```

Append a filled and/or stroked ellipse.

**Parameters:**

| Parameter | Type               | Description |
| :-------- | :----------------- | :---------- |
| `x`       | `number`           | -           |
| `y`       | `number`           | -           |
| `radiusX` | `number`           | -           |
| `radiusY` | `number`           | -           |
| `style`   | `FlxGraphicsStyle` | -           |

**Returns:** `this`

### `line()`

```ts
line(points: ArrayLike<number>, stroke: FlxGraphicsStroke): this
```

Append an open stroked polyline from local x/y pairs.

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `points`  | `ArrayLike<number>` | -           |
| `stroke`  | `FlxGraphicsStroke` | -           |

**Returns:** `this`

### `onScreen()`

```ts
onScreen(camera?: FlxCameraLike): boolean
```

**Parameters:**

| Parameter | Type            | Description |
| :-------- | :-------------- | :---------- |
| `camera`  | `FlxCameraLike` | -           |

**Returns:** `boolean`

### `polygon()`

```ts
polygon(points: ArrayLike<number>, style: FlxGraphicsStyle): this
```

Append a closed polygon from local x/y pairs.

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `points`  | `ArrayLike<number>` | -           |
| `style`   | `FlxGraphicsStyle`  | -           |

**Returns:** `this`

### `rect()`

```ts
rect(x: number, y: number, width: number, height: number, style: FlxGraphicsStyle): this
```

Append a filled and/or stroked rectangle.

**Parameters:**

| Parameter | Type               | Description |
| :-------- | :----------------- | :---------- |
| `x`       | `number`           | -           |
| `y`       | `number`           | -           |
| `width`   | `number`           | -           |
| `height`  | `number`           | -           |
| `style`   | `FlxGraphicsStyle` | -           |

**Returns:** `this`

### `roundRect()`

```ts
roundRect(x: number, y: number, width: number, height: number, radius: number, style: FlxGraphicsStyle): this
```

Append a filled and/or stroked rounded rectangle.

**Parameters:**

| Parameter | Type               | Description |
| :-------- | :----------------- | :---------- |
| `x`       | `number`           | -           |
| `y`       | `number`           | -           |
| `width`   | `number`           | -           |
| `height`  | `number`           | -           |
| `radius`  | `number`           | -           |
| `style`   | `FlxGraphicsStyle` | -           |

**Returns:** `this`

### `star()`

```ts
star(x: number, y: number, points: number, radius: number, innerRadius: number, style: FlxGraphicsStyle, rotation?: number): this
```

Append a filled and/or stroked regular star.

**Parameters:**

| Parameter     | Type               | Description |
| :------------ | :----------------- | :---------- |
| `x`           | `number`           | -           |
| `y`           | `number`           | -           |
| `points`      | `number`           | -           |
| `radius`      | `number`           | -           |
| `innerRadius` | `number`           | -           |
| `style`       | `FlxGraphicsStyle` | -           |
| `rotation`    | `number`           | -           |

**Returns:** `this`
