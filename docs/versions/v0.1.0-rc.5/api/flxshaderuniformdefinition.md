---
title: FlxShaderUniformDefinition (Interface)
description: API reference documentation for FlxShaderUniformDefinition in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderUniformDefinition

Initial type and value for one shader uniform.

```ts
export interface FlxShaderUniformDefinition<T extends FlxShaderUniformType = FlxShaderUniformType>
```

## Properties

| Property    | Modifiers  | Type                       | Description                                                           |
| :---------- | :--------- | :------------------------- | :-------------------------------------------------------------------- |
| **`type`**  | `readonly` | `T`                        | Scalar, vector, or matrix storage type shared by GLSL and WGSL.       |
| **`value`** | `readonly` | `FlxShaderUniformValue<T>` | Initial value; vector and matrix lengths are checked at compile time. |
