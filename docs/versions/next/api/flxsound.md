---
title: FlxSound (Class)
description: API reference documentation for FlxSound in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSound

Port of `org.flixel.FlxSound`.

Extends `FlxBasic` and drives playback through a `FlxSoundHandle` obtained from the active `FlxAudioBackend`. All authoritative state (volume, fade, proximity, loop, alive/exists) lives on this object; the handle is a platform-specific playback delegate.

```ts
export declare class FlxSound extends FlxBasic
```

## Properties

| Property              | Modifiers  | Type                    | Description                                                                           |
| :-------------------- | :--------- | :---------------------- | :------------------------------------------------------------------------------------ |
| **`amplitude`**       | -          | `number`                | Smoothed peak amplitude 0–1 (combined).                                               |
| **`amplitudeLeft`**   | -          | `number`                | Smoothed peak amplitude for the left channel (same as `amplitude` in stereo panner).  |
| **`amplitudeRight`**  | -          | `number`                | Smoothed peak amplitude for the right channel (same as `amplitude` in stereo panner). |
| **`artist`**          | -          | `string`                | Metadata artist string (informational only).                                          |
| **`autoDestroy`**     | -          | `boolean`               | If true, `destroy()` is called automatically when playback finishes.                  |
| **`effectiveVolume`** | `readonly` | `number`                | Effective gain after global, group, instance, and proximity attenuation.              |
| **`group`**           | -          | `FlxSoundGroup \| null` | Hierarchical volume/mute bus used by this sound.                                      |
| **`name`**            | -          | `string`                | Sound name for identification and debugging.                                          |
| **`survive`**         | -          | `boolean`               | If true, this sound survives state switches.                                          |
| **`volume`**          | -          | `number`                | Per-instance volume (0–1).                                                            |
| **`x`**               | -          | `number`                | World x position for proximity audio.                                                 |
| **`y`**               | -          | `number`                | World y position for proximity audio.                                                 |

## Methods

### `attachTo()`

```ts
attachTo(source: FlxObject, options: FlxSoundAttachmentOptions): FlxSound
```

Follow a world object and spatialize it relative to a listener. Camera visibility may pause or stop playback automatically.

**Parameters:**

| Parameter | Type                        | Description |
| :-------- | :-------------------------- | :---------- |
| `source`  | `FlxObject`                 | -           |
| `options` | `FlxSoundAttachmentOptions` | -           |

**Returns:** `FlxSound`

### `destroy()`

```ts
destroy(): void
```

Release the backend handle and clean up.

**Returns:** `void`

### `detach()`

```ts
detach(): FlxSound
```

Stop following the attached object and restore ordinary playback.

**Returns:** `FlxSound`

### `fadeIn()`

```ts
fadeIn(duration: number): void
```

Fade the volume in from 0 over `duration` seconds.

**Parameters:**

| Parameter  | Type     | Description |
| :--------- | :------- | :---------- |
| `duration` | `number` | -           |

**Returns:** `void`

### `fadeOut()`

```ts
fadeOut(duration: number, callback?: (() => void) | null): void
```

Fade the volume out over `duration` seconds.

**Parameters:**

| Parameter  | Type                   | Description                     |
| :--------- | :--------------------- | :------------------------------ |
| `duration` | `number`               | Fade time in seconds.           |
| `callback` | `(() => void) \| null` | Called when the fade completes. |

**Returns:** `void`

### `getActualVolume()`

```ts
getActualVolume(): number
```

Effective volume accounting for global volume and mute.

**Returns:** `number`

### `kill()`

```ts
kill(): void
```

Kill the sound: stop playback and mark dead/nonexistent.

**Returns:** `void`

### `loadEmbedded()`

```ts
loadEmbedded(source: unknown, loop?: boolean, autoDestroy?: boolean): FlxSound
```

Load an embedded sound asset.

**Parameters:**

| Parameter     | Type      | Description                                   |
| :------------ | :-------- | :-------------------------------------------- |
| `source`      | `unknown` | An `AudioBuffer`, URL string, or asset alias. |
| `loop`        | `boolean` | Whether the sound should loop.                |
| `autoDestroy` | `boolean` | Whether to auto-destroy when done.            |

**Returns:** `FlxSound`

### `loadStream()`

```ts
loadStream(url: string, loop?: boolean, autoDestroy?: boolean): FlxSound
```

Load a streaming sound from a URL.

**Parameters:**

| Parameter     | Type      | Description                        |
| :------------ | :-------- | :--------------------------------- |
| `url`         | `string`  | The streaming URL.                 |
| `loop`        | `boolean` | Whether the sound should loop.     |
| `autoDestroy` | `boolean` | Whether to auto-destroy when done. |

**Returns:** `FlxSound`

### `pause()`

```ts
pause(): void
```

Pause playback.

**Returns:** `void`

### `play()`

```ts
play(forceRestart?: boolean): void
```

Start or restart playback.

**Parameters:**

| Parameter      | Type      | Description |
| :------------- | :-------- | :---------- |
| `forceRestart` | `boolean` | -           |

**Returns:** `void`

### `proximity()`

```ts
proximity(x: number, y: number, target: FlxObject, radius: number, pan?: boolean): FlxSound
```

Configure proximity-based volume and panning.

**Parameters:**

| Parameter | Type        | Description                                                           |
| :-------- | :---------- | :-------------------------------------------------------------------- |
| `x`       | `number`    | Source x position.                                                    |
| `y`       | `number`    | Source y position.                                                    |
| `target`  | `FlxObject` | The object to measure distance from (typically the player or camera). |
| `radius`  | `number`    | Maximum audible distance.                                             |
| `pan`     | `boolean`   | Whether to apply stereo panning based on horizontal offset.           |

**Returns:** `FlxSound`

### `resume()`

```ts
resume(): void
```

Resume from pause.

**Returns:** `void`

### `stop()`

```ts
stop(): void
```

Stop playback and reset position.

**Returns:** `void`

### `update()`

```ts
update(): void
```

Per-frame update: fades, proximity, auto-destroy, amplitude.

**Returns:** `void`
