---
title: BrowserGameRendererFallback (Interface)
description: API reference documentation for BrowserGameRendererFallback in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGameRendererFallback

Details of an automatic renderer recovery completed during startup.

```ts
export interface BrowserGameRendererFallback
```

## Properties

| Property     | Modifiers  | Type       | Description |
| :----------- | :--------- | :--------- | :---------- |
| **`from`**   | `readonly` | `'webgpu'` | -           |
| **`reason`** | `readonly` | `string`   | -           |
| **`to`**     | `readonly` | `'webgl'`  | -           |
