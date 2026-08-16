---
title: FlxDiagnosticSnapshot (Interface)
description: API reference documentation for FlxDiagnosticSnapshot in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDiagnosticSnapshot

Versioned, serializable performance snapshot.

```ts
export interface FlxDiagnosticSnapshot
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`capturedAt`** | `readonly` | `string` | - |
| **`samples`** | `readonly` | `readonly FlxDiagnosticSample[]` | - |
| **`schemaVersion`** | `readonly` | `1` | - |
| **`summary`** | `readonly` | `FlxDiagnosticSummary` | - |

