---
title: BrowserGamePreloadContext (Interface)
description: API reference documentation for BrowserGamePreloadContext in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGamePreloadContext

Loading helpers supplied to a game's custom startup preparation.

```ts
export interface BrowserGamePreloadContext
```

## Properties

| Property     | Modifiers  | Type          | Description |
| :----------- | :--------- | :------------ | :---------- |
| **`assets`** | `readonly` | `FlxAssets`   | -           |
| **`signal`** | `readonly` | `AbortSignal` | -           |

## Methods

### `loadBundle()`

```ts
loadBundle<T = Record<string, unknown>>(name: string | string[], message?: string): Promise<T>
```

Load an additional bundle and map its progress into the boot asset stage.

**Parameters:**

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `name`    | `string \| string[]` | -           |
| `message` | `string`             | -           |

**Returns:** `Promise<T>`

### `report()`

```ts
report(progress: number | null, message?: string): void
```

Report preparation-local progress, or null for an indeterminate operation.

**Parameters:**

| Parameter  | Type             | Description |
| :--------- | :--------------- | :---------- |
| `progress` | `number \| null` | -           |
| `message`  | `string`         | -           |

**Returns:** `void`
