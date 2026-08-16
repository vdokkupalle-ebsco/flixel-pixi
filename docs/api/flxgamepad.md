---
title: FlxGamepad (Class)
description: API reference documentation for FlxGamepad in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxGamepad

One stable logical controller, retained across disconnect/reconnect.

```ts
export declare class FlxGamepad
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`axisCount`** | `readonly` | `number` | - |
| **`buttonCount`** | `readonly` | `number` | - |
| **`connected`** | - | `boolean` | - |
| **`deadZone`** | - | `number` | - |
| **`id`** | `readonly` | `string` | - |
| **`index`** | `readonly` | `number` | - |
| **`mapping`** | `readonly` | `string` | - |
| **`uid`** | `readonly` | `number` | - |

## Methods

### `axisPressed()`

```ts
axisPressed(axis: number, direction: -1 | 1, threshold?: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `axis` | `number` | - |
| `direction` | `-1 \| 1` | - |
| `threshold` | `number` | - |

**Returns:** `boolean`

### `getAxis()`

```ts
getAxis(axis: number, deadZone?: number): number
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `axis` | `number` | - |
| `deadZone` | `number` | - |

**Returns:** `number`

### `getButtonValue()`

```ts
getButtonValue(button: number): number
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `number`

### `justPressed()`

```ts
justPressed(button: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

### `justReleased()`

```ts
justReleased(button: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

### `pressed()`

```ts
pressed(button: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `button` | `number` | - |

**Returns:** `boolean`

