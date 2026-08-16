---
title: FrameRecordData (Interface)
description: API reference documentation for FrameRecordData in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FrameRecordData

Raw JSON representation of a FrameRecord.

```ts
export interface FrameRecordData
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`checksum`** | - | `string \| null` | - |
| **`frame`** | - | `number` | - |
| **`gamepads`** | - | `FlxGamepadFrameRecord[]` | - |
| **`keys`** | - | `CodePair[]` | - |
| **`mouse`** | - | `{ x: number; y: number; button: number; wheel: number; } \| null` | - |
| **`touches`** | - | `FlxTouchFrameRecord[]` | - |

