---
title: FlxAudioManager (Class)
description: API reference documentation for FlxAudioManager in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAudioManager

Owns the audio backend, the music singleton, and the sound-effects group.

Registered on the `FlxContext` service map via `FLX_AUDIO_SERVICE`. `FlxG` resolves it to expose `FlxG.music`, `FlxG.sounds`, `FlxG.play()`, `FlxG.playMusic()`, `FlxG.stream()`, `FlxG.volume`, `FlxG.mute`, `FlxG.pauseSounds()`, and `FlxG.resumeSounds()`.

```ts
export declare class FlxAudioManager implements FlxAudioService
```

## Constructors

```ts
constructor(context: FlxContext, backend: FlxAudioBackend)
```

Constructs a new instance of the `FlxAudioManager` class

| Parameter | Type              | Description |
| :-------- | :---------------- | :---------- |
| `context` | `FlxContext`      | -           |
| `backend` | `FlxAudioBackend` | -           |

## Properties

| Property         | Modifiers  | Type               | Description |
| :--------------- | :--------- | :----------------- | :---------- |
| **`music`**      | -          | `FlxSound \| null` | -           |
| **`musicGroup`** | `readonly` | `FlxSoundGroup`    | -           |
| **`mute`**       | -          | `boolean`          | -           |
| **`soundGroup`** | `readonly` | `FlxSoundGroup`    | -           |
| **`sounds`**     | `readonly` | `FlxGroup`         | -           |
| **`volume`**     | -          | `number`           | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

Full teardown.

**Returns:** `void`

### `destroySounds()`

```ts
destroySounds(forceDestroy: boolean): void
```

Remove non-survive sounds on state switch.

**Parameters:**

| Parameter      | Type      | Description                          |
| :------------- | :-------- | :----------------------------------- |
| `forceDestroy` | `boolean` | If true, destroy survive sounds too. |

**Returns:** `void`

### `onChange()`

```ts
onChange(listener: (state: FlxAudioState) => void): () => void
```

Subscribe to master audio preference changes.

**Parameters:**

| Parameter  | Type                             | Description |
| :--------- | :------------------------------- | :---------- |
| `listener` | `(state: FlxAudioState) => void` | -           |

**Returns:** `() => void`

### `pauseSounds()`

```ts
pauseSounds(): void
```

Pause all sounds and music.

**Returns:** `void`

### `play()`

```ts
play(source: unknown, volume?: number, loop?: boolean, autoDestroy?: boolean, group?: FlxSoundGroup): FlxSound
```

Play a sound effect.

**Parameters:**

| Parameter     | Type            | Description                                          |
| :------------ | :-------------- | :--------------------------------------------------- |
| `source`      | `unknown`       | `AudioBuffer`, `HTMLAudioElement`, or URL string.    |
| `volume`      | `number`        | Per-instance volume (0–1). Defaults to 1.            |
| `loop`        | `boolean`       | Whether to loop. Defaults to false.                  |
| `autoDestroy` | `boolean`       | Whether to auto-destroy when done. Defaults to true. |
| `group`       | `FlxSoundGroup` | -                                                    |

**Returns:** `FlxSound`

### `playMusic()`

```ts
playMusic(source: unknown, volume?: number, group?: FlxSoundGroup): void
```

Play music, stopping the current track.

**Parameters:**

| Parameter | Type            | Description                                       |
| :-------- | :-------------- | :------------------------------------------------ |
| `source`  | `unknown`       | `AudioBuffer`, `HTMLAudioElement`, or URL string. |
| `volume`  | `number`        | Volume (0–1). Defaults to 1.                      |
| `group`   | `FlxSoundGroup` | -                                                 |

**Returns:** `void`

### `resumeSounds()`

```ts
resumeSounds(): void
```

Resume all sounds and music.

**Returns:** `void`

### `stream()`

```ts
stream(url: string, volume?: number, loop?: boolean, autoDestroy?: boolean, group?: FlxSoundGroup): FlxSound
```

Play a streaming sound from a URL.

**Parameters:**

| Parameter     | Type            | Description                                          |
| :------------ | :-------------- | :--------------------------------------------------- |
| `url`         | `string`        | The streaming URL.                                   |
| `volume`      | `number`        | Per-instance volume (0–1). Defaults to 1.            |
| `loop`        | `boolean`       | Whether to loop. Defaults to false.                  |
| `autoDestroy` | `boolean`       | Whether to auto-destroy when done. Defaults to true. |
| `group`       | `FlxSoundGroup` | -                                                    |

**Returns:** `FlxSound`

### `updateSounds()`

```ts
updateSounds(elapsed: number): void
```

Called by `FlxGame.step()` to advance fades, proximity, and auto-destroy.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `elapsed` | `number` | -           |

**Returns:** `void`
