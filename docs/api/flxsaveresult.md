---
title: FlxSaveResult (TypeAlias)
description: API reference documentation for FlxSaveResult in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSaveResult

Result of a `FlxSave.flush()` operation. On failure, includes an error category and human-readable message.

```ts
export type FlxSaveResult = { success: true; } | { success: false; error: 'async' | 'quota' | 'serialization' | 'unknown'; message: string; }
```

