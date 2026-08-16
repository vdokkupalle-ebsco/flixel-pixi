---
title: FlxAnimationFrameEvent (Interface)
description: API reference documentation for FlxAnimationFrameEvent in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Animation & Atlases</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAnimationFrameEvent

Payload dispatched whenever an animation materializes a new frame.

```ts
export interface FlxAnimationFrameEvent
```

## Properties

| Property            | Modifiers  | Type             | Description |
| :------------------ | :--------- | :--------------- | :---------- |
| **`animationName`** | `readonly` | `string \| null` | -           |
| **`frameIndex`**    | `readonly` | `number`         | -           |
| **`frameNumber`**   | `readonly` | `number`         | -           |
