---
title: FlxFpsMetrics (Interface)
description: API reference documentation for FlxFpsMetrics in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFpsMetrics

Metrics from the most recently completed FPS sampling window.

```ts
export interface FlxFpsMetrics
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`averageFrameMS`** | `readonly` | `number` | Mean wall-clock interval between rendered frames. |
| **`catchUpFrames`** | `readonly` | `number` | Renders preceded by two or more fixed updates. |
| **`fps`** | `readonly` | `number` | Mean completed render frames per second. |
| **`jankFrames`** | `readonly` | `number` | Frames slower than 1.5 times the target frame interval. |
| **`maxFrameMS`** | `readonly` | `number` | Slowest frame interval in the sampling window. |
| **`p95FrameMS`** | `readonly` | `number` | 95th percentile frame interval in the sampling window. |
| **`updatesPerSecond`** | `readonly` | `number` | Fixed simulation updates completed per second. |
| **`zeroStepFrames`** | `readonly` | `number` | Renders preceded by no fixed update. |

