---
title: createBrowserGame (Function)
description: API reference documentation for createBrowserGame in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-function">Function</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# createBrowserGame

Boot Pixi + FlxGame + FlxCameraRenderer for a browser game. Asset preparation, retry, cancellation, and first-frame readiness share one loading model that can also drive later in-game loading screens.

```ts
export declare function createBrowserGame(options: CreateBrowserGameOptions): Promise<BrowserGameApplication>
```

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `CreateBrowserGameOptions` | - |

## Returns

`Promise<BrowserGameApplication>`

