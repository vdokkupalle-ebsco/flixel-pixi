---
title: FlxSubState (Class)
description: API reference documentation for FlxSubState in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSubState

A state that can be layered over another state, including another substate.

```ts
export declare class FlxSubState extends FlxState
```

## Properties

| Property            | Modifiers | Type                          | Description |
| :------------------ | :-------- | :---------------------------- | :---------- |
| **`closeCallback`** | -         | `FlxSubStateCallback \| null` | -           |
| **`openCallback`**  | -         | `FlxSubStateCallback \| null` | -           |

## Methods

### `close()`

```ts
close(): void
```

Closes this substate through its owning state at the next safe boundary.

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`
