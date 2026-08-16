---
title: FlxAsyncStorageBackend (Interface)
description: API reference documentation for FlxAsyncStorageBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAsyncStorageBackend

Storage backend whose durable writes must be awaited.

```ts
export interface FlxAsyncStorageBackend extends FlxStorageBackend
```

## Methods

### `eraseAsync()`

```ts
eraseAsync(key: string): Promise<boolean>
```

Erase data and resolve only after the transaction commits or fails.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `Promise<boolean>`

### `writeAsync()`

```ts
writeAsync(key: string, data: Record<string, unknown>): Promise<FlxSaveResult>
```

Persist data and resolve only after the transaction commits or fails.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |
| `data` | `Record<string, unknown>` | - |

**Returns:** `Promise<FlxSaveResult>`

