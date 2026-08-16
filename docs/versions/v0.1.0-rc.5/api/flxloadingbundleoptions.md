---
title: FlxLoadingBundleOptions (Interface)
description: API reference documentation for FlxLoadingBundleOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLoadingBundleOptions

Options for loading an asset bundle through a shared loading session.

```ts
export interface FlxLoadingBundleOptions extends Omit<FlxLoadingTaskOptions, 'stage'>
```

## Properties

| Property    | Modifiers | Type                   | Description |
| :---------- | :-------- | :--------------------- | :---------- |
| **`stage`** | -         | `'assets' \| 'custom'` | -           |
