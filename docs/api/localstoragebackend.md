---
title: LocalStorageBackend (Class)
description: API reference documentation for LocalStorageBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# LocalStorageBackend

`localStorage`-backed storage implementation.

Keys are namespaced as `flixel:{name}` to avoid collisions with other web applications. Quota failures are detected via `DOMException` and surfaced through the `FlxSaveResult` type. Malformed stored JSON returns `null` and logs a console warning rather than throwing.

```ts
export declare class LocalStorageBackend implements FlxStorageBackend
```

## Methods

### `close()`

```ts
close(key: string): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `void`

### `erase()`

```ts
erase(key: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `boolean`

### `read()`

```ts
read(key: string): Record<string, unknown> | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `Record<string, unknown> | null`

### `write()`

```ts
write(key: string, data: Record<string, unknown>): FlxSaveResult
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |
| `data` | `Record<string, unknown>` | - |

**Returns:** `FlxSaveResult`

