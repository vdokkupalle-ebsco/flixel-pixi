---
title: FlxGamepadManager (Class)
description: API reference documentation for FlxGamepadManager in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGamepadManager

Fixed-step Web Gamepad poller with reconnect-stable logical IDs.

```ts
export declare class FlxGamepadManager
```

## Constructors

```ts
constructor(provider?: FlxGamepadProvider)
```

Constructs a new instance of the `FlxGamepadManager` class

| Parameter  | Type                 | Description |
| :--------- | :------------------- | :---------- |
| `provider` | `FlxGamepadProvider` | -           |

## Properties

| Property          | Modifiers  | Type                    | Description |
| :---------------- | :--------- | :---------------------- | :---------- |
| **`connected`**   | `readonly` | `readonly FlxGamepad[]` | -           |
| **`firstActive`** | `readonly` | `FlxGamepad \| null`    | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `getByID()`

```ts
getByID(uid: number): FlxGamepad | null
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `uid`     | `number` | -           |

**Returns:** `FlxGamepad | null`

### `getByIndex()`

```ts
getByIndex(index: number): FlxGamepad | null
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `index`   | `number` | -           |

**Returns:** `FlxGamepad | null`

### `playback()`

```ts
playback(records: readonly FlxGamepadFrameRecord[]): void
```

**Parameters:**

| Parameter | Type                               | Description |
| :-------- | :--------------------------------- | :---------- |
| `records` | `readonly FlxGamepadFrameRecord[]` | -           |

**Returns:** `void`

### `record()`

```ts
record(): FlxGamepadFrameRecord[]
```

**Returns:** `FlxGamepadFrameRecord[]`

### `reset()`

```ts
reset(): void
```

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`
