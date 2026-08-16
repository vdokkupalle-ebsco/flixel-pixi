---
title: FlxSaveMigration (TypeAlias)
description: API reference documentation for FlxSaveMigration in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSaveMigration

Callback for migrating save data between schema versions.

```ts
export type FlxSaveMigration = (oldData: Record<string, unknown>, oldVersion: number) => Record<string, unknown>
```

