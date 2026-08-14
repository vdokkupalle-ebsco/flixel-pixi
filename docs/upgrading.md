# Upgrading flixel-pixi

This guide records consumer actions required when moving between package
versions. The current entry starts from repository snapshots because
`0.1.0-rc.1` is the first planned external package.

## Repository snapshot to 0.1.0-rc.1

### Installation

After the release candidate is published, install it from the prerelease
channel together with its PixiJS peer:

```bash
npm install flixel-pixi@next pixi.js@^8.19.0
```

Do not use that command until the release candidate is announced; the repository
version alone does not indicate registry availability.

### Imports

Replace relative imports into the repository with package-root imports:

```ts
import { createBrowserGame, FlxSprite, FlxState } from 'flixel-pixi';
```

Deep imports such as `flixel-pixi/dist/index.js` and imports from `src/**` are
not supported.

### Runtime and module format

- Use ESM-aware tooling; the package does not ship a CommonJS build.
- Install a compatible PixiJS v8 peer. The engine does not bundle a private copy
  of PixiJS.
- Use Node.js 22.12 or newer for the documented development and verification
  workflow.

### Browser lifecycle

Use `createBrowserGame` for the recommended browser boot path and retain the
returned application. Call `application.destroy()` when unmounting or replacing
the game so canvases, listeners, render resources, audio, and overlays are
released.

### Prerelease expectations

Pin an exact `0.1.0-rc.*` version for production-like validation. Review the
changelog and this guide before moving to a newer candidate because prerelease
feedback may still produce a documented breaking change.
