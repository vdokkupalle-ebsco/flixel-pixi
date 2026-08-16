---
title: FlxStateConstructor (TypeAlias)
description: API reference documentation for FlxStateConstructor in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxStateConstructor

Zero-argument state constructor used by reset and startup.

```ts
export type FlxStateConstructor<T extends FlxState = FlxState> = new () => T
```

