---
title: FlxDiagnosticsOptions (Interface)
description: API reference documentation for FlxDiagnosticsOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDiagnosticsOptions

Bounded diagnostics collector configuration.

```ts
export interface FlxDiagnosticsOptions
```

## Properties

| Property                   | Modifiers  | Type                   | Description                                                   |
| :------------------------- | :--------- | :--------------------- | :------------------------------------------------------------ |
| **`maxSamples`**           | `readonly` | `number`               | Maximum retained samples. Defaults to 180.                    |
| **`memorySampleInterval`** | `readonly` | `number`               | Read memory every N frames. Defaults to 30; zero disables it. |
| **`readMemoryBytes`**      | `readonly` | `() => number \| null` | Optional cross-browser memory provider.                       |
