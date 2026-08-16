---
title: FixedStepAccumulatorOptions (Interface)
description: API reference documentation for FixedStepAccumulatorOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FixedStepAccumulatorOptions

Configuration for a deterministic fixed-step accumulator.

```ts
export interface FixedStepAccumulatorOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`maxCatchUpSteps`** | `readonly` | `number` | Maximum simulation updates executed for one display frame. |
| **`stepSeconds`** | `readonly` | `number` | Authoritative simulation-step duration, in seconds. |

