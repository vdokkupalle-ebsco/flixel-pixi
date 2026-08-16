---
title: FixedStepAdvanceResult (Interface)
description: API reference documentation for FixedStepAdvanceResult in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FixedStepAdvanceResult

Result of advancing a [link](#).

```ts
export interface FixedStepAdvanceResult
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`alpha`** | `readonly` | `number` | Interpolation fraction between the last and next simulation states. |
| **`discardedSeconds`** | `readonly` | `number` | Time discarded by the catch-up cap, in seconds. |
| **`steps`** | `readonly` | `number` | Number of authoritative simulation steps executed. |

