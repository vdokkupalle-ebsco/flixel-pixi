---
title: FlxWatchEditor (Interface)
description: API reference documentation for FlxWatchEditor in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxWatchEditor

Explicit mutation contract for an editable tracked value.

```ts
export interface FlxWatchEditor<T>
```

## Properties

| Property       | Modifiers  | Type                                                         | Description |
| :------------- | :--------- | :----------------------------------------------------------- | :---------- |
| **`parse`**    | `readonly` | `(input: string, currentValue: T) => T`                      | -           |
| **`set`**      | `readonly` | `(value: T, currentValue: T) => void`                        | -           |
| **`validate`** | `readonly` | `(value: T, currentValue: T) => string \| null \| undefined` | -           |
