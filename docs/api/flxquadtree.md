---
title: FlxQuadTree (Class)
description: API reference documentation for FlxQuadTree in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Collision & Math</span>
  <span class="api-badge public">@public</span>
</div>

# FlxQuadTree

Flixel-compatible broad-phase quadtree with single/dual-list operation.

```ts
export declare class FlxQuadTree extends FlxRect
```

## Constructors

```ts
constructor(x: number, y: number, width: number, height: number, parent?: FlxQuadTree | null)
```

Constructs a new instance of the `FlxQuadTree` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `width` | `number` | - |
| `height` | `number` | - |
| `parent` | `FlxQuadTree \| null` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`A_LIST`** | `static` `readonly` | `` | - |
| **`B_LIST`** | `static` `readonly` | `` | - |
| **`divisions`** | `static` | `number` | - |

## Methods

### `add()`

```ts
add(objectOrGroup: FlxBasic, list: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `objectOrGroup` | `FlxBasic` | - |
| `list` | `number` | - |

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `execute()`

```ts
execute(): boolean
```

**Returns:** `boolean`

### `load()`

```ts
load(first: FlxBasic, second?: FlxBasic | null, notify?: FlxOverlapCallback | null, process?: FlxProcessCallback | null): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `first` | `FlxBasic` | - |
| `second` | `FlxBasic \| null` | - |
| `notify` | `FlxOverlapCallback \| null` | - |
| `process` | `FlxProcessCallback \| null` | - |

**Returns:** `void`

