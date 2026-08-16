---
title: FlxFpsDisplay (Class)
description: API reference documentation for FlxFpsDisplay in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxFpsDisplay

Small dependency-free DOM display for render FPS and frame pacing.

```ts
export declare class FlxFpsDisplay
```

## Constructors

```ts
constructor(options?: FlxFpsDisplayOptions)
```

Constructs a new instance of the `FlxFpsDisplay` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `options` | `FlxFpsDisplayOptions` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`fps`** | `readonly` | `number` | - |
| **`metrics`** | `readonly` | `FlxFpsMetrics` | Metrics from the most recently completed sampling window. |

## Methods

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `recordFrame()`

```ts
recordFrame(elapsedMS: number, simulationSteps?: number): void
```

Record one completed render and the fixed updates executed before it.

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `elapsedMS` | `number` | - |
| `simulationSteps` | `number` | - |

**Returns:** `void`

### `reset()`

```ts
reset(): void
```

Clear collected samples, such as after returning from a background tab.

**Returns:** `void`

