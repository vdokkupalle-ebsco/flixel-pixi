---
title: FlxDebugger (Class)
description: API reference documentation for FlxDebugger in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxDebugger

DOM overlay debugger with Console, Log, Watch, Perf, VCR, and Vis panels. Mounts as a fixed bottom bar. Fully keyboard/screen-reader accessible.

```ts
export declare class FlxDebugger
```

## Constructors

```ts
constructor(options?: FlxDebuggerOptions)
```

Constructs a new instance of the `FlxDebugger` class

| Parameter | Type                 | Description |
| :-------- | :------------------- | :---------- |
| `options` | `FlxDebuggerOptions` | -           |

## Properties

| Property          | Modifiers  | Type             | Description |
| :---------------- | :--------- | :--------------- | :---------- |
| **`console`**     | `readonly` | `FlxConsole`     | -           |
| **`diagnostics`** | `readonly` | `FlxDiagnostics` | -           |
| **`visible`**     | `readonly` | `boolean`        | -           |

## Methods

### `captureDiagnostics()`

```ts
captureDiagnostics(): FlxDebuggerDiagnosticSnapshot
```

**Returns:** `FlxDebuggerDiagnosticSnapshot`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `exportDiagnostics()`

```ts
exportDiagnostics(pretty?: boolean): string
```

**Parameters:**

| Parameter | Type      | Description |
| :-------- | :-------- | :---------- |
| `pretty`  | `boolean` | -           |

**Returns:** `string`

### `hide()`

```ts
hide(): void
```

**Returns:** `void`

### `setVCRCallbacks()`

```ts
setVCRCallbacks(callbacks: FlxDebuggerVCRCallbacks): void
```

Wire up VCR panel callbacks.

**Parameters:**

| Parameter   | Type                      | Description |
| :---------- | :------------------------ | :---------- |
| `callbacks` | `FlxDebuggerVCRCallbacks` | -           |

**Returns:** `void`

### `show()`

```ts
show(): void
```

**Returns:** `void`

### `subscribeToChannel()`

```ts
subscribeToChannel(channel: DebugChannel, log: FlxLog, watch: FlxWatch): void
```

Subscribe to a DebugChannel to receive step-complete, log, and watch events.

**Parameters:**

| Parameter | Type           | Description |
| :-------- | :------------- | :---------- |
| `channel` | `DebugChannel` | -           |
| `log`     | `FlxLog`       | -           |
| `watch`   | `FlxWatch`     | -           |

**Returns:** `void`

### `toggle()`

```ts
toggle(): void
```

**Returns:** `void`
