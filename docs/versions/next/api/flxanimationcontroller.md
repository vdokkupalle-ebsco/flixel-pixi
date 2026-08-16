---
title: FlxAnimationController (Class)
description: API reference documentation for FlxAnimationController in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAnimationController

HaxeFlixel-style animation API backed by a deterministic FlxSprite clock.

```ts
export declare class FlxAnimationController
```

## Constructors

```ts
constructor(sprite: FlxSprite)
```

Constructs a new instance of the `FlxAnimationController` class

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `sprite`  | `FlxSprite` | -           |

## Properties

| Property            | Modifiers  | Type                                | Description |
| :------------------ | :--------- | :---------------------------------- | :---------- |
| **`curAnim`**       | -          | `FlxAnim \| null`                   | -           |
| **`finished`**      | -          | `boolean`                           | -           |
| **`frameIndex`**    | -          | `number`                            | -           |
| **`frameName`**     | -          | `string \| null`                    | -           |
| **`name`**          | -          | `string \| null`                    | -           |
| **`numFrames`**     | `readonly` | `number`                            | -           |
| **`onFinish`**      | `readonly` | `FlxSignal<string>`                 | -           |
| **`onFrameChange`** | `readonly` | `FlxSignal<FlxAnimationFrameEvent>` | -           |
| **`onLoop`**        | `readonly` | `FlxSignal<string>`                 | -           |
| **`paused`**        | -          | `boolean`                           | -           |
| **`timeScale`**     | -          | `number`                            | -           |

## Methods

### `add()`

```ts
add(name: string, frames: readonly number[], frameRate?: number, looped?: boolean, flipX?: boolean, flipY?: boolean): void
```

**Parameters:**

| Parameter   | Type                | Description |
| :---------- | :------------------ | :---------- |
| `name`      | `string`            | -           |
| `frames`    | `readonly number[]` | -           |
| `frameRate` | `number`            | -           |
| `looped`    | `boolean`           | -           |
| `flipX`     | `boolean`           | -           |
| `flipY`     | `boolean`           | -           |

**Returns:** `void`

### `addByIndices()`

```ts
addByIndices(name: string, prefix: string, indices: readonly number[], postfix?: string, frameRate?: number, looped?: boolean, flipX?: boolean, flipY?: boolean): void
```

**Parameters:**

| Parameter   | Type                | Description |
| :---------- | :------------------ | :---------- |
| `name`      | `string`            | -           |
| `prefix`    | `string`            | -           |
| `indices`   | `readonly number[]` | -           |
| `postfix`   | `string`            | -           |
| `frameRate` | `number`            | -           |
| `looped`    | `boolean`           | -           |
| `flipX`     | `boolean`           | -           |
| `flipY`     | `boolean`           | -           |

**Returns:** `void`

### `addByNames()`

```ts
addByNames(name: string, frameNames: readonly string[], frameRate?: number, looped?: boolean, flipX?: boolean, flipY?: boolean): void
```

**Parameters:**

| Parameter    | Type                | Description |
| :----------- | :------------------ | :---------- |
| `name`       | `string`            | -           |
| `frameNames` | `readonly string[]` | -           |
| `frameRate`  | `number`            | -           |
| `looped`     | `boolean`           | -           |
| `flipX`      | `boolean`           | -           |
| `flipY`      | `boolean`           | -           |

**Returns:** `void`

### `addByPrefix()`

```ts
addByPrefix(name: string, prefix: string, frameRate?: number, looped?: boolean, flipX?: boolean, flipY?: boolean): void
```

**Parameters:**

| Parameter   | Type      | Description |
| :---------- | :-------- | :---------- |
| `name`      | `string`  | -           |
| `prefix`    | `string`  | -           |
| `frameRate` | `number`  | -           |
| `looped`    | `boolean` | -           |
| `flipX`     | `boolean` | -           |
| `flipY`     | `boolean` | -           |

**Returns:** `void`

### `append()`

```ts
append(name: string, frames: readonly number[]): void
```

**Parameters:**

| Parameter | Type                | Description |
| :-------- | :------------------ | :---------- |
| `name`    | `string`            | -           |
| `frames`  | `readonly number[]` | -           |

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `exists()`

```ts
exists(name: string): boolean
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `name`    | `string` | -           |

**Returns:** `boolean`

### `finish()`

```ts
finish(): void
```

**Returns:** `void`

### `getAnimationList()`

```ts
getAnimationList(): FlxAnim[]
```

**Returns:** `FlxAnim[]`

### `getNameList()`

```ts
getNameList(): string[]
```

**Returns:** `string[]`

### `play()`

```ts
play(name: string, force?: boolean, reversed?: boolean, frame?: number): void
```

**Parameters:**

| Parameter  | Type      | Description |
| :--------- | :-------- | :---------- |
| `name`     | `string`  | -           |
| `force`    | `boolean` | -           |
| `reversed` | `boolean` | -           |
| `frame`    | `number`  | -           |

**Returns:** `void`

### `randomFrame()`

```ts
randomFrame(): void
```

**Returns:** `void`

### `remove()`

```ts
remove(name: string): boolean
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `name`    | `string` | -           |

**Returns:** `boolean`

### `rename()`

```ts
rename(oldName: string, newName: string): boolean
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `oldName` | `string` | -           |
| `newName` | `string` | -           |

**Returns:** `boolean`

### `stop()`

```ts
stop(): void
```

**Returns:** `void`
