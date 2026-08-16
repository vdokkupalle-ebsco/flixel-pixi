---
title: FlxTouch (Class)
description: API reference documentation for FlxTouch in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTouch

State of one browser touch pointer.

```ts
export declare class FlxTouch extends FlxPoint
```

## Constructors

```ts
constructor(context: FlxContext, pointerId: number)
```

Constructs a new instance of the `FlxTouch` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `context` | `FlxContext` | - |
| `pointerId` | `number` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`age`** | - | `number` | - |
| **`cancelled`** | - | `boolean` | - |
| **`isPrimary`** | - | `boolean` | - |
| **`justCancelled`** | `readonly` | `boolean` | - |
| **`justPressed`** | `readonly` | `boolean` | - |
| **`justReleased`** | `readonly` | `boolean` | - |
| **`pointerId`** | `readonly` | `number` | - |
| **`pressed`** | `readonly` | `boolean` | - |
| **`pressure`** | - | `number` | - |
| **`startX`** | - | `number` | - |
| **`startY`** | - | `number` | - |

## Methods

### `getWorldPosition()`

```ts
getWorldPosition(camera?: FlxCamera, point?: FlxPoint): FlxPoint
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `camera` | `FlxCamera` | - |
| `point` | `FlxPoint` | - |

**Returns:** `FlxPoint`

