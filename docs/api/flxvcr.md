---
title: FlxVCR (Interface)
description: API reference documentation for FlxVCR in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVCR

VCR control interface for recording, playback, and step controls.

```ts
export interface FlxVCR
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`cancelKeys`** | - | `string[]` | - |
| **`onComplete`** | - | `(() => void) \| null` | - |
| **`recording`** | - | `boolean` | - |
| **`reloadState`** | - | `FlxState \| null` | - |
| **`replay`** | - | `FlxReplay \| null` | - |
| **`replaying`** | - | `boolean` | - |
| **`stepRequested`** | - | `boolean` | - |
| **`timeout`** | - | `number` | - |

