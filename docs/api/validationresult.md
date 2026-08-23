---
title: ValidationResult (TypeAlias)
description: API reference documentation for ValidationResult in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-typealias">TypeAlias</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# ValidationResult

```ts
export type ValidationResult<T> = { data: T; success: true; } | { issues: ValidationIssue[]; success: false; }
```

