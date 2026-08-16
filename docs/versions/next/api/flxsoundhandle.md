---
title: FlxSoundHandle (Interface)
description: API reference documentation for FlxSoundHandle in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSoundHandle

Low-level handle to a single playing sound, owned by a backend. `FlxSound` drives playback through this interface.

```ts
export interface FlxSoundHandle
```

## Properties

| Property       | Modifiers  | Type      | Description |
| :------------- | :--------- | :-------- | :---------- |
| **`duration`** | `readonly` | `number`  | -           |
| **`playing`**  | `readonly` | `boolean` | -           |
| **`position`** | `readonly` | `number`  | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `pause()`

```ts
pause(): void
```

**Returns:** `void`

### `play()`

```ts
play(startTime?: number, loop?: boolean): void
```

**Parameters:**

| Parameter   | Type      | Description |
| :---------- | :-------- | :---------- |
| `startTime` | `number`  | -           |
| `loop`      | `boolean` | -           |

**Returns:** `void`

### `resume()`

```ts
resume(): void
```

**Returns:** `void`

### `setPan()`

```ts
setPan(pan: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `pan`     | `number` | -           |

**Returns:** `void`

### `setVolume()`

```ts
setVolume(volume: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `volume`  | `number` | -           |

**Returns:** `void`

### `stop()`

```ts
stop(): void
```

**Returns:** `void`
