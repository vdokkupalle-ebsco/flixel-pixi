---
title: FlxFpsDisplayOptions (Interface)
description: API reference documentation for FlxFpsDisplayOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFpsDisplayOptions

Options for [link](#).

```ts
export interface FlxFpsDisplayOptions
```

## Properties

| Property               | Modifiers | Type                      | Description                                                                  |
| :--------------------- | :-------- | :------------------------ | :--------------------------------------------------------------------------- |
| **`className`**        | -         | `string`                  | Optional CSS class names applied to the root element.                        |
| **`container`**        | -         | `HTMLElement`             | Overlay host. Defaults to document.body.                                     |
| **`mode`**             | -         | `'compact' \| 'detailed'` | Compact shows FPS only; detailed also shows frame pacing and update cadence. |
| **`placement`**        | -         | `'host' \| 'viewport'`    | Whether positioning is relative to the host or viewport.                     |
| **`position`**         | -         | `FlxFpsDisplayPosition`   | Screen corner. Defaults to top-right.                                        |
| **`targetFramerate`**  | -         | `number`                  | Optional expected FPS used to color the reading.                             |
| **`theme`**            | -         | `FlxFpsDisplayTheme`      | Visual theme overrides exposed as CSS custom properties.                     |
| **`updateIntervalMs`** | -         | `number`                  | Sampling window in milliseconds. Defaults to 500.                            |
