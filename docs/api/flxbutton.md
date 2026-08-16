---
title: FlxButton (Class)
description: API reference documentation for FlxButton in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">UI & Typography</span>
  <span class="api-badge public">@public</span>
</div>

# FlxButton

Deterministic Flixel button with optional toggle and native accessibility hooks.

```ts
export declare class FlxButton extends FlxSprite
```

## Constructors

```ts
constructor(x?: number, y?: number, label?: string | null, onClick?: FlxButtonCallback | null)
```

Constructs a new instance of the `FlxButton` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `x` | `number` | - |
| `y` | `number` | - |
| `label` | `string \| null` | - |
| `onClick` | `FlxButtonCallback \| null` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`accessibleLabel`** | - | `string \| null` | Native accessibility name. Defaults to current text; null omits the DOM control. |
| **`allowSwiping`** | - | `boolean` | When true, a press started elsewhere can activate the button if the pointer is released while hovering over it. |
| **`DISABLED`** | `static` `readonly` | `` | - |
| **`enabled`** | - | `boolean` | Whether pointer and accessibility activation are accepted. |
| **`focused`** | `readonly` | `boolean` | - |
| **`HIGHLIGHT`** | `static` `readonly` | `` | - |
| **`label`** | - | `FlxText \| null` | - |
| **`labelAlphas`** | `readonly` | `number[]` | Label alpha multipliers for normal, highlight, pressed, and disabled states. |
| **`labelOffset`** | `readonly` | `FlxPoint \| undefined` | Primary label offset used by legacy AS3 callers. |
| **`labelOffsets`** | `readonly` | `FlxPoint[]` | Label offsets for normal, highlight, pressed, and disabled states. |
| **`NORMAL`** | `static` `readonly` | `` | - |
| **`on`** | - | `boolean` | - |
| **`onDown`** | - | `FlxButtonCallback \| null` | - |
| **`onOut`** | - | `FlxButtonCallback \| null` | - |
| **`onOver`** | - | `FlxButtonCallback \| null` | - |
| **`onUp`** | - | `FlxButtonCallback \| null` | - |
| **`PRESSED`** | `static` `readonly` | `` | - |
| **`soundDown`** | - | `FlxButtonSound \| null` | - |
| **`soundOut`** | - | `FlxButtonSound \| null` | - |
| **`soundOver`** | - | `FlxButtonSound \| null` | - |
| **`soundUp`** | - | `FlxButtonSound \| null` | - |
| **`status`** | - | `number` | - |
| **`tabIndex`** | - | `number` | Native keyboard tab order used by the browser accessibility bridge. |
| **`text`** | - | `string` | Human-visible label text, independent from the accessibility override. |

## Methods

### `activate()`

```ts
activate(): boolean
```

Activate the button through the same callback/sound path as pointer input.

**Returns:** `boolean`

### `createRenderHandle()`

```ts
createRenderHandle(): FlxRenderHandle
```

**Returns:** `FlxRenderHandle`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `setSounds()`

```ts
setSounds(soundOver?: FlxButtonSound | null, soundOut?: FlxButtonSound | null, soundDown?: FlxButtonSound | null, soundUp?: FlxButtonSound | null): this
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `soundOver` | `FlxButtonSound \| null` | - |
| `soundOut` | `FlxButtonSound \| null` | - |
| `soundDown` | `FlxButtonSound \| null` | - |
| `soundUp` | `FlxButtonSound \| null` | - |

**Returns:** `this`

### `update()`

```ts
update(): void
```

**Returns:** `void`

