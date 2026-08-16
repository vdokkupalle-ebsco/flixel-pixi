---
title: FlxDiagnosticSummary (Interface)
description: API reference documentation for FlxDiagnosticSummary in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDiagnosticSummary

Aggregate metrics included with diagnostic exports.

```ts
export interface FlxDiagnosticSummary
```

## Properties

| Property              | Modifiers  | Type             | Description |
| :-------------------- | :--------- | :--------------- | :---------- |
| **`averageFps`**      | `readonly` | `number`         | -           |
| **`maxUpdateMs`**     | `readonly` | `number`         | -           |
| **`p95UpdateMs`**     | `readonly` | `number`         | -           |
| **`peakMemoryBytes`** | `readonly` | `number \| null` | -           |
| **`sampleCount`**     | `readonly` | `number`         | -           |
