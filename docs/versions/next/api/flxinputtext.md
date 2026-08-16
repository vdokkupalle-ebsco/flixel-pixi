---
title: FlxInputText (Class)
description: API reference documentation for FlxInputText in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxInputText

Flixel text field backed by a native browser input for selection, IME, and mobile keyboard behavior. DOM changes become authoritative on fixed updates.

```ts
export declare class FlxInputText extends FlxText
```

## Constructors

```ts
constructor(x?: number, y?: number, width?: number, text?: string, options?: FlxInputTextOptions)
```

Constructs a new instance of the `FlxInputText` class

| Parameter | Type                  | Description |
| :-------- | :-------------------- | :---------- |
| `x`       | `number`              | -           |
| `y`       | `number`              | -           |
| `width`   | `number`              | -           |
| `text`    | `string`              | -           |
| `options` | `FlxInputTextOptions` | -           |

## Properties

| Property                 | Modifiers  | Type                                 | Description                                                       |
| :----------------------- | :--------- | :----------------------------------- | :---------------------------------------------------------------- |
| **`accessibleLabel`**    | -          | `string`                             | Accessible name announced for the native field.                   |
| **`backgroundColor`**    | -          | `number`                             | Native field background color.                                    |
| **`composing`**          | `readonly` | `boolean`                            | Whether a native IME composition is active at the fixed boundary. |
| **`editable`**           | -          | `boolean`                            | Whether text can change while the field remains focusable.        |
| **`enabled`**            | -          | `boolean`                            | Whether the native field accepts focus and editing.               |
| **`focused`**            | `readonly` | `boolean`                            | Focus state published at the fixed-update boundary.               |
| **`focusedBorderColor`** | -          | `number`                             | Native field border color while focused.                          |
| **`inputBorderColor`**   | -          | `number`                             | Native field border color while unfocused.                        |
| **`inputMode`**          | -          | `string`                             | Virtual-keyboard input mode hint.                                 |
| **`maxLength`**          | -          | `number`                             | Maximum UTF-16 length; zero means unlimited.                      |
| **`multiline`**          | `readonly` | `boolean`                            | Whether this field uses multiline textarea behavior.              |
| **`onSubmit`**           | -          | `FlxInputTextSubmitCallback \| null` | Called on a fixed update after Enter in a single-line field.      |
| **`onTextChange`**       | -          | `FlxInputTextChangeCallback \| null` | Called once per fixed update that consumes a changed DOM value.   |
| **`placeholder`**        | -          | `string`                             | Native input hint used when the value is empty.                   |
| **`selectionEnd`**       | `readonly` | `number`                             | Fixed-step UTF-16 selection end.                                  |
| **`selectionStart`**     | `readonly` | `number`                             | Fixed-step UTF-16 selection start.                                |
| **`tabIndex`**           | -          | `number`                             | Native keyboard tab order.                                        |
| **`text`**               | -          | `string`                             | Current authoritative text value.                                 |
| **`type`**               | -          | `FlxInputTextType`                   | Native single-line field type. Ignored by multiline fields.       |

## Methods

### `blur()`

```ts
blur(): void
```

Request native blur. The state becomes visible on the next fixed update.

**Returns:** `void`

### `destroy()`

```ts
destroy(): void
```

Release callbacks and render resources.

**Returns:** `void`

### `focus()`

```ts
focus(): void
```

Request native focus. The state becomes visible on the next fixed update.

**Returns:** `void`

### `select()`

```ts
select(start?: number, end?: number): void
```

Select a UTF-16 range and project it to the native field.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `start`   | `number` | -           |
| `end`     | `number` | -           |

**Returns:** `void`

### `update()`

```ts
update(): void
```

Consume queued native edits and callbacks, then advance normal text state.

**Returns:** `void`
