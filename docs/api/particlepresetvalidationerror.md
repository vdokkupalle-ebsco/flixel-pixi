---
title: ParticlePresetValidationError (Class)
description: API reference documentation for ParticlePresetValidationError in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# ParticlePresetValidationError

Error thrown when a particle preset cannot be parsed.

```ts
export declare class ParticlePresetValidationError extends Error
```

## Constructors

```ts
constructor(issues: ValidationIssue[])
```

Constructs a new instance of the `ParticlePresetValidationError` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `issues` | `ValidationIssue[]` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`issues`** | `readonly` | `ValidationIssue[]` | - |

