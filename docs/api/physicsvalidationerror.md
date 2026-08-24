---
title: PhysicsValidationError (Class)
description: API reference documentation for PhysicsValidationError in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# PhysicsValidationError

Structured error thrown while parsing a physics document.

```ts
export declare class PhysicsValidationError extends Error
```

## Constructors

```ts
constructor(issues: ValidationIssue[])
```

Constructs a new instance of the `PhysicsValidationError` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `issues` | `ValidationIssue[]` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`issues`** | `readonly` | `ValidationIssue[]` | - |

