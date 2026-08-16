---
title: FlxState (Class)
description: API reference documentation for FlxState in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxState

Base game state; initialize state-owned objects in `create`.

```ts
export declare class FlxState extends FlxGroup
```

## Properties

| Property               | Modifiers  | Type                     | Description                                       |
| :--------------------- | :--------- | :----------------------- | :------------------------------------------------ |
| **`destroySubStates`** | -          | `boolean`                | -                                                 |
| **`persistentDraw`**   | -          | `boolean`                | -                                                 |
| **`persistentUpdate`** | -          | `boolean`                | -                                                 |
| **`subState`**         | -          | `FlxSubState \| null`    | -                                                 |
| **`subStateClosed`**   | `readonly` | `FlxSignal<FlxSubState>` | Dispatched after the current substate has closed. |
| **`subStateOpened`**   | `readonly` | `FlxSignal<FlxSubState>` | Dispatched after a requested substate has opened. |

## Methods

### `closeSubState()`

```ts
closeSubState(): void
```

**Returns:** `void`

### `create()`

```ts
create(): void
```

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `draw()`

```ts
draw(): void
```

**Returns:** `void`

### `openSubState()`

```ts
openSubState(subState: FlxSubState): void
```

**Parameters:**

| Parameter  | Type          | Description |
| :--------- | :------------ | :---------- |
| `subState` | `FlxSubState` | -           |

**Returns:** `void`

### `resetSubState()`

```ts
resetSubState(): void
```

Applies a deferred substate request. Normally called by the game loop.

**Returns:** `void`
