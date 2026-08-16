---
title: FlxContainer (Class)
description: API reference documentation for FlxContainer in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Core & Lifecycle</span>
  <span class="api-badge public">@public</span>
</div>

# FlxContainer

Exclusive logical group. A member can belong to only one `FlxContainer`; adding it elsewhere reparents it synchronously.

```ts
export declare class FlxContainer<T extends FlxBasic = FlxBasic> extends FlxGroup<T>
```

## Methods

### `replace()`

```ts
replace(oldObject: T, newObject: T): T | null
```

**Parameters:**

| Parameter   | Type | Description |
| :---------- | :--- | :---------- |
| `oldObject` | `T`  | -           |
| `newObject` | `T`  | -           |

**Returns:** `T | null`
