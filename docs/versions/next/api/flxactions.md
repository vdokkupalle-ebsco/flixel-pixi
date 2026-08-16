---
title: FlxActions (Class)
description: API reference documentation for FlxActions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Input & Controls</span>
  <span class="api-badge public">@public</span>
</div>

# FlxActions

Maps logical actions to keyboard, pointer, and gamepad sources.

The legacy `bind(action, ...keys)` helper remains a keyboard-only shorthand.

```ts
export declare class FlxActions
```

## Methods

### `addSource()`

```ts
addSource(action: string, source: FlxActionSource, options?: FlxActionRebindOptions): void
```

Add one source without replacing the action's existing sources.

**Parameters:**

| Parameter | Type                     | Description |
| :-------- | :----------------------- | :---------- |
| `action`  | `string`                 | -           |
| `source`  | `FlxActionSource`        | -           |
| `options` | `FlxActionRebindOptions` | -           |

**Returns:** `void`

### `bind()`

```ts
bind(action: string, ...keys: string[]): void
```

Replace an action with one or more keyboard bindings.

**Parameters:**

| Parameter | Type       | Description |
| :-------- | :--------- | :---------- |
| `action`  | `string`   | -           |
| `keys`    | `string[]` | -           |

**Returns:** `void`

### `bindSources()`

```ts
bindSources(action: string, ...sources: readonly FlxActionSource[]): void
```

Replace every source assigned to an action.

**Parameters:**

| Parameter | Type                         | Description |
| :-------- | :--------------------------- | :---------- |
| `action`  | `string`                     | -           |
| `sources` | `readonly FlxActionSource[]` | -           |

**Returns:** `void`

### `getSources()`

```ts
getSources(action: string): readonly FlxActionSource[]
```

Return defensive copies of an action's sources.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `action`  | `string` | -           |

**Returns:** `readonly FlxActionSource[]`

### `justPressed()`

```ts
justPressed(action: string): boolean
```

Returns true if any digital source was pressed on this simulation step.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `action`  | `string` | -           |

**Returns:** `boolean`

### `justReleased()`

```ts
justReleased(action: string): boolean
```

Returns true if any digital source was released on this simulation step.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `action`  | `string` | -           |

**Returns:** `boolean`

### `load()`

```ts
load(data: FlxActionBindingsData | string): void
```

Load bindings from a versioned object or JSON string.

**Parameters:**

| Parameter | Type                              | Description |
| :-------- | :-------------------------------- | :---------- |
| `data`    | `FlxActionBindingsData \| string` | -           |

**Returns:** `void`

### `pressed()`

```ts
pressed(action: string): boolean
```

Returns true if any digital source is currently pressed.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `action`  | `string` | -           |

**Returns:** `boolean`

### `rebind()`

```ts
rebind(action: string, source: FlxActionSource, options?: FlxActionRebindOptions): void
```

Replace an action with one source and, by default, remove that exact source from every other action.

**Parameters:**

| Parameter | Type                     | Description |
| :-------- | :----------------------- | :---------- |
| `action`  | `string`                 | -           |
| `source`  | `FlxActionSource`        | -           |
| `options` | `FlxActionRebindOptions` | -           |

**Returns:** `void`

### `removeSource()`

```ts
removeSource(action: string, source: FlxActionSource): boolean
```

Remove one exact source from an action.

**Parameters:**

| Parameter | Type              | Description |
| :-------- | :---------------- | :---------- |
| `action`  | `string`          | -           |
| `source`  | `FlxActionSource` | -           |

**Returns:** `boolean`

### `reset()`

```ts
reset(): void
```

Clear all action bindings.

**Returns:** `void`

### `save()`

```ts
save(): FlxActionBindingsData
```

Export a versioned, JSON-safe binding object.

**Returns:** `FlxActionBindingsData`

### `unbind()`

```ts
unbind(action: string): void
```

Unbind an action name.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `action`  | `string` | -           |

**Returns:** `void`

### `value()`

```ts
value(action: string): number
```

Returns the strongest scalar analog source by absolute magnitude. Digital sources do not contribute to this value.

**Parameters:**

| Parameter | Type     | Description |
| :-------- | :------- | :---------- |
| `action`  | `string` | -           |

**Returns:** `number`
