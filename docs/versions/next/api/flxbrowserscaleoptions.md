---
title: FlxBrowserScaleOptions (Interface)
description: API reference documentation for FlxBrowserScaleOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Browser DX & Viewport</span>
  <span class="api-badge public">@public</span>
</div>

# FlxBrowserScaleOptions

Configuration for the browser canvas presentation policy.

```ts
export interface FlxBrowserScaleOptions
```

## Properties

| Property                | Modifiers | Type                    | Description                                                                |
| :---------------------- | :-------- | :---------------------- | :------------------------------------------------------------------------- |
| **`alignX`**            | -         | `number`                | Horizontal placement inside the host, from 0 (left) to 1 (right).          |
| **`alignY`**            | -         | `number`                | Vertical placement inside the host, from 0 (top) to 1 (bottom).            |
| **`mode`**              | -         | `FlxBrowserScaleMode`   | How the logical canvas is fitted into its host. Defaults to `fit`.         |
| **`pixelated`**         | -         | `boolean`               | Force nearest-neighbor browser scaling. Defaults to true for integer mode. |
| **`safePadding`**       | -         | `FlxBrowserSafePadding` | Additional logical padding applied to the recommended HUD boundary.        |
| **`useSafeAreaInsets`** | -         | `boolean`               | Include CSS environment safe-area insets. Defaults to true.                |
