---
title: FlxShaderFilter (Class)
description: API reference documentation for FlxShaderFilter in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderFilter

Renderer-neutral custom filter descriptor with typed runtime uniforms.

```ts
export declare class FlxShaderFilter<TSchema extends FlxShaderUniformSchema = FlxShaderUniformSchema>
```

## Constructors

```ts
constructor(options: FlxShaderFilterOptions<TSchema>)
```

Constructs a new instance of the `FlxShaderFilter` class

| Parameter | Type                              | Description |
| :-------- | :-------------------------------- | :---------- |
| `options` | `FlxShaderFilterOptions<TSchema>` | -           |

## Properties

| Property                  | Modifiers  | Type                               | Description                                                |
| :------------------------ | :--------- | :--------------------------------- | :--------------------------------------------------------- |
| **`compatibleRenderers`** | `readonly` | `readonly ('webgl' \| 'webgpu')[]` | Renderer backends for which source code was supplied.      |
| **`kind`**                | `readonly` | ``                                 | Discriminator used by renderer adapters.                   |
| **`padding`**             | `readonly` | `number`                           | Extra logical pixels rendered around the filtered object.  |
| **`resolution`**          | `readonly` | `number`                           | Filter render-target resolution multiplier.                |
| **`uniforms`**            | `readonly` | `FlxShaderUniforms<TSchema>`       | Runtime values shared logically by all camera projections. |
| **`webGL`**               | `readonly` | `Readonly<FlxShaderWebGLProgram>`  | Optional GLSL program declaration.                         |
| **`webGPU`**              | `readonly` | `Readonly<FlxShaderWebGPUProgram>` | Optional WGSL program declaration.                         |
