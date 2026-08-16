---
title: FlxConsole (Class)
description: API reference documentation for FlxConsole in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxConsole

Headless, allow-listed debugger command registry with bounded history. It never evaluates arbitrary JavaScript; consumers decide which operations are safe by explicitly registering commands.

```ts
export declare class FlxConsole
```

## Constructors

```ts
constructor(options?: FlxConsoleOptions)
```

Constructs a new instance of the `FlxConsole` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `FlxConsoleOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`commands`** | `readonly` | `readonly FlxConsoleCommand[]` | - |
| **`history`** | `readonly` | `readonly string[]` | - |

## Methods

### `clearHistory()`

```ts
clearHistory(): void
```

**Returns:** `void`

### `complete()`

```ts
complete(input: string): readonly string[]
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `input` | `string` | - |

**Returns:** `readonly string[]`

### `execute()`

```ts
execute(input: string): Promise<FlxConsoleResult>
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `input` | `string` | - |

**Returns:** `Promise<FlxConsoleResult>`

### `register()`

```ts
register(command: FlxConsoleCommand): () => void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `command` | `FlxConsoleCommand` | - |

**Returns:** `() => void`

### `unregister()`

```ts
unregister(nameOrAlias: string): boolean
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `nameOrAlias` | `string` | - |

**Returns:** `boolean`

