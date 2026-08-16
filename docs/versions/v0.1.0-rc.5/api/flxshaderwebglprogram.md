---
title: FlxShaderWebGLProgram (Interface)
description: API reference documentation for FlxShaderWebGLProgram in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderWebGLProgram

WebGL fragment program for a custom filter.

```ts
export interface FlxShaderWebGLProgram
```

## Properties

| Property       | Modifiers  | Type     | Description                                                            |
| :------------- | :--------- | :------- | :--------------------------------------------------------------------- |
| **`fragment`** | `readonly` | `string` | GLSL fragment source using Pixi's filter uniforms and `vTextureCoord`. |
