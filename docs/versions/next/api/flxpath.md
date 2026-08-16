---
title: FlxPath (Class)
description: API reference documentation for FlxPath in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPath

Mutable path data followed by a `FlxObject`.

```ts
export declare class FlxPath
```

## Constructors

```ts
constructor(nodes?: FlxPoint[] | null)
```

Constructs a new instance of the `FlxPath` class

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `nodes`   | `FlxPoint[] \| null` | -           |

## Properties

| Property                | Modifiers           | Type                       | Description |
| :---------------------- | :------------------ | :------------------------- | :---------- |
| **`debugColor`**        | -                   | `number`                   | -           |
| **`debugScrollFactor`** | -                   | `FlxPoint`                 | -           |
| **`ignoreDrawDebug`**   | -                   | `boolean`                  | -           |
| **`manager`**           | `static` `readonly` | `DebugPathDisplay \| null` | -           |
| **`nodes`**             | -                   | `FlxPoint[]`               | -           |

## Methods

### `add()`

```ts
add(x: number, y: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |

**Returns:** `void`

### `addAt()`

```ts
addAt(x: number, y: number, index: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `x`       | `number` | -           |
| `y`       | `number` | -           |
| `index`   | `number` | -           |

**Returns:** `void`

### `addPoint()`

```ts
addPoint(node: FlxPoint, asReference?: boolean): void
```

**Parameters:**

| Parameter     | Type       | Description |
| :------------ | :--------- | :---------- |
| `node`        | `FlxPoint` | -           |
| `asReference` | `boolean`  | -           |

**Returns:** `void`

### `addPointAt()`

```ts
addPointAt(node: FlxPoint, index: number, asReference?: boolean): void
```

**Parameters:**

| Parameter     | Type       | Description |
| :------------ | :--------- | :---------- |
| `node`        | `FlxPoint` | -           |
| `index`       | `number`   | -           |
| `asReference` | `boolean`  | -           |

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `head()`

```ts
head(): FlxPoint | null
```

**Returns:** `FlxPoint | null`

### `remove()`

```ts
remove(node: FlxPoint): FlxPoint | null
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `node`    | `FlxPoint` | -           |

**Returns:** `FlxPoint | null`

### `removeAt()`

```ts
removeAt(index: number): FlxPoint | null
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `index`   | `number` | -           |

**Returns:** `FlxPoint | null`

### `tail()`

```ts
tail(): FlxPoint | null
```

**Returns:** `FlxPoint | null`
