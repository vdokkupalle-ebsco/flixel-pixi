---
title: FlxPreloaderView (Interface)
description: API reference documentation for FlxPreloaderView in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Debugger & Diagnostics</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPreloaderView

Replaceable presentation driven by a shared loading session.

```ts
export interface FlxPreloaderView
```

## Methods

### `complete()`

```ts
complete(): Promise<void>
```

**Returns:** `Promise<void>`

### `destroy()`

```ts
destroy(): void
```

**Returns:** `void`

### `update()`

```ts
update(snapshot: FlxLoadingSnapshot): void
```

**Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `snapshot` | `FlxLoadingSnapshot` | - |

**Returns:** `void`

