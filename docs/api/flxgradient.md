---
title: FlxGradient (Class)
description: API reference documentation for FlxGradient in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Game Objects & Sprites</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGradient

Immutable renderer-neutral local gradient descriptor.

```ts
export declare class FlxGradient
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`center`** | `readonly` | `Readonly<PointLike>` | Radial inner-circle center. |
| **`end`** | `readonly` | `Readonly<PointLike>` | Linear end point. |
| **`innerRadius`** | `readonly` | `number` | Radial inner radius. |
| **`outerCenter`** | `readonly` | `Readonly<PointLike>` | Radial outer-circle center. |
| **`outerRadius`** | `readonly` | `number` | Radial outer radius. |
| **`start`** | `readonly` | `Readonly<PointLike>` | Linear start point. |
| **`stops`** | `readonly` | `readonly Readonly<FlxGradientStop>[]` | Ordered immutable RGBA stops. |
| **`type`** | `readonly` | `'linear' \| 'radial'` | Gradient family used by camera adapters. |

## Methods

### `static` `linear()`

```ts
static linear(stops: readonly FlxGradientStop[], options?: FlxLinearGradientOptions): FlxGradient
```

Create an immutable local linear gradient.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `stops` | `readonly FlxGradientStop[]` | - |
| `options` | `FlxLinearGradientOptions` | - |

**Returns:** `FlxGradient`

### `static` `radial()`

```ts
static radial(stops: readonly FlxGradientStop[], options?: FlxRadialGradientOptions): FlxGradient
```

Create an immutable local radial gradient.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `stops` | `readonly FlxGradientStop[]` | - |
| `options` | `FlxRadialGradientOptions` | - |

**Returns:** `FlxGradient`

