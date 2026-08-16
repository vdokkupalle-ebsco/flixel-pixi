---
title: FlxFlickerTweenOptions (Interface)
description: API reference documentation for FlxFlickerTweenOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Tweens & Motion</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFlickerTweenOptions

Flicker-specific options layered onto normal tween options.

```ts
export interface FlxFlickerTweenOptions extends FlxTweenOptions
```

## Properties

| Property            | Modifiers | Type                                  | Description |
| :------------------ | :-------- | :------------------------------------ | :---------- |
| **`endVisibility`** | -         | `boolean`                             | -           |
| **`ratio`**         | -         | `number`                              | -           |
| **`tweenFunction`** | -         | `(tween: FlxFlickerTween) => boolean` | -           |
