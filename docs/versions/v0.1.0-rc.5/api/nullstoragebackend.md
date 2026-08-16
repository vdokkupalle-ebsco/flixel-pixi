---
title: NullStorageBackend (Class)
description: API reference documentation for NullStorageBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# NullStorageBackend

In-memory storage backend for headless unit tests. Data lives only for the lifetime of this instance.

```ts
export declare class NullStorageBackend implements FlxStorageBackend
```

## Methods

### `close()`

```ts
close(key: string): void
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `key`     | `string` | -           |

**Returns:** `void`

### `erase()`

```ts
erase(key: string): boolean
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `key`     | `string` | -           |

**Returns:** `boolean`

### `read()`

```ts
read(key: string): Record<string, unknown> | null
```

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `key`     | `string` | -           |

**Returns:** `Record<string, unknown> | null`

### `write()`

```ts
write(key: string, data: Record<string, unknown>): FlxSaveResult
```

**Parameters:**

| Parameter | Type                      | Description |
| :-------- | :------------------------ | :---------- |
| `key`     | `string`                  | -           |
| `data`    | `Record<string, unknown>` | -           |

**Returns:** `FlxSaveResult`
