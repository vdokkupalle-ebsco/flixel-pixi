---
title: FlxLoadingSession (Class)
description: API reference documentation for FlxLoadingSession in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLoadingSession

Renderer-independent loading state for both browser boot and in-game screens. Progress is monotonic within one run and can be reset explicitly for retry.

```ts
export declare class FlxLoadingSession
```

## Constructors

```ts
constructor(parentSignal?: AbortSignal)
```

Constructs a new instance of the `FlxLoadingSession` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `parentSignal` | `AbortSignal` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`signal`** | `readonly` | `AbortSignal` | - |
| **`snapshot`** | `readonly` | `FlxLoadingSnapshot` | - |

## Methods

### `cancel()`

```ts
cancel(message?: string): void
```

Abort pending application-level work and publish cancellation.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | - |

**Returns:** `void`

### `complete()`

```ts
complete(message?: string): void
```

Mark the current run ready.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | - |

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `fail()`

```ts
fail(error: FlxLoadingError, retry?: () => void): void
```

Publish a retryable or terminal failure.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `error` | `FlxLoadingError` | - |
| `retry` | `() => void` | - |

**Returns:** `void`

### `loadBundle()`

```ts
loadBundle<T = Record<string, unknown>>(assets: FlxAssets, name: string | string[], options: FlxLoadingBundleOptions): Promise<T>
```

Load a Pixi asset bundle while publishing its progress.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `assets` | `FlxAssets` | - |
| `name` | `string \| string[]` | - |
| `options` | `FlxLoadingBundleOptions` | - |

**Returns:** `Promise<T>`

### `report()`

```ts
report(update: FlxLoadingUpdate): void
```

Publish a monotonic progress update for the current run.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `update` | `FlxLoadingUpdate` | - |

**Returns:** `void`

### `start()`

```ts
start(stage?: FlxLoadingStage, message?: string, progress?: number | null): void
```

Start a new run, including a retry after an error.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `stage` | `FlxLoadingStage` | - |
| `message` | `string` | - |
| `progress` | `number \| null` | - |

**Returns:** `void`

### `subscribe()`

```ts
subscribe(listener: (snapshot: FlxLoadingSnapshot) => void): () => void
```

Subscribe to state changes. The current snapshot is emitted immediately.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `listener` | `(snapshot: FlxLoadingSnapshot) => void` | - |

**Returns:** `() => void`

### `task()`

```ts
task<T>(options: FlxLoadingTaskOptions, action: (context: FlxLoadingTaskContext) => Promise<T> | T): Promise<T>
```

Run a custom operation mapped into a range of overall progress.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `FlxLoadingTaskOptions` | - |
| `action` | `(context: FlxLoadingTaskContext) => Promise<T> \| T` | - |

**Returns:** `Promise<T>`

