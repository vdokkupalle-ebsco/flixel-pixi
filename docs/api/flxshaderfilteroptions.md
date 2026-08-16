---
title: FlxShaderFilterOptions (Interface)
description: API reference documentation for FlxShaderFilterOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderFilterOptions

Options for [link](#).

```ts
export interface FlxShaderFilterOptions<TSchema extends FlxShaderUniformSchema = FlxShaderUniformSchema>
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`padding`** | `readonly` | `number` | Extra logical pixels rendered around the object. Defaults to 0. |
| **`resolution`** | `readonly` | `number` | Filter render-target resolution multiplier. Defaults to 1. |
| **`uniforms`** | `readonly` | `TSchema` | Typed uniforms exposed to both renderer programs. |
| **`webGL`** | `readonly` | `FlxShaderWebGLProgram` | WebGL program. Omit only when the effect intentionally targets WebGPU. |
| **`webGPU`** | `readonly` | `FlxShaderWebGPUProgram` | WebGPU program. Omit only when the effect intentionally targets WebGL. |

