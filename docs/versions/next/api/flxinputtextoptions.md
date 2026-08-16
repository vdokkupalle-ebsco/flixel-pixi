---
title: FlxInputTextOptions (Interface)
description: API reference documentation for FlxInputTextOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxInputTextOptions

Optional construction settings for [link](#).

```ts
export interface FlxInputTextOptions
```

## Properties

| Property              | Modifiers  | Type               | Description                                                         |
| :-------------------- | :--------- | :----------------- | :------------------------------------------------------------------ |
| **`accessibleLabel`** | `readonly` | `string`           | Accessible name announced by assistive technology.                  |
| **`height`**          | `readonly` | `number`           | Authored logical field height.                                      |
| **`inputMode`**       | `readonly` | `string`           | Mobile virtual-keyboard hint such as `text`, `numeric`, or `email`. |
| **`maxLength`**       | `readonly` | `number`           | Maximum UTF-16 length; zero means unlimited.                        |
| **`multiline`**       | `readonly` | `boolean`          | Use a native textarea and preserve line breaks.                     |
| **`placeholder`**     | `readonly` | `string`           | Hint displayed by the native field while empty.                     |
| **`type`**            | `readonly` | `FlxInputTextType` | Native semantic type for a single-line field.                       |
