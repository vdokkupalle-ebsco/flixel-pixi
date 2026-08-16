---
title: FlxVirtualPad (Class)
description: API reference documentation for FlxVirtualPad in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVirtualPad

HUD-aligned collection of deterministic direction and action buttons.

```ts
export declare class FlxVirtualPad extends FlxGroup<FlxVirtualButton>
```

## Constructors

```ts
constructor(dpadMode?: FlxVirtualDPadMode, actionMode?: FlxVirtualActionMode, options?: FlxVirtualPadOptions)
```

Constructs a new instance of the `FlxVirtualPad` class

| Parameter    | Type                   | Description |
| :----------- | :--------------------- | :---------- |
| `dpadMode`   | `FlxVirtualDPadMode`   | -           |
| `actionMode` | `FlxVirtualActionMode` | -           |
| `options`    | `FlxVirtualPadOptions` | -           |

## Properties

| Property    | Modifiers  | Type                       | Description |
| :---------- | :--------- | :------------------------- | :---------- |
| **`A`**     | `readonly` | `FlxVirtualButton \| null` | -           |
| **`B`**     | `readonly` | `FlxVirtualButton \| null` | -           |
| **`down`**  | `readonly` | `FlxVirtualButton \| null` | -           |
| **`left`**  | `readonly` | `FlxVirtualButton \| null` | -           |
| **`right`** | `readonly` | `FlxVirtualButton \| null` | -           |
| **`up`**    | `readonly` | `FlxVirtualButton \| null` | -           |

## Methods

### `bindActions()`

```ts
bindActions(actions: FlxActions, map: FlxVirtualPadActionMap): this
```

Add this pad's sources to an existing keyboard/gamepad action map.

**Parameters:**

| Parameter | Type                     | Description |
| :-------- | :----------------------- | :---------- |
| `actions` | `FlxActions`             | -           |
| `map`     | `FlxVirtualPadActionMap` | -           |

**Returns:** `this`

### `bindAxes()`

```ts
bindAxes(actions: FlxActions, map: FlxVirtualPadAxisMap): this
```

Add horizontal/vertical scalar sources when both direction buttons exist.

**Parameters:**

| Parameter | Type                   | Description |
| :-------- | :--------------------- | :---------- |
| `actions` | `FlxActions`           | -           |
| `map`     | `FlxVirtualPadAxisMap` | -           |

**Returns:** `this`

### `getButton()`

```ts
getButton(id: 'up' | 'down' | 'left' | 'right' | 'A' | 'B'): FlxVirtualButton | null
```

**Parameters:**

| Parameter | Type                                                | Description |
| :-------- | :-------------------------------------------------- | :---------- |
| `id`      | `'up' \| 'down' \| 'left' \| 'right' \| 'A' \| 'B'` | -           |

**Returns:** `FlxVirtualButton | null`
