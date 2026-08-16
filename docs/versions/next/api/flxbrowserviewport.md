---
title: FlxBrowserViewport (Class)
description: API reference documentation for FlxBrowserViewport in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBrowserViewport

Owns CSS-space canvas sizing while the renderer keeps a stable logical size. Pointer and accessibility projection use the resulting canvas bounds.

```ts
export declare class FlxBrowserViewport
```

## Constructors

```ts
constructor(host: HTMLElement, canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number, options?: FlxBrowserScaleMode | FlxBrowserScaleOptions)
```

Constructs a new instance of the `FlxBrowserViewport` class

| Parameter       | Type                                            | Description |
| :-------------- | :---------------------------------------------- | :---------- |
| `host`          | `HTMLElement`                                   | -           |
| `canvas`        | `HTMLCanvasElement`                             | -           |
| `logicalWidth`  | `number`                                        | -           |
| `logicalHeight` | `number`                                        | -           |
| `options`       | `FlxBrowserScaleMode \| FlxBrowserScaleOptions` | -           |

## Properties

| Property         | Modifiers  | Type                         | Description |
| :--------------- | :--------- | :--------------------------- | :---------- |
| **`fullscreen`** | `readonly` | `boolean`                    | -           |
| **`mode`**       | `readonly` | `FlxBrowserScaleMode`        | -           |
| **`snapshot`**   | `readonly` | `FlxBrowserViewportSnapshot` | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `exitFullscreen()`

```ts
exitFullscreen(): Promise<void>
```

Leave fullscreen when this viewport currently owns it.

**Returns:** `Promise<void>`

### `onChange()`

```ts
onChange(listener: (snapshot: FlxBrowserViewportSnapshot) => void): () => void
```

Subscribe to layout changes and immediately receive the current snapshot.

**Parameters:**

| Parameter  | Type                                             | Description |
| :--------- | :----------------------------------------------- | :---------- |
| `listener` | `(snapshot: FlxBrowserViewportSnapshot) => void` | -           |

**Returns:** `() => void`

### `refresh()`

```ts
refresh(): FlxBrowserViewportSnapshot
```

Recalculate placement immediately after an application-controlled layout change.

**Returns:** `FlxBrowserViewportSnapshot`

### `requestFullscreen()`

```ts
requestFullscreen(): Promise<void>
```

Present the host element fullscreen and refresh its canvas placement.

**Returns:** `Promise<void>`

### `setAlignment()`

```ts
setAlignment(alignX: number, alignY: number): FlxBrowserViewportSnapshot
```

Change canvas placement within the host without rebuilding game state.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `alignX`  | `number` | -           |
| `alignY`  | `number` | -           |

**Returns:** `FlxBrowserViewportSnapshot`

### `setMode()`

```ts
setMode(mode: FlxBrowserScaleMode): FlxBrowserViewportSnapshot
```

Change presentation policy without rebuilding Pixi or game state.

**Parameters:**

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `mode`    | `FlxBrowserScaleMode` | -           |

**Returns:** `FlxBrowserViewportSnapshot`

### `setSafePadding()`

```ts
setSafePadding(padding: FlxBrowserSafePadding): FlxBrowserViewportSnapshot
```

Update developer-defined logical padding inside the visible area.

**Parameters:**

| Parameter | Type                    | Description |
| :-------- | :---------------------- | :---------- |
| `padding` | `FlxBrowserSafePadding` | -           |

**Returns:** `FlxBrowserViewportSnapshot`

### `toggleFullscreen()`

```ts
toggleFullscreen(): Promise<void>
```

Toggle fullscreen presentation for this viewport's host.

**Returns:** `Promise<void>`
