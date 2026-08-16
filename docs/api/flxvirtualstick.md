---
title: FlxVirtualStick (Class)
description: API reference documentation for FlxVirtualStick in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVirtualStick

Texture-free HUD analog stick derived from authoritative fixed-step pointer state.

```ts
export declare class FlxVirtualStick extends FlxSprite implements FlxVirtualStickState
```

## Constructors

```ts
constructor(id: string, x: number, y: number, options?: FlxVirtualStickOptions)
```

Constructs a new instance of the `FlxVirtualStick` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |
| `x` | `number` | - |
| `y` | `number` | - |
| `options` | `FlxVirtualStickOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`baseColor`** | - | `number` | - |
| **`deadZone`** | `readonly` | `number` | - |
| **`knobColor`** | - | `number` | - |
| **`knobRadius`** | `readonly` | `number` | - |
| **`outlineColor`** | - | `number` | - |
| **`pressed`** | `readonly` | `boolean` | - |
| **`pressedKnobColor`** | - | `number` | - |
| **`radius`** | `readonly` | `number` | - |
| **`rawX`** | `readonly` | `number` | Clamped pre-dead-zone horizontal displacement used by the renderer. |
| **`rawY`** | `readonly` | `number` | Clamped pre-dead-zone vertical displacement used by the renderer. |
| **`virtualInputId`** | `readonly` | `string` | - |
| **`xAxis`** | `readonly` | `number` | Dead-zone-adjusted horizontal value in `[-1, 1]`. |
| **`yAxis`** | `readonly` | `number` | Dead-zone-adjusted vertical value in `[-1, 1]`. |

## Methods

### `bindAxes()`

```ts
bindAxes(actions: FlxActions, map: FlxVirtualStickAxisMap): this
```

Add both available axes to an existing keyboard/gamepad action map.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `actions` | `FlxActions` | - |
| `map` | `FlxVirtualStickAxisMap` | - |

**Returns:** `this`

### `createRenderHandle()`

```ts
createRenderHandle(): FlxVirtualStickRenderHandle
```

**Returns:** `FlxVirtualStickRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `source()`

```ts
source(axis: 'x' | 'y'): FlxActionVirtualStickAxisSource
```

Create a serializable scalar action source for one axis.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `axis` | `'x' \| 'y'` | - |

**Returns:** `FlxActionVirtualStickAxisSource`

### `update()`

```ts
update(): void
```

**Returns:** `void`

