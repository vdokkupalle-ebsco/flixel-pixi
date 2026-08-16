---
title: FlxLoadingError (Class)
description: API reference documentation for FlxLoadingError in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLoadingError

A loading failure enriched with the stage that failed.

```ts
export declare class FlxLoadingError extends Error
```

## Constructors

```ts
constructor(stage: FlxLoadingStage, message: string, retryable?: boolean, options?: { cause?: unknown; })
```

Constructs a new instance of the `FlxLoadingError` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `stage` | `FlxLoadingStage` | - |
| `message` | `string` | - |
| `retryable` | `boolean` | - |
| `options` | `{ cause?: unknown; }` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`retryable`** | `readonly` | `boolean` | - |
| **`stage`** | `readonly` | `FlxLoadingStage` | - |

