---
title: FlxAudioService (Interface)
description: API reference documentation for FlxAudioService in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAudioService

Audio service interface consumed by `FlxG` and `FlxGame`.

```ts
export interface FlxAudioService
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`music`** | - | `FlxSound \| null` | - |
| **`musicGroup`** | `readonly` | `FlxSoundGroup` | - |
| **`mute`** | - | `boolean` | - |
| **`soundGroup`** | `readonly` | `FlxSoundGroup` | - |
| **`sounds`** | `readonly` | `FlxGroup` | - |
| **`volume`** | - | `number` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `destroySounds()`

```ts
destroySounds(forceDestroy: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `forceDestroy` | `boolean` | - |

**Returns:** `void`

### `onChange()`

```ts
onChange?(listener: (state: FlxAudioState) => void): () => void
```

Subscribe to master volume/mute changes when supported.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `listener` | `(state: FlxAudioState) => void` | - |

**Returns:** `() => void`

### `pauseSounds()`

```ts
pauseSounds(): void
```

**Returns:** `void`

### `play()`

```ts
play(source: unknown, volume?: number, loop?: boolean, autoDestroy?: boolean, group?: FlxSoundGroup): FlxSound
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `unknown` | - |
| `volume` | `number` | - |
| `loop` | `boolean` | - |
| `autoDestroy` | `boolean` | - |
| `group` | `FlxSoundGroup` | - |

**Returns:** `FlxSound`

### `playMusic()`

```ts
playMusic(source: unknown, volume?: number, group?: FlxSoundGroup): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `unknown` | - |
| `volume` | `number` | - |
| `group` | `FlxSoundGroup` | - |

**Returns:** `void`

### `resumeSounds()`

```ts
resumeSounds(): void
```

**Returns:** `void`

### `stream()`

```ts
stream(url: string, volume?: number, loop?: boolean, autoDestroy?: boolean, group?: FlxSoundGroup): FlxSound
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | - |
| `volume` | `number` | - |
| `loop` | `boolean` | - |
| `autoDestroy` | `boolean` | - |
| `group` | `FlxSoundGroup` | - |

**Returns:** `FlxSound`

### `updateSounds()`

```ts
updateSounds(elapsed: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `elapsed` | `number` | - |

**Returns:** `void`

