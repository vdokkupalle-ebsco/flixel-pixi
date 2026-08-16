---
title: FlxShaderUniforms (Class)
description: API reference documentation for FlxShaderUniforms in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Rendering & Filters</span>
  <span class="api-badge public">@public</span>
</div>

# FlxShaderUniforms

Mutable, type-checked values shared by every projection of a shader filter.

```ts
export declare class FlxShaderUniforms<TSchema extends FlxShaderUniformSchema = FlxShaderUniformSchema>
```

## Constructors

```ts
constructor(schema: TSchema)
```

Constructs a new instance of the `FlxShaderUniforms` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `schema` | `TSchema` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`revision`** | `readonly` | `number` | Monotonic change counter used to avoid redundant renderer updates. |

## Methods

### `get()`

```ts
get<K extends keyof TSchema>(name: K): FlxShaderUniformValue<TSchema[K]['type']>
```

Read one value without exposing the renderer-owned backing array.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `K` | - |

**Returns:** `FlxShaderUniformValue<TSchema[K]['type']>`

### `set()`

```ts
set<K extends keyof TSchema>(name: K, value: FlxShaderUniformValue<TSchema[K]['type']>): this
```

Update one value without rebuilding shader programs or filter chains.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `K` | - |
| `value` | `FlxShaderUniformValue<TSchema[K]['type']>` | - |

**Returns:** `this`

