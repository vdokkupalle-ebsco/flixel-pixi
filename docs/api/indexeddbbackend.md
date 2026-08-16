---
title: IndexedDBBackend (Class)
description: API reference documentation for IndexedDBBackend in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# IndexedDBBackend

Optional IndexedDB-backed storage adapter.

Reads from a cache populated while opening. Writes and erases must use the async `FlxSave` methods so their results represent transaction completion.

**Usage:**


```ts
const db = await IndexedDBBackend.open('my-game-saves');
const save = new FlxSave();
save.bind('slot1', { backend: db });
await save.flushAsync();

```

```ts
export declare class IndexedDBBackend implements FlxAsyncStorageBackend
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

### `closeDatabase()`

```ts
closeDatabase(): void
```

Close the underlying IDBDatabase connection.

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

### `eraseAsync()`

```ts
eraseAsync(key: string): Promise<boolean>
```

Delete a record and resolve only after its transaction commits.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `Promise<boolean>`

### `static` `open()`

```ts
static open(dbName: string): Promise<IndexedDBBackend>
```

Open (or create) the named database and return a ready backend.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `dbName` | `string` | The IndexedDB database name. |

**Returns:** `Promise<IndexedDBBackend>`

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

### `writeAsync()`

```ts
writeAsync(key: string, data: Record<string, unknown>): Promise<FlxSaveResult>
```

Persist a record and resolve only after its transaction commits.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |
| `data` | `Record<string, unknown>` | - |

**Returns:** `Promise<FlxSaveResult>`

