---
title: FlxSaveBindOptions (Interface)
description: API reference documentation for FlxSaveBindOptions in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-interface">Interface</span>
  <span class="api-badge category">Storage & Replay</span>
  <span class="api-badge public">@public</span>
</div>

# FlxSaveBindOptions

Options for `FlxSave.bind()`.

```ts
export interface FlxSaveBindOptions
```

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`backend`** | - | `FlxStorageBackend` | Override the storage backend for this save slot. |
| **`migrate`** | - | `FlxSaveMigration` | Migration callback invoked when the stored version differs. |
| **`version`** | - | `number` | Schema version. Defaults to 0 (no versioning). |

