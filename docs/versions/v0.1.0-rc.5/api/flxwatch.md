---
title: FlxWatch (Class)
description: API reference documentation for FlxWatch in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxWatch

Live field watcher. Mirrors AS3 FlxG.watch.

```ts
export declare class FlxWatch
```

## Methods

### `add()`

```ts
add(obj: Record<string, any>, field: string, displayName?: string): void
```

Begins watching `obj[field]` each step.

**Parameters:**

| Parameter     | Type                  | Description                                              |
| :------------ | :-------------------- | :------------------------------------------------------- |
| `obj`         | `Record<string, any>` | Object to read from.                                     |
| `field`       | `string`              | Property name on the object.                             |
| `displayName` | `string`              | Label shown in the Watch panel (defaults to field name). |

**Returns:** `void`

### `clear()`

```ts
clear(): void
```

Removes all watched fields.

**Returns:** `void`

### `edit()`

```ts
edit(id: string, input: string): FlxWatchMutationResult
```

Parses, validates, and applies an explicitly registered editable value.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `id`      | `string` | -           |
| `input`   | `string` | -           |

**Returns:** `FlxWatchMutationResult`

### `remove()`

```ts
remove(obj: Record<string, any>, field: string): void
```

Stops watching `obj[field]`.

**Parameters:**

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `obj`     | `Record<string, any>` | -           |
| `field`   | `string`              | -           |

**Returns:** `void`

### `setMutationGuard()`

```ts
setMutationGuard(guard: FlxWatchMutationGuard | null): void
```

Installs or clears the global policy checked before editable mutations.

**Parameters:**

| Parameter | Type                            | Description |
| :-------- | :------------------------------ | :---------- |
| `guard`   | `FlxWatchMutationGuard \| null` | -           |

**Returns:** `void`

### `snapshot()`

```ts
snapshot(): WatchSnapshot[]
```

Returns current values for all watched fields.

**Returns:** `WatchSnapshot[]`

### `track()`

```ts
track<T>(definition: FlxWatchDefinition<T>): () => void
```

Tracks a getter-backed value. Editing is disabled unless an explicit parser, validator, and setter contract is supplied through `editor`. Returns an idempotent function that removes this tracked value.

**Parameters:**

| Parameter    | Type                    | Description |
| :----------- | :---------------------- | :---------- |
| `definition` | `FlxWatchDefinition<T>` | -           |

**Returns:** `() => void`

### `trackObject()`

```ts
trackObject<T extends object, K extends Extract<keyof T, string>>(name: string, obj: T, fields: readonly K[]): () => void
```

Tracks an explicit shallow field list from an object as read-only values. No prototype traversal or implicit property discovery is performed.

**Parameters:**

| Parameter | Type           | Description |
| :-------- | :------------- | :---------- |
| `name`    | `string`       | -           |
| `obj`     | `T`            | -           |
| `fields`  | `readonly K[]` | -           |

**Returns:** `() => void`
