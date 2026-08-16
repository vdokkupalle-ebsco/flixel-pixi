---
title: Input (Class)
description: API reference documentation for Input in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# Input

Deterministic named digital-input state machine.

```ts
export declare class Input
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`lookup`** | `readonly` | `Map<string, number>` | - |

## Methods

### `addAlias()`

```ts
protected addAlias(alias: string, keyName: string): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `alias` | `string` | - |
| `keyName` | `string` | - |

**Returns:** `void`

### `addKey()`

```ts
protected addKey(keyName: string, keyCode: number): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `keyName` | `string` | - |
| `keyCode` | `number` | - |

**Returns:** `void`

### `any()`

```ts
any(): boolean
```

**Returns:** `boolean`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `getKeyCode()`

```ts
getKeyCode(keyName: string): number
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `keyName` | `string` | - |

**Returns:** `number`

### `hasKeyCode()`

```ts
protected hasKeyCode(keyCode: number): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `keyCode` | `number` | - |

**Returns:** `boolean`

### `justPressed()`

```ts
justPressed(key: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `boolean`

### `justReleased()`

```ts
justReleased(key: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `boolean`

### `playback()`

```ts
playback(record: readonly FlxKeyRecord[] | null): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `record` | `readonly FlxKeyRecord[] \| null` | - |

**Returns:** `void`

### `pressed()`

```ts
pressed(key: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `key` | `string` | - |

**Returns:** `boolean`

### `queueKeyCode()`

```ts
protected queueKeyCode(keyCode: number, down: boolean): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `keyCode` | `number` | - |
| `down` | `boolean` | - |

**Returns:** `void`

### `queueReleaseAll()`

```ts
protected queueReleaseAll(): void
```

Drops unpublished events and queues releases for every published key.

**Returns:** `void`

### `record()`

```ts
record(): FlxKeyRecord[] | null
```

**Returns:** `FlxKeyRecord[] | null`

### `reset()`

```ts
reset(): void
```

**Returns:** `void`

### `update()`

```ts
update(): void
```

Publishes queued transitions for one authoritative simulation step.

**Returns:** `void`

