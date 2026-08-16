---
title: FlxAudioBackend (Interface)
description: API reference documentation for FlxAudioBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAudioBackend

Replaceable audio backend. The browser implementation wraps Web Audio API; the null implementation enables headless testing.

```ts
export interface FlxAudioBackend
```

## Properties

| Property        | Modifiers  | Type      | Description |
| :-------------- | :--------- | :-------- | :---------- |
| **`suspended`** | `readonly` | `boolean` | -           |
| **`unlocked`**  | `readonly` | `boolean` | -           |

## Methods

### `createSound()`

```ts
createSound(source: unknown, streaming: boolean): FlxSoundHandle
```

Create a sound handle.

**Parameters:**

| Parameter   | Type      | Description                                               |
| :---------- | :-------- | :-------------------------------------------------------- |
| `source`    | `unknown` | decoded `AudioBuffer`, URL string, or `HTMLAudioElement`. |
| `streaming` | `boolean` | true to use a media-element source node.                  |

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

Wire gesture listeners (click/keydown/touchstart) to unlock audio.

**Returns:** `void`
