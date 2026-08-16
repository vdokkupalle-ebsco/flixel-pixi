---
title: BrowserGamePreloaderOptions (Interface)
description: API reference documentation for BrowserGamePreloaderOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGamePreloaderOptions

Configuration for the default or a custom bootstrap-preloader view.

```ts
export interface BrowserGamePreloaderOptions extends FlxPreloaderOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`createView`** | - | `FlxPreloaderViewFactory` | Replace the default DOM view while retaining loading orchestration. |
| **`retry`** | - | `boolean` | Keep a failed boot pending and expose a retry action. Defaults to true. |

