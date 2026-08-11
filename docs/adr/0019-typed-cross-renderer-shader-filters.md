# ADR-0019: Typed cross-renderer shader filters

- Status: Accepted
- Date: 2026-08-11
- Accepted: 2026-08-11 (advanced-rendering checkpoint)

## Context

Custom effects need runtime parameters, but rebuilding a Pixi filter or shader
program every frame is wasteful. Exposing Pixi `UniformGroup`, `GlProgram`, or
`GpuProgram` objects would also violate the gameplay/renderer boundary and
would share mutable renderer state between camera projections.

WebGL uses GLSL while WebGPU uses WGSL. Pretending one source format can cover
both backends would hide an important compatibility constraint and make
fallback behavior unpredictable.

## Decision

1. `FlxShaderFilter` is an immutable descriptor containing optional, explicit
   WebGL and WebGPU programs. At least one backend program is required.
2. `FlxShaderUniforms` owns renderer-neutral typed values. The initial slice
   supports scalar float/integer values, float/integer vectors, and square float
   matrices. Values are validated and copied at the public boundary.
3. Each camera render handle creates its own Pixi filter, program binding, and
   uniform group. A descriptor revision synchronizes changed values into every
   projection without replacing filters or recompiling programs.
4. The Pixi resource group is named `flxShaderUniforms`. WGSL authors declare a
   matching group-one uniform binding; GLSL authors declare the same field names
   as ordinary uniforms.
5. Backend compatibility is declarative. If source is omitted for the active
   renderer, Pixi skips that filter and renders its input unchanged. Games can
   inspect `compatibleRenderers` before boot if an effect is mandatory.
6. Texture/sampler uniforms, displacement maps, custom geometry, and automatic
   source translation remain outside this slice.

## Consequences

- Games can animate uniforms on the fixed clock without allocating GPU programs
  or replacing a sprite's filter list each frame.
- Dual-backend effects require two authored programs and a shared uniform
  schema. This cost is explicit instead of becoming a runtime surprise.
- Uniform state is shared logically by all projections, while renderer objects
  remain camera-local and are destroyed with their owning handle.
- Shader compilation errors remain renderer diagnostics; the engine validates
  descriptor structure and values but does not attempt to parse GLSL or WGSL.
