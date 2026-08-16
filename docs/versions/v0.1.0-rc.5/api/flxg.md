---
title: FlxG (Class)
description: API reference documentation for FlxG in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxG

Static compatibility facade delegating to one active [link](#).

```ts
export declare class FlxG
```

## Properties

| Property                    | Modifiers           | Type                   | Description                                                                                                                                                                                                                                                                                                                                   |
| :-------------------------- | :------------------ | :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`actions`**               | `static` `readonly` | `FlxActions`           | -                                                                                                                                                                                                                                                                                                                                             |
| **`atlas`**                 | `static` `readonly` | `FlxAtlasRegistry`     | The atlas registry. Load named atlases then look them up by key:<br><br><br>`ts<br>await FlxG.atlas.load('player', './player.png', './player.xml');<br>const atlas = FlxG.atlas.get('player');<br><br>`<br>Safe to call before `FlxGame` boots — a shared fallback registry is used and then attached to the active context when one appears. |
| **`bgColor`**               | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`BLACK`**                 | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`BLUE`**                  | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`camera`**                | `static`            | `FlxCamera`            | -                                                                                                                                                                                                                                                                                                                                             |
| **`cameras`**               | `static` `readonly` | `readonly FlxCamera[]` | -                                                                                                                                                                                                                                                                                                                                             |
| **`context`**               | `static` `readonly` | `FlxContext`           | -                                                                                                                                                                                                                                                                                                                                             |
| **`DEBUGGER_BIG`**          | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`DEBUGGER_LEFT`**         | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`DEBUGGER_MICRO`**        | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`DEBUGGER_RIGHT`**        | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`DEBUGGER_STANDARD`**     | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`DEBUGGER_TOP`**          | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`elapsed`**               | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`gamepads`**              | `static` `readonly` | `FlxGamepadManager`    | -                                                                                                                                                                                                                                                                                                                                             |
| **`globalSeed`**            | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`GREEN`**                 | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`hasContext`**            | `static` `readonly` | `boolean`              | -                                                                                                                                                                                                                                                                                                                                             |
| **`height`**                | `static` `readonly` | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`keys`**                  | `static` `readonly` | `Keyboard`             | -                                                                                                                                                                                                                                                                                                                                             |
| **`level`**                 | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`levels`**                | `static` `readonly` | `unknown[]`            | -                                                                                                                                                                                                                                                                                                                                             |
| **`LIBRARY_MAJOR_VERSION`** | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`LIBRARY_MINOR_VERSION`** | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`LIBRARY_NAME`**          | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`log`**                   | `static` `readonly` | `FlxLog`               | Live log accessible via `FlxG.log.add('message')`. Requires a FlxGame instance to be active (the log service is installed by FlxGame).                                                                                                                                                                                                        |
| **`mouse`**                 | `static` `readonly` | `Mouse`                | -                                                                                                                                                                                                                                                                                                                                             |
| **`music`**                 | `static` `readonly` | `FlxSound \| null`     | The currently playing music track, or `null`.                                                                                                                                                                                                                                                                                                 |
| **`musicGroup`**            | `static` `readonly` | `FlxSoundGroup`        | Default bus for music.                                                                                                                                                                                                                                                                                                                        |
| **`mute`**                  | `static`            | `boolean`              | Global mute flag.                                                                                                                                                                                                                                                                                                                             |
| **`paused`**                | `static`            | `boolean`              | -                                                                                                                                                                                                                                                                                                                                             |
| **`PINK`**                  | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`plugins`**               | `static` `readonly` | `readonly FlxBasic[]`  | -                                                                                                                                                                                                                                                                                                                                             |
| **`RED`**                   | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`save`**                  | `static` `readonly` | `FlxSave`              | Primary save slot.                                                                                                                                                                                                                                                                                                                            |
| **`saves`**                 | `static` `readonly` | `FlxSave[]`            | All registered save slots.                                                                                                                                                                                                                                                                                                                    |
| **`score`**                 | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`scores`**                | `static` `readonly` | `unknown[]`            | -                                                                                                                                                                                                                                                                                                                                             |
| **`soundGroup`**            | `static` `readonly` | `FlxSoundGroup`        | Default bus for sound effects.                                                                                                                                                                                                                                                                                                                |
| **`sounds`**                | `static` `readonly` | `FlxGroup`             | The active sound-effects group.                                                                                                                                                                                                                                                                                                               |
| **`state`**                 | `static` `readonly` | `FlxState \| null`     | -                                                                                                                                                                                                                                                                                                                                             |
| **`timeScale`**             | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`touches`**               | `static` `readonly` | `FlxTouchManager`      | -                                                                                                                                                                                                                                                                                                                                             |
| **`vcr`**                   | `static` `readonly` | `FlxVCR`               | Global VCR state object.                                                                                                                                                                                                                                                                                                                      |
| **`virtualInputs`**         | `static` `readonly` | `FlxVirtualInput`      | Context-owned registry resolved by serializable virtual action sources.                                                                                                                                                                                                                                                                       |
| **`visualDebug`**           | `static`            | `boolean`              | -                                                                                                                                                                                                                                                                                                                                             |
| **`volume`**                | `static`            | `number`               | Global volume (0–1).                                                                                                                                                                                                                                                                                                                          |
| **`watch`**                 | `static` `readonly` | `FlxWatch`             | Live watch panel accessible via `FlxG.watch.add(obj, 'field')`. Requires a FlxGame instance to be active.                                                                                                                                                                                                                                     |
| **`WHITE`**                 | `static` `readonly` | ``                     | -                                                                                                                                                                                                                                                                                                                                             |
| **`width`**                 | `static` `readonly` | `number`               | -                                                                                                                                                                                                                                                                                                                                             |
| **`worldBounds`**           | `static`            | `FlxRect`              | -                                                                                                                                                                                                                                                                                                                                             |
| **`worldDivisions`**        | `static`            | `number`               | -                                                                                                                                                                                                                                                                                                                                             |

## Methods

### `static` `addCamera()`

```ts
static addCamera(camera: FlxCamera): FlxCamera
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `camera`  | `FlxCamera` | -           |

**Returns:** `FlxCamera`

### `static` `addPlugin()`

```ts
static addPlugin<T extends FlxBasic>(plugin: T): T
```

**Parameters:**

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `plugin`  | `T`  | -           |

**Returns:** `T`

### `static` `clearContext()`

```ts
static clearContext(context?: FlxContext): void
```

**Parameters:**

| Parameter | Type         | Description |
| :-------- | :----------- | :---------- |
| `context` | `FlxContext` | -           |

**Returns:** `void`

### `static` `collide()`

```ts
static collide(first?: FlxBasic | null, second?: FlxBasic | null, notify?: FlxOverlapCallback | null): boolean
```

**Parameters:**

| Parameter | Type                         | Description |
| :-------- | :--------------------------- | :---------- |
| `first`   | `FlxBasic \| null`           | -           |
| `second`  | `FlxBasic \| null`           | -           |
| `notify`  | `FlxOverlapCallback \| null` | -           |

**Returns:** `boolean`

### `static` `fade()`

```ts
static fade(color?: number, duration?: number, onComplete?: FlxCameraEffectCallback | null, force?: boolean): void
```

**Parameters:**

| Parameter    | Type                              | Description |
| :----------- | :-------------------------------- | :---------- |
| `color`      | `number`                          | -           |
| `duration`   | `number`                          | -           |
| `onComplete` | `FlxCameraEffectCallback \| null` | -           |
| `force`      | `boolean`                         | -           |

**Returns:** `void`

### `static` `flash()`

```ts
static flash(color?: number, duration?: number, onComplete?: FlxCameraEffectCallback | null, force?: boolean): void
```

**Parameters:**

| Parameter    | Type                              | Description |
| :----------- | :-------------------------------- | :---------- |
| `color`      | `number`                          | -           |
| `duration`   | `number`                          | -           |
| `onComplete` | `FlxCameraEffectCallback \| null` | -           |
| `force`      | `boolean`                         | -           |

**Returns:** `void`

### `static` `getLibraryName()`

```ts
static getLibraryName(): string
```

**Returns:** `string`

### `static` `getPlugin()`

```ts
static getPlugin<T extends FlxBasic>(pluginClass: FlxPluginConstructor<T>): T | null
```

**Parameters:**

| Parameter     | Type                      | Description |
| :------------ | :------------------------ | :---------- |
| `pluginClass` | `FlxPluginConstructor<T>` | -           |

**Returns:** `T | null`

### `static` `getRandom()`

```ts
static getRandom<T>(objects: readonly T[] | null, startIndex?: number, length?: number): T | null
```

**Parameters:**

| Parameter    | Type                   | Description |
| :----------- | :--------------------- | :---------- |
| `objects`    | `readonly T[] \| null` | -           |
| `startIndex` | `number`               | -           |
| `length`     | `number`               | -           |

**Returns:** `T | null`

### `static` `installContext()`

```ts
static installContext(context: FlxContext): void
```

**Parameters:**

| Parameter | Type         | Description |
| :-------- | :----------- | :---------- |
| `context` | `FlxContext` | -           |

**Returns:** `void`

### `static` `loadReplay()`

```ts
static loadReplay(replay: FlxReplay, reloadState?: FlxState | null, cancelKeys?: string[], timeout?: number, onComplete?: (() => void) | null): void
```

Loads and starts playback of a recorded replay.

**Parameters:**

| Parameter     | Type                   | Description |
| :------------ | :--------------------- | :---------- |
| `replay`      | `FlxReplay`            | -           |
| `reloadState` | `FlxState \| null`     | -           |
| `cancelKeys`  | `string[]`             | -           |
| `timeout`     | `number`               | -           |
| `onComplete`  | `(() => void) \| null` | -           |

**Returns:** `void`

### `static` `overlap()`

```ts
static overlap(first?: FlxBasic | null, second?: FlxBasic | null, notify?: FlxOverlapCallback | null, process?: FlxProcessCallback | null): boolean
```

**Parameters:**

| Parameter | Type                         | Description |
| :-------- | :--------------------------- | :---------- |
| `first`   | `FlxBasic \| null`           | -           |
| `second`  | `FlxBasic \| null`           | -           |
| `notify`  | `FlxOverlapCallback \| null` | -           |
| `process` | `FlxProcessCallback \| null` | -           |

**Returns:** `boolean`

### `static` `pauseSounds()`

```ts
static pauseSounds(): void
```

Pause all sounds and music.

**Returns:** `void`

### `static` `play()`

```ts
static play(source: unknown, volume?: number, loop?: boolean, autoDestroy?: boolean, group?: FlxSoundGroup): FlxSound
```

Play a sound effect.

**Parameters:**

| Parameter     | Type            | Description                                          |
| :------------ | :-------------- | :--------------------------------------------------- |
| `source`      | `unknown`       | `AudioBuffer`, URL string, or asset alias.           |
| `volume`      | `number`        | Per-instance volume (0–1). Defaults to 1.            |
| `loop`        | `boolean`       | Whether to loop. Defaults to false.                  |
| `autoDestroy` | `boolean`       | Whether to auto-destroy when done. Defaults to true. |
| `group`       | `FlxSoundGroup` | -                                                    |

**Returns:** `FlxSound`

### `static` `playMusic()`

```ts
static playMusic(source: unknown, volume?: number, group?: FlxSoundGroup): void
```

Play music, stopping the current track.

**Parameters:**

| Parameter | Type            | Description                                |
| :-------- | :-------------- | :----------------------------------------- |
| `source`  | `unknown`       | `AudioBuffer`, URL string, or asset alias. |
| `volume`  | `number`        | Volume (0–1). Defaults to 1.               |
| `group`   | `FlxSoundGroup` | -                                          |

**Returns:** `void`

### `static` `random()`

```ts
static random(): number
```

**Returns:** `number`

### `static` `recordReplay()`

```ts
static recordReplay(standardMode?: boolean): void
```

Begins recording deterministic gameplay input to a new replay.

**Parameters:**

| Parameter      | Type      | Description                                                                               |
| :------------- | :-------- | :---------------------------------------------------------------------------------------- |
| `standardMode` | `boolean` | If true (default), resets the active state to frame 0 for deterministic replay alignment. |

**Returns:** `void`

### `static` `reloadReplay()`

```ts
static reloadReplay(resetState?: boolean): void
```

Reloads the active replay from the beginning.

**Parameters:**

| Parameter    | Type      | Description |
| :----------- | :-------- | :---------- |
| `resetState` | `boolean` | -           |

**Returns:** `void`

### `static` `removeCamera()`

```ts
static removeCamera(camera: FlxCamera, destroy?: boolean): boolean
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `camera`  | `FlxCamera` | -           |
| `destroy` | `boolean`   | -           |

**Returns:** `boolean`

### `static` `removePlugin()`

```ts
static removePlugin<T extends FlxBasic>(plugin: T): T
```

**Parameters:**

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `plugin`  | `T`  | -           |

**Returns:** `T`

### `static` `removePluginType()`

```ts
static removePluginType<T extends FlxBasic>(pluginClass: FlxPluginConstructor<T>): boolean
```

**Parameters:**

| Parameter     | Type                      | Description |
| :------------ | :------------------------ | :---------- |
| `pluginClass` | `FlxPluginConstructor<T>` | -           |

**Returns:** `boolean`

### `static` `resetCameras()`

```ts
static resetCameras(camera?: FlxCamera): FlxCamera
```

**Parameters:**

| Parameter | Type        | Description |
| :-------- | :---------- | :---------- |
| `camera`  | `FlxCamera` | -           |

**Returns:** `FlxCamera`

### `static` `resetInput()`

```ts
static resetInput(): void
```

**Returns:** `void`

### `static` `resetState()`

```ts
static resetState(): void
```

**Returns:** `void`

### `static` `resumeSounds()`

```ts
static resumeSounds(): void
```

Resume all sounds and music.

**Returns:** `void`

### `static` `shake()`

```ts
static shake(intensity?: number, duration?: number, onComplete?: FlxCameraEffectCallback | null, force?: boolean, direction?: FlxCameraShakeDirection): void
```

**Parameters:**

| Parameter    | Type                              | Description |
| :----------- | :-------------------------------- | :---------- |
| `intensity`  | `number`                          | -           |
| `duration`   | `number`                          | -           |
| `onComplete` | `FlxCameraEffectCallback \| null` | -           |
| `force`      | `boolean`                         | -           |
| `direction`  | `FlxCameraShakeDirection`         | -           |

**Returns:** `void`

### `static` `shuffle()`

```ts
static shuffle<T>(objects: T[], howManyTimes: number): T[]
```

**Parameters:**

| Parameter      | Type     | Description |
| :------------- | :------- | :---------- |
| `objects`      | `T[]`    | -           |
| `howManyTimes` | `number` | -           |

**Returns:** `T[]`

### `static` `stopRecording()`

```ts
static stopRecording(): string
```

Stops recording the current replay and returns its serialized JSON payload.

**Returns:** `string`

### `static` `stopReplay()`

```ts
static stopReplay(): void
```

Stops playback of the currently running replay.

**Returns:** `void`

### `static` `stream()`

```ts
static stream(url: string, volume?: number, loop?: boolean, autoDestroy?: boolean, group?: FlxSoundGroup): FlxSound
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

### `static` `switchState()`

```ts
static switchState(state: FlxState): void
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `state`   | `FlxState` | -           |

**Returns:** `void`
