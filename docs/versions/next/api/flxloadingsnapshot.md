---
title: FlxLoadingSnapshot (Interface)
description: API reference documentation for FlxLoadingSnapshot in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLoadingSnapshot

Immutable loading state delivered to DOM or Pixi/Flixel loading views.

```ts
export interface FlxLoadingSnapshot
```

## Properties

| Property       | Modifiers  | Type              | Description                                                       |
| :------------- | :--------- | :---------------- | :---------------------------------------------------------------- |
| **`error`**    | `readonly` | `FlxLoadingError` | -                                                                 |
| **`message`**  | `readonly` | `string`          | -                                                                 |
| **`progress`** | `readonly` | `number \| null`  | Null means that the current operation has no measurable progress. |
| **`retry`**    | `readonly` | `() => void`      | -                                                                 |
| **`stage`**    | `readonly` | `FlxLoadingStage` | -                                                                 |
| **`state`**    | `readonly` | `FlxLoadingState` | -                                                                 |
