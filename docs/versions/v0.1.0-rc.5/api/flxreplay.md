---
title: FlxReplay (Class)
description: API reference documentation for FlxReplay in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxReplay

Manages deterministic input recording, playback, and checksum verification.

```ts
export declare class FlxReplay
```

## Constructors

```ts
constructor();
```

Constructs a new instance of the `FlxReplay` class

## Properties

| Property              | Modifiers | Type             | Description |
| :-------------------- | :-------- | :--------------- | :---------- |
| **`diverged`**        | -         | `boolean`        | -           |
| **`divergenceFrame`** | -         | `number \| null` | -           |
| **`divergenceInfo`**  | -         | `string \| null` | -           |
| **`finished`**        | -         | `boolean`        | -           |
| **`frame`**           | -         | `number`         | -           |
| **`frameCount`**      | -         | `number`         | -           |
| **`frames`**          | -         | `FrameRecord[]`  | -           |
| **`seed`**            | -         | `number`         | -           |

## Methods

### `create()`

```ts
create(seed: number): void
```

Initializes a clean replay container for recording starting with the specified RNG seed.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `seed`    | `number` | -           |

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

Clears all stored frames and resets status flags.

**Returns:** `void`

### `flagDivergence()`

```ts
flagDivergence(frameIndex: number, expected: string, actual: string): void
```

Flags a divergence error when current engine checksum fails to match replay checksum.

**Parameters:**

| Parameter    | Type     | Description |
| :----------- | :------- | :---------- |
| `frameIndex` | `number` | -           |
| `expected`   | `string` | -           |
| `actual`     | `string` | -           |

**Returns:** `void`

### `load()`

```ts
load(data: string | ReplayFileFormat): void
```

Loads a replay from a JSON string or plain replay object.

**Parameters:**

| Parameter | Type                         | Description |
| :-------- | :--------------------------- | :---------- |
| `data`    | `string \| ReplayFileFormat` | -           |

**Returns:** `void`

### `playNextFrame()`

```ts
playNextFrame(): FrameRecord | null
```

Retrieves the next FrameRecord for playback and advances the frame counter.

**Returns:** `FrameRecord | null`

### `recordFrame()`

```ts
recordFrame(frameIndex: number, keys?: CodePair[], mouse?: MouseRecord | null, checksum?: string | null, gamepads?: FlxGamepadFrameRecord[], touches?: FlxTouchFrameRecord[]): void
```

Records a single frame's input and optional state checksum.

**Parameters:**

| Parameter    | Type                      | Description |
| :----------- | :------------------------ | :---------- |
| `frameIndex` | `number`                  | -           |
| `keys`       | `CodePair[]`              | -           |
| `mouse`      | `MouseRecord \| null`     | -           |
| `checksum`   | `string \| null`          | -           |
| `gamepads`   | `FlxGamepadFrameRecord[]` | -           |
| `touches`    | `FlxTouchFrameRecord[]`   | -           |

**Returns:** `void`

### `rewind()`

```ts
rewind(): void
```

Rewinds playback to the first frame.

**Returns:** `void`

### `save()`

```ts
save(): string
```

Serializes the replay into a versioned JSON string.

**Returns:** `string`
