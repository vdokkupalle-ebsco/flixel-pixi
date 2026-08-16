---
title: FlxLog (Class)
description: API reference documentation for FlxLog in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLog

Ring-buffer log that keeps the last MAX_ENTRIES messages. Mirrors AS3 FlxG.log.

```ts
export declare class FlxLog
```

## Properties

| Property          | Modifiers           | Type                  | Description                                     |
| :---------------- | :------------------ | :-------------------- | :---------------------------------------------- |
| **`entries`**     | `readonly`          | `readonly LogEntry[]` | Live snapshot of stored entries (oldest first). |
| **`MAX_ENTRIES`** | `static` `readonly` | ``                    | -                                               |

## Methods

### `add()`

```ts
add(message: string, color?: number): void
```

Adds a message. Oldest entry is dropped when capacity is exceeded.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `message` | `string` | -           |
| `color`   | `number` | -           |

**Returns:** `void`

### `clear()`

```ts
clear(): void
```

Removes all stored entries.

**Returns:** `void`

### `error()`

```ts
error(message: string): void
```

Adds an error-styled (red) message.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `message` | `string` | -           |

**Returns:** `void`

### `warn()`

```ts
warn(message: string): void
```

Adds a warning-styled (yellow) message.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `message` | `string` | -           |

**Returns:** `void`
