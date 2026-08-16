---
title: FlxInputManager (Class)
description: API reference documentation for FlxInputManager in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxInputManager

Owns DOM listeners and publishes their events only on simulation steps.

```ts
export declare class FlxInputManager implements FlxInputService
```

## Constructors

```ts
constructor(context: FlxContext, options?: FlxInputManagerOptions)
```

Constructs a new instance of the `FlxInputManager` class

| Parameter | Type                     | Description |
| :-------- | :----------------------- | :---------- |
| `context` | `FlxContext`             | -           |
| `options` | `FlxInputManagerOptions` | -           |

## Properties

| Property       | Modifiers  | Type                | Description |
| :------------- | :--------- | :------------------ | :---------- |
| **`gamepads`** | `readonly` | `FlxGamepadManager` | -           |
| **`keys`**     | `readonly` | `Keyboard`          | -           |
| **`mouse`**    | `readonly` | `Mouse`             | -           |
| **`touches`**  | `readonly` | `FlxTouchManager`   | -           |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `resetInput()`

```ts
resetInput(): void
```

**Returns:** `void`

### `updateInput()`

```ts
updateInput(): void
```

**Returns:** `void`

### `updateVirtualInput()`

```ts
updateVirtualInput(): void
```

Advance registered virtual controls after live or replayed input is ready.

**Returns:** `void`
