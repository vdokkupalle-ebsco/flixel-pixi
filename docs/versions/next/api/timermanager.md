---
title: TimerManager (Class)
description: API reference documentation for TimerManager in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# TimerManager

Plugin that advances deterministic game-time timers.

```ts
export declare class TimerManager extends FlxBasic
```

## Constructors

```ts
constructor();
```

Constructs a new instance of the `TimerManager` class

## Properties

| Property         | Modifiers  | Type     | Description |
| :--------------- | :--------- | :------- | :---------- |
| **`timerCount`** | `readonly` | `number` | -           |

## Methods

### `add()`

```ts
add(timer: FlxTimer): void
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `timer`   | `FlxTimer` | -           |

**Returns:** `void`

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `remove()`

```ts
remove(timer: FlxTimer): void
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `timer`   | `FlxTimer` | -           |

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`
