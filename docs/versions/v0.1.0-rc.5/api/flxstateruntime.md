---
title: FlxStateRuntime (Interface)
description: API reference documentation for FlxStateRuntime in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxStateRuntime

Runtime bridge installed by a `FlxGame` into its context.

```ts
export interface FlxStateRuntime
```

## Properties

| Property    | Modifiers  | Type               | Description |
| :---------- | :--------- | :----------------- | :---------- |
| **`state`** | `readonly` | `FlxState \| null` | -           |

## Methods

### `requestState()`

```ts
requestState(state: FlxState): void
```

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `state`   | `FlxState` | -           |

**Returns:** `void`

### `resetState()`

```ts
resetState(): void
```

**Returns:** `void`
