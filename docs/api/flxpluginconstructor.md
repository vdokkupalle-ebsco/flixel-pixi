---
title: FlxPluginConstructor (TypeAlias)
description: API reference documentation for FlxPluginConstructor in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# FlxPluginConstructor

Constructor used by the plugin compatibility facade.

```ts
export type FlxPluginConstructor<T extends FlxBasic = FlxBasic> = abstract new (...args: never[]) => T
```

