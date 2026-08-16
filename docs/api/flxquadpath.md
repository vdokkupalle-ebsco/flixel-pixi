---
title: FlxQuadPath (Class)
description: API reference documentation for FlxQuadPath in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxQuadPath

Constant-speed traversal of connected quadratic Bézier segments.

```ts
export declare class FlxQuadPath extends FlxMotion
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`distance`** | - | `number` | - |
| **`points`** | `readonly` | `PointLike[]` | - |

## Methods

### `addPoint()`

```ts
addPoint(x?: number, y?: number): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |

**Returns:** `this`

### `getPoint()`

```ts
getPoint(index?: number): PointLike
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `index` | `number` | - |

**Returns:** `PointLike`

### `setMotion()`

```ts
setMotion(durationOrSpeed?: number, useDuration?: boolean): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `durationOrSpeed` | `number` | - |
| `useDuration` | `boolean` | - |

**Returns:** `this`

