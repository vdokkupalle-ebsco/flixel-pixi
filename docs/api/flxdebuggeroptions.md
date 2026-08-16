---
title: FlxDebuggerOptions (Interface)
description: API reference documentation for FlxDebuggerOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDebuggerOptions

```ts
export interface FlxDebuggerOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`console`** | - | `FlxConsole` | Headless command registry to expose in the Console panel. |
| **`container`** | - | `HTMLElement` | Element to mount the overlay inside. Defaults to document.body. |
| **`diagnostics`** | - | `FlxDiagnostics` | Bounded metrics collector used by the Perf panel and exports. |
| **`initiallyVisible`** | - | `boolean` | Whether the debugger starts expanded. Defaults to true. |
| **`showLauncherWhenHidden`** | - | `boolean` | Show an accessible launcher while minimized. Defaults to true. |
| **`toggleKey`** | - | `string \| false` | KeyboardEvent.code used to toggle the debugger. Defaults to Backquote. |

