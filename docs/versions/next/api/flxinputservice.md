---
title: FlxInputService (Interface)
description: API reference documentation for FlxInputService in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxInputService

Input service consumed by the fixed-step game loop.

```ts
export interface FlxInputService
```

## Properties

| Property       | Modifiers  | Type                | Description |
| :------------- | :--------- | :------------------ | :---------- |
| **`gamepads`** | `readonly` | `FlxGamepadManager` | -           |
| **`keys`**     | `readonly` | `Keyboard`          | -           |
| **`mouse`**    | `readonly` | `Mouse`             | -           |
| **`touches`**  | `readonly` | `FlxTouchManager`   | -           |

## Methods

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
