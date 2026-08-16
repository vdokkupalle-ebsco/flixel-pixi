---
title: FlxShaderUniformValue (TypeAlias)
description: API reference documentation for FlxShaderUniformValue in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderUniformValue

Type-safe JavaScript value for a shader uniform type.

```ts
export type FlxShaderUniformValue<T extends FlxShaderUniformType> = T extends 'f32' | 'i32' ? number : T extends 'vec2<f32>' | 'vec2<i32>' ? readonly [number, number] : T extends 'vec3<f32>' | 'vec3<i32>' ? readonly [number, number, number] : T extends 'vec4<f32>' | 'vec4<i32>' | 'mat2x2<f32>' ? readonly [number, number, number, number] : T extends 'mat3x3<f32>' ? readonly [ number, number, number, number, number, number, number, number, number ] : readonly [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ]
```

