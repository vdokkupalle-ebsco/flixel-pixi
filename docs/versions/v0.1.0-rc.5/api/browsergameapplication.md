---
title: BrowserGameApplication (Interface)
description: API reference documentation for BrowserGameApplication in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGameApplication

Running browser game application handle returned by [link](#).

```ts
export interface BrowserGameApplication
```

## Properties

| Property               | Modifiers  | Type                                  | Description                                                              |
| :--------------------- | :--------- | :------------------------------------ | :----------------------------------------------------------------------- |
| **`app`**              | `readonly` | `Application`                         | -                                                                        |
| **`assets`**           | `readonly` | `FlxAssets`                           | Asset service installed into the running game's context.                 |
| **`autoPause`**        | `readonly` | `boolean`                             | Whether focus loss pauses fixed simulation updates.                      |
| **`focused`**          | `readonly` | `boolean`                             | Whether the document is visible and its window currently has focus.      |
| **`frameCount`**       | `readonly` | `number`                              | Number of completed browser render frames.                               |
| **`game`**             | `readonly` | `FlxGame`                             | -                                                                        |
| **`loading`**          | `readonly` | `FlxLoadingSession`                   | Reusable loading model for optional in-game Pixi/Flixel loading screens. |
| **`renderer`**         | `readonly` | `FlxCameraRenderer`                   | -                                                                        |
| **`rendererBackend`**  | `readonly` | `BrowserGameRendererBackend`          | Concrete Pixi renderer backend selected after any startup fallback.      |
| **`rendererFallback`** | `readonly` | `BrowserGameRendererFallback \| null` | Automatic renderer recovery details, or null when no fallback occurred.  |
| **`renderFramerate`**  | `readonly` | `number \| undefined`                 | Visual frame-rate cap, or undefined when following the display.          |
| **`updateFramerate`**  | `readonly` | `number`                              | Fixed simulation rate in updates per second.                             |
| **`viewport`**         | `readonly` | `FlxBrowserViewport`                  | Browser canvas sizing controller.                                        |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `onFrame()`

```ts
onFrame(callback: (frame: BrowserGameFrame) => void): () => void
```

Subscribe to completed browser render frames. Returns an unsubscribe callback.

**Parameters:**

| Parameter  | Type                                | Description |
| :--------- | :---------------------------------- | :---------- |
| `callback` | `(frame: BrowserGameFrame) => void` | -           |

**Returns:** `() => void`

### `syncRenderer()`

```ts
syncRenderer(): void
```

Re-sync all state members into the camera renderer (call after switchState or manual mutations).

**Returns:** `void`
