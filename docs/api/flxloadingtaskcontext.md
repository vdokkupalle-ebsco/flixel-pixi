---
title: FlxLoadingTaskContext (Interface)
description: API reference documentation for FlxLoadingTaskContext in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLoadingTaskContext

Context provided to a custom loading task.

```ts
export interface FlxLoadingTaskContext
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`signal`** | `readonly` | `AbortSignal` | - |

## Methods

### `report()`

```ts
report(progress: number, message?: string): void
```

Report task-local progress in the range 0–1.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `progress` | `number` | - |
| `message` | `string` | - |

**Returns:** `void`

