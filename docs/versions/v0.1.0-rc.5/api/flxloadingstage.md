---
title: FlxLoadingStage (TypeAlias)
description: API reference documentation for FlxLoadingStage in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Assets & Loading</span>
  <span class="api-badge public">@public</span>
</div>

# FlxLoadingStage

Lifecycle stage reported by a loading operation.

```ts
export type FlxLoadingStage =
  | 'idle'
  | 'renderer'
  | 'assets'
  | 'game'
  | 'first-frame'
  | 'interaction'
  | 'complete'
  | 'custom';
```
