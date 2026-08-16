---
title: FlxAudioControlsOptions (Interface)
description: API reference documentation for FlxAudioControlsOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Audio System</span>
  <span class="api-badge public">@public</span>
</div>

# FlxAudioControlsOptions

Options for [link](#).

```ts
export interface FlxAudioControlsOptions
```

## Properties

| Property        | Modifiers | Type                       | Description                                                     |
| :-------------- | :-------- | :------------------------- | :-------------------------------------------------------------- |
| **`ariaLabel`** | -         | `string`                   | Accessible label for the control group.                         |
| **`className`** | -         | `string`                   | Optional CSS class names applied to the root.                   |
| **`container`** | -         | `HTMLElement`              | Overlay host. Defaults to document.body.                        |
| **`persist`**   | -         | `boolean \| string`        | Persist preferences in localStorage. `true` uses a default key. |
| **`placement`** | -         | `'host' \| 'viewport'`     | Whether positioning is relative to the host or viewport.        |
| **`position`**  | -         | `FlxAudioControlsPosition` | Screen corner. Defaults to bottom-right.                        |
