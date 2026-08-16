---
title: FlxGamepadFrameRecord (Interface)
description: API reference documentation for FlxGamepadFrameRecord in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGamepadFrameRecord

Serializable authoritative gamepad state for one replay frame.

```ts
export interface FlxGamepadFrameRecord
```

## Properties

| Property      | Modifiers  | Type                                  | Description |
| :------------ | :--------- | :------------------------------------ | :---------- |
| **`axes`**    | `readonly` | `number[]`                            | -           |
| **`buttons`** | `readonly` | `{ state: number; value: number; }[]` | -           |
| **`id`**      | `readonly` | `string`                              | -           |
| **`index`**   | `readonly` | `number`                              | -           |
| **`mapping`** | `readonly` | `string`                              | -           |
| **`uid`**     | `readonly` | `number`                              | -           |
