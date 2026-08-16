---
title: FlxPreloaderOptions (Interface)
description: API reference documentation for FlxPreloaderOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPreloaderOptions

Options for the default DOM preloader.

```ts
export interface FlxPreloaderOptions
```

## Properties

| Property               | Modifiers | Type                           | Description                                                                  |
| :--------------------- | :-------- | :----------------------------- | :--------------------------------------------------------------------------- |
| **`className`**        | -         | `string`                       | Optional CSS class names applied to the root element.                        |
| **`container`**        | -         | `HTMLElement`                  | Element to mount the preloader inside. Defaults to document.body.            |
| **`footer`**           | -         | `() => HTMLElement`            | Optional content rendered below the status and actions.                      |
| **`header`**           | -         | `() => HTMLElement`            | Optional content rendered before the title. Keep boot branding inline/local. |
| **`minimumVisibleMs`** | -         | `number`                       | Minimum time to retain an already-visible preloader. Defaults to 0.          |
| **`placement`**        | -         | `'host' \| 'viewport'`         | Whether the preloader covers its host or the viewport.                       |
| **`progress`**         | -         | `'bar' \| 'spinner' \| 'none'` | Progress presentation. Defaults to a bar.                                    |
| **`retryLabel`**       | -         | `string`                       | Accessible retry button label. Defaults to 'Retry'.                          |
| **`showDelayMs`**      | -         | `number`                       | Delay before mounting, preventing flashes on fast boots. Defaults to 0.      |
| **`subtitle`**         | -         | `string`                       | Optional supporting text shown below the title.                              |
| **`theme`**            | -         | `FlxPreloaderTheme`            | Visual theme overrides exposed as CSS custom properties.                     |
| **`title`**            | -         | `string`                       | Title shown in the loading screen. Defaults to 'Loading…'.                   |
| **`transitionMs`**     | -         | `number`                       | Fade duration after completion. Defaults to 400 ms.                          |
