---
title: DebugEvents (Interface)
description: API reference documentation for DebugEvents in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# DebugEvents

Payload shapes for each debug event type.

```ts
export interface DebugEvents
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`"pause-change"`** | - | `{ paused: boolean; }` | Engine paused/unpaused. |
| **`"step-complete"`** | - | `{ frame: number; updateMs: number; }` | Emitted after every simulation step. |
| **`log`** | - | `{ color: number; message: string; timestamp: number; }` | A log message was added. |
| **`watch`** | - | `{ entries: readonly WatchSnapshot[]; }` | Watch snapshot was taken. |

