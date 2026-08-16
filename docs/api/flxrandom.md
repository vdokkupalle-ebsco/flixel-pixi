---
title: FlxRandom (Class)
description: API reference documentation for FlxRandom in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Collision & Math</span>
  <span class="api-badge public">@public</span>
</div>

# FlxRandom

Mutable deterministic random source compatible with `FlxG.globalSeed`.

```ts
export declare class FlxRandom
```

## Constructors

```ts
constructor(seed?: number)
```

Constructs a new instance of the `FlxRandom` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `seed` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`seed`** | - | `number` | - |

## Methods

### `next()`

```ts
next(): number
```

Advances and returns the next number in the Flixel sequence.

**Returns:** `number`

