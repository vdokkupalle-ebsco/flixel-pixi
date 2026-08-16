---
title: FlxDebuggerDiagnosticSnapshot (Interface)
description: API reference documentation for FlxDebuggerDiagnosticSnapshot in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDebuggerDiagnosticSnapshot

Versioned JSON-safe debugger export.

```ts
export interface FlxDebuggerDiagnosticSnapshot
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`capturedAt`** | `readonly` | `string` | - |
| **`environment`** | `readonly` | `{ readonly userAgent: string \| null; readonly viewportHeight: number \| null; readonly viewportWidth: number \| null; }` | - |
| **`logs`** | `readonly` | `readonly LogEntry[]` | - |
| **`performance`** | `readonly` | `FlxDiagnosticSnapshot` | - |
| **`schemaVersion`** | `readonly` | `1` | - |
| **`watches`** | `readonly` | `readonly WatchSnapshot[]` | - |

