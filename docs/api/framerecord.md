---
title: FrameRecord (Class)
description: API reference documentation for FrameRecord in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FrameRecord

Represents recorded inputs and state checksum for a single simulation frame.

```ts
export declare class FrameRecord
```

## Constructors

```ts
constructor(frame?: number, keys?: CodePair[], mouse?: MouseRecord | null, checksum?: string | null, gamepads?: FlxGamepadFrameRecord[], touches?: FlxTouchFrameRecord[])
```

Constructs a new instance of the `FrameRecord` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `frame` | `number` | - |
| `keys` | `CodePair[]` | - |
| `mouse` | `MouseRecord \| null` | - |
| `checksum` | `string \| null` | - |
| `gamepads` | `FlxGamepadFrameRecord[]` | - |
| `touches` | `FlxTouchFrameRecord[]` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`checksum`** | - | `string \| null` | - |
| **`frame`** | - | `number` | - |
| **`gamepads`** | - | `FlxGamepadFrameRecord[]` | - |
| **`keys`** | - | `CodePair[]` | - |
| **`mouse`** | - | `MouseRecord \| null` | - |
| **`touches`** | - | `FlxTouchFrameRecord[]` | - |

## Methods

### `destroy()`

```ts
destroy(): void
```

Releases resources associated with this frame record.

**Returns:** `void`

### `load()`

```ts
load(data: string | FrameRecordData): void
```

Loads data into this frame record from a plain object or serialized string.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `data` | `string \| FrameRecordData` | - |

**Returns:** `void`

### `save()`

```ts
save(): FrameRecordData
```

Serializes the frame record into a plain JSON object.

**Returns:** `FrameRecordData`

