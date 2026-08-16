---
title: FlxBrowserViewportSnapshot (Interface)
description: API reference documentation for FlxBrowserViewportSnapshot in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBrowserViewportSnapshot

Resolved CSS-space placement of a logical game canvas.

```ts
export interface FlxBrowserViewportSnapshot
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`devicePixelRatio`** | `readonly` | `number` | Current browser device-pixel ratio. |
| **`displayHeight`** | `readonly` | `number` | - |
| **`displayWidth`** | `readonly` | `number` | - |
| **`fullscreen`** | `readonly` | `boolean` | Whether this viewport's host owns browser fullscreen. |
| **`hostHeight`** | `readonly` | `number` | - |
| **`hostWidth`** | `readonly` | `number` | - |
| **`left`** | `readonly` | `number` | - |
| **`logicalRect`** | `readonly` | `FlxBrowserViewportRect` | Entire fixed logical game area. |
| **`mode`** | `readonly` | `FlxBrowserScaleMode` | - |
| **`safeAreaInsets`** | `readonly` | `FlxBrowserViewportInsets` | Effective CSS-pixel device insets overlapping this host. |
| **`safePadding`** | `readonly` | `FlxBrowserViewportInsets` | Configured logical HUD padding. |
| **`safeRect`** | `readonly` | `FlxBrowserViewportRect` | Recommended HUD area after crop, device insets, and configured padding. |
| **`scale`** | `readonly` | `number` | - |
| **`top`** | `readonly` | `number` | - |
| **`visibleRect`** | `readonly` | `FlxBrowserViewportRect` | Uncropped portion of the logical game currently visible in the host. |

