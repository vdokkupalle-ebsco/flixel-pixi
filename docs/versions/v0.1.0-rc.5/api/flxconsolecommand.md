---
title: FlxConsoleCommand (Interface)
description: API reference documentation for FlxConsoleCommand in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxConsoleCommand

A command explicitly exposed to the debugger console.

```ts
export interface FlxConsoleCommand
```

## Properties

| Property          | Modifiers  | Type                                                                 | Description |
| :---------------- | :--------- | :------------------------------------------------------------------- | :---------- |
| **`aliases`**     | `readonly` | `readonly string[]`                                                  | -           |
| **`description`** | `readonly` | `string`                                                             | -           |
| **`execute`**     | `readonly` | `(context: FlxConsoleCommandContext) => unknown \| Promise<unknown>` | -           |
| **`name`**        | `readonly` | `string`                                                             | -           |
| **`usage`**       | `readonly` | `string`                                                             | -           |
