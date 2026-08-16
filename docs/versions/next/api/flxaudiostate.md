---
title: FlxAudioState (Interface)
description: API reference documentation for FlxAudioState in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAudioState

Serializable master audio preferences.

```ts
export interface FlxAudioState
```

## Properties

| Property     | Modifiers  | Type      | Description                    |
| :----------- | :--------- | :-------- | :----------------------------- |
| **`mute`**   | `readonly` | `boolean` | Whether master audio is muted. |
| **`volume`** | `readonly` | `number`  | Master gain from 0 through 1.  |
