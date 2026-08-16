---
title: FlxPreloader (Class)
description: API reference documentation for FlxPreloader in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPreloader

Accessible, customizable HTML loading view. Dismissed automatically when a ready snapshot is received.

```ts
export declare class FlxPreloader implements FlxPreloaderView
```

## Constructors

```ts
constructor(options?: FlxPreloaderOptions)
```

Constructs a new instance of the `FlxPreloader` class

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `options` | `FlxPreloaderOptions` | -           |

## Properties

| Property    | Modifiers  | Type             | Description |
| :---------- | :--------- | :--------------- | :---------- |
| **`state`** | `readonly` | `PreloaderState` | -           |

## Methods

### `complete()`

```ts
complete(): Promise<void>
```

Marks loading as complete and removes the preloader after its transition.

**Returns:** `Promise<void>`

### `destroy()`

```ts
destroy(): void
```

Removes the preloader from the DOM and releases its handlers.

**Returns:** `void`

### `onRetry()`

```ts
onRetry(handler: () => void): void
```

Legacy retry registration API.

**Parameters:**

| Parameter | Type         | Description |
| :-------- | :----------- | :---------- |
| `handler` | `() => void` | -           |

**Returns:** `void`

### `setProgress()`

```ts
setProgress(percent: number, statusText?: string): void
```

Legacy imperative progress API. Prefer `update(snapshot)` for new code.

**Parameters:**

| Parameter    | Type     | Description |
| :----------- | :------- | :---------- |
| `percent`    | `number` | -           |
| `statusText` | `string` | -           |

**Returns:** `void`

### `showError()`

```ts
showError(message: string): void
```

Legacy error API. Prefer an error snapshot for new code.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `message` | `string` | -           |

**Returns:** `void`

### `update()`

```ts
update(snapshot: FlxLoadingSnapshot): void
```

Render one snapshot from a shared loading session.

**Parameters:**

| Parameter  | Type                 | Description |
| :--------- | :------------------- | :---------- |
| `snapshot` | `FlxLoadingSnapshot` | -           |

**Returns:** `void`
