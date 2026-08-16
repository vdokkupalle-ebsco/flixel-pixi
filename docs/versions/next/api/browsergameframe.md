---
title: BrowserGameFrame (Interface)
description: API reference documentation for BrowserGameFrame in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# BrowserGameFrame

Timing information for one completed browser render frame.

```ts
export interface BrowserGameFrame
```

## Properties

| Property              | Modifiers  | Type     | Description                                                     |
| :-------------------- | :--------- | :------- | :-------------------------------------------------------------- |
| **`elapsedMS`**       | `readonly` | `number` | Raw wall-clock interval since the previous rendered frame.      |
| **`frameCount`**      | `readonly` | `number` | Monotonic count of completed rendered frames.                   |
| **`simulationSteps`** | `readonly` | `number` | Number of fixed simulation updates executed before this render. |
