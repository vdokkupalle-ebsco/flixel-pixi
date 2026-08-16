---
title: FlxShaderWebGPUProgram (Interface)
description: API reference documentation for FlxShaderWebGPUProgram in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderWebGPUProgram

Combined WebGPU program for a custom filter.

```ts
export interface FlxShaderWebGPUProgram
```

## Properties

| Property                 | Modifiers  | Type     | Description                                                   |
| :----------------------- | :--------- | :------- | :------------------------------------------------------------ |
| **`fragmentEntryPoint`** | `readonly` | `string` | Fragment entry point. Defaults to `mainFragment`.             |
| **`source`**             | `readonly` | `string` | WGSL source containing both vertex and fragment entry points. |
| **`vertexEntryPoint`**   | `readonly` | `string` | Vertex entry point. Defaults to `mainVertex`.                 |
