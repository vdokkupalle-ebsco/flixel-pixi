---
title: FlxObjectInspectorOptions (Interface)
description: API reference documentation for FlxObjectInspectorOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxObjectInspectorOptions

Configuration for the optional pointer object inspector.

```ts
export interface FlxObjectInspectorOptions
```

## Properties

| Property                | Modifiers  | Type                                               | Description                                                     |
| :---------------------- | :--------- | :------------------------------------------------- | :-------------------------------------------------------------- |
| **`logicalHeight`**     | `readonly` | `number`                                           | -                                                               |
| **`logicalWidth`**      | `readonly` | `number`                                           | -                                                               |
| **`modifier`**          | `readonly` | `FlxObjectInspectorModifier`                       | Defaults to Alt so normal game input remains untouched.         |
| **`onSelectionChange`** | `readonly` | `(selection: FlxCameraObjectPick \| null) => void` | -                                                               |
| **`watch`**             | `readonly` | `FlxWatch`                                         | Selected objects are exposed as read-only fields when supplied. |
