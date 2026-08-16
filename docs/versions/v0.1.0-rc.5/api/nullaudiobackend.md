---
title: NullAudioBackend (Class)
description: API reference documentation for NullAudioBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# NullAudioBackend

No-op audio backend for headless unit tests. Always unlocked, never suspended, all methods are inert.

```ts
export declare class NullAudioBackend implements FlxAudioBackend
```

## Properties

| Property        | Modifiers  | Type | Description |
| :-------------- | :--------- | :--- | :---------- |
| **`suspended`** | `readonly` | ``   | -           |
| **`unlocked`**  | `readonly` | ``   | -           |

## Methods

### `createSound()`

```ts
createSound(source: unknown, streaming: boolean): FlxSoundHandle
```

**Parameters:**

| Parameter   | Type      | Description |
| :---------- | :-------- | :---------- |
| `source`    | `unknown` | -           |
| `streaming` | `boolean` | -           |

**Returns:** `FlxSoundHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `pauseAll()`

```ts
pauseAll(): void
```

**Returns:** `void`

### `resumeAll()`

```ts
resumeAll(): void
```

**Returns:** `void`

### `setGlobalMute()`

```ts
setGlobalMute(muted: boolean): void
```

**Parameters:**

| Parameter | Type      | Description |
| :-------- | :-------- | :---------- |
| `muted`   | `boolean` | -           |

**Returns:** `void`

### `setGlobalVolume()`

```ts
setGlobalVolume(volume: number): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `volume`  | `number` | -           |

**Returns:** `void`

### `unlockAudio()`

```ts
unlockAudio(): void
```

**Returns:** `void`
