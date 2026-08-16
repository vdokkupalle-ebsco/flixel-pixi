---
title: BrowserGameRendererOptions (Interface)
description: API reference documentation for BrowserGameRendererOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGameRendererOptions

Renderer selection and recovery policy for browser startup.

```ts
export interface BrowserGameRendererOptions
```

## Properties

| Property              | Modifiers | Type                         | Description                                                               |
| :-------------------- | :-------- | :--------------------------- | :------------------------------------------------------------------------ |
| **`fallbackToWebGL`** | -         | `boolean`                    | Retry WebGL when preferred WebGPU initialization fails. Defaults to true. |
| **`preference`**      | -         | `BrowserGameRendererBackend` | Preferred backend. Defaults to the production-safe `webgl`.               |
