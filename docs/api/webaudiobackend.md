---
title: WebAudioBackend (Class)
description: API reference documentation for WebAudioBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# WebAudioBackend

Browser `AudioContext` implementation of `FlxAudioBackend`.

Creates the `AudioContext` lazily on first play or `unlockAudio()`. Handles autoplay policy via a queue: sounds played before unlock are recorded and replayed on the first user gesture. By default, hiding the document suspends the context and returning resumes it.

```ts
export declare class WebAudioBackend implements FlxAudioBackend
```

## Constructors

```ts
constructor(options?: WebAudioBackendOptions)
```

Constructs a new instance of the `WebAudioBackend` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `WebAudioBackendOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`suspended`** | `readonly` | `boolean` | - |
| **`unlocked`** | `readonly` | `boolean` | - |

## Methods

### `createSound()`

```ts
createSound(source: unknown, streaming: boolean): FlxSoundHandle
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `unknown` | - |
| `streaming` | `boolean` | - |

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

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `muted` | `boolean` | - |

**Returns:** `void`

### `setGlobalVolume()`

```ts
setGlobalVolume(volume: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `volume` | `number` | - |

**Returns:** `void`

### `unlockAudio()`

```ts
unlockAudio(): void
```

**Returns:** `void`

