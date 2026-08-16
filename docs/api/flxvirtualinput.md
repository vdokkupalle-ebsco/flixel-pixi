---
title: FlxVirtualInput (Class)
description: API reference documentation for FlxVirtualInput in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxVirtualInput

Registry used by [link](#) to resolve serializable virtual sources.

```ts
export declare class FlxVirtualInput
```

## Methods

### `clear()`

```ts
clear(): void
```

**Returns:** `void`

### `getButton()`

```ts
getButton(id: string): FlxVirtualButtonState | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `FlxVirtualButtonState | null`

### `getStick()`

```ts
getStick(id: string): FlxVirtualStickState | null
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |

**Returns:** `FlxVirtualStickState | null`

### `registerButton()`

```ts
registerButton(id: string, state: FlxVirtualButtonState): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |
| `state` | `FlxVirtualButtonState` | - |

**Returns:** `void`

### `registerStick()`

```ts
registerStick(id: string, state: FlxVirtualStickState): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |
| `state` | `FlxVirtualStickState` | - |

**Returns:** `void`

### `unregisterButton()`

```ts
unregisterButton(id: string, state: FlxVirtualButtonState): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |
| `state` | `FlxVirtualButtonState` | - |

**Returns:** `boolean`

### `unregisterStick()`

```ts
unregisterStick(id: string, state: FlxVirtualStickState): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | - |
| `state` | `FlxVirtualStickState` | - |

**Returns:** `boolean`

