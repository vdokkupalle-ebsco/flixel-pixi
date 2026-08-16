---
title: FlxWatchDefinition (Interface)
description: API reference documentation for FlxWatchDefinition in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxWatchDefinition

Getter-backed tracked value definition.

```ts
export interface FlxWatchDefinition<T>
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`editor`** | `readonly` | `FlxWatchEditor<T>` | - |
| **`format`** | `readonly` | `(value: T) => string` | - |
| **`name`** | `readonly` | `string` | - |
| **`read`** | `readonly` | `() => T` | - |

