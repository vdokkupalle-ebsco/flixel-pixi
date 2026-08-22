# `@flixel-pixi/schemas`

Runtime-independent, versioned project data for Flixel-Pixi ecosystem tools.
The package has no dependency on Flixel-Pixi, PixiJS, a browser, or an editor.

The schema models project metadata, assets, scenes, entities, namespaced
extension data, and standalone particle presets. It provides:

- actionable validation issues with JSON-style paths;
- strict parsing with `ProjectValidationError`;
- deterministic, key-sorted JSON serialization;
- migration from the version 0 prototype shape to version 1;
- versioned particle emission, spawn, motion, and appearance definitions;
- JSON fixtures and round-trip-oriented tests.

```ts
import {
  migrateProjectDocument,
  serializeProjectDocument,
  validateProjectDocument,
} from '@flixel-pixi/schemas';

const result = validateProjectDocument(JSON.parse(source));
if (!result.success) {
  console.error(result.issues);
} else {
  const json = serializeProjectDocument(result.data);
}

const current = migrateProjectDocument(legacyData);
```

Particle editors use this package to author and validate portable preset JSON,
then use the installed `flixel-pixi` package for the live preview. This keeps
saved files independent from PixiJS while ensuring the preview runs through the
same engine API as a game.

The package remains private during format development. Publication requires an
explicit compatibility review, stable migration policy, changelog, and release
workflow.
