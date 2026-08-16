---
title: FlxStorageBackend (Interface)
description: API reference documentation for FlxStorageBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxStorageBackend

Replaceable storage backend.

The default implementation uses `localStorage`; an optional `IndexedDB` adapter is available for larger data. A `NullStorageBackend` enables headless testing.

```ts
export interface FlxStorageBackend
```

## Methods

### `close()`

```ts
close(key: string): void
```

Release any resources associated with `key`.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `void`

### `erase()`

```ts
erase(key: string): boolean
```

Erase the record for `key`. Returns true if a record was present.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `boolean`

### `read()`

```ts
read(key: string): Record<string, unknown> | null
```

Read the data record for `key`, or `null` if missing/malformed.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `Record<string, unknown> | null`

### `write()`

```ts
write(key: string, data: Record<string, unknown>): FlxSaveResult
```

Write `data` for `key`. Returns a typed success/failure result.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |
| `data` | `Record<string, unknown>` | - |

**Returns:** `FlxSaveResult`

