---
title: ParticleEffectValidationError (Class)
description: API reference documentation for ParticleEffectValidationError in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-class">Class</span>
  <span class="api-badge category">Types & Utilities</span>
  <span class="api-badge public">@public</span>
</div>

# ParticleEffectValidationError

Structured error thrown while parsing a particle effect document.

```ts
export declare class ParticleEffectValidationError extends TypeError
```

## Constructors

```ts
constructor(issues: ValidationIssue[])
```

Constructs a new instance of the `ParticleEffectValidationError` class

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `issues` | `ValidationIssue[]` | - |

## Properties

| Property | Modifiers | Type | Description |
| :--- | :--- | :--- | :--- |
| **`issues`** | `readonly` | `ValidationIssue[]` | - |

