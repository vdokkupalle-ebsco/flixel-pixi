---
title: FlxTimer (Class)
description: API reference documentation for FlxTimer in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxTimer

Deterministic timer advanced by the context's `TimerManager`.

```ts
export declare class FlxTimer
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`finished`** | - | `boolean` | - |
| **`loops`** | - | `number` | - |
| **`loopsLeft`** | `readonly` | `number` | - |
| **`manager`** | `static` `readonly` | `TimerManager \| null` | - |
| **`paused`** | - | `boolean` | - |
| **`progress`** | `readonly` | `number` | - |
| **`time`** | - | `number` | - |
| **`timeLeft`** | `readonly` | `number` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `start()`

```ts
start(time?: number, loops?: number, callback?: FlxTimerCallback | null): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `time` | `number` | - |
| `loops` | `number` | - |
| `callback` | `FlxTimerCallback \| null` | - |

**Returns:** `this`

### `stop()`

```ts
stop(): void
```

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`

