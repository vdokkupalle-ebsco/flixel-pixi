---
title: FlxSave (Class)
description: API reference documentation for FlxSave in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSave

Port of `org.flixel.FlxSave`.

Provides namespaced, versioned save slots backed by a replaceable `FlxStorageBackend`. The default backend is provided by the `FlxContext` service map (typically `LocalStorageBackend`).

```ts
export declare class FlxSave
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`data`** | - | `Record<string, unknown> \| null` | User-facing data object. Read and mutate freely between `bind()` and `close()`. |
| **`name`** | - | `string \| null` | Slot name set by `bind()`. |

## Methods

### `bind()`

```ts
bind(name: string, options?: FlxSaveBindOptions): boolean
```

Bind this save to a named slot.

Reads existing data from the backend. If a `version` is provided and the stored version differs, the `migrate` callback transforms the data in-place and the result is flushed back immediately.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | The slot name (namespaced automatically by the backend). |
| `options` | `FlxSaveBindOptions` | Optional version, migration, and backend override. |

**Returns:** `boolean`

> `true` if data was loaded (even if empty), `false` on error.

### `close()`

```ts
close(): void
```

Flush and disconnect from the slot.

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

Release all resources.

**Returns:** `void`

### `erase()`

```ts
erase(): boolean
```

Erase all stored data for this slot.

**Returns:** `boolean`

### `eraseAsync()`

```ts
eraseAsync(): Promise<boolean>
```

Await erasure for an asynchronous backend.

**Returns:** `Promise<boolean>`

### `flush()`

```ts
flush(): FlxSaveResult
```

Persist the current `data` to the storage backend.

**Returns:** `FlxSaveResult`

> A typed result indicating success or the failure category.

### `flushAsync()`

```ts
flushAsync(): Promise<FlxSaveResult>
```

Persist data and await durable completion for asynchronous backends. Synchronous backends resolve with the same result as [link](#).

**Returns:** `Promise<FlxSaveResult>`

