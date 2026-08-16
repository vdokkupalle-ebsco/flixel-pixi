---
title: FlxVirtualButton (Class)
description: API reference documentation for FlxVirtualButton in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVirtualButton

Deterministic touch/pointer button that can be bound through [link](#).

```ts
export declare class FlxVirtualButton extends FlxButton implements FlxVirtualButtonState
```

## Constructors

```ts
constructor(id: string, x: number, y: number, label: string, options?: FlxVirtualButtonOptions)
```

Constructs a new instance of the `FlxVirtualButton` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |
| `x` | `number` | - |
| `y` | `number` | - |
| `label` | `string` | - |
| `options` | `FlxVirtualButtonOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`disabledColor`** | - | `number` | - |
| **`highlightColor`** | - | `number` | - |
| **`justPressed`** | `readonly` | `boolean` | - |
| **`justReleased`** | `readonly` | `boolean` | - |
| **`normalColor`** | - | `number` | - |
| **`pressed`** | `readonly` | `boolean` | - |
| **`pressedColor`** | - | `number` | - |
| **`source`** | `readonly` | `FlxActionVirtualButtonSource` | Serializable action source for this control. |
| **`virtualInputId`** | `readonly` | `string` | - |

## Methods

### `createRenderHandle()`

```ts
createRenderHandle(): FlxVirtualButtonRenderHandle
```

**Returns:** `FlxVirtualButtonRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `update()`

```ts
update(): void
```

**Returns:** `void`

