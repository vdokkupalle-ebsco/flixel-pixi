# Changelog

Notable changes to `flixel-pixi` are recorded here. The project follows the
versioning and compatibility rules in
[`docs/versioning.md`](docs/versioning.md).

## Unreleased

Changes after the current release candidate are collected here before they are
assigned to a version.

## 0.1.0-rc.1 — planned

The first package release candidate. It intentionally uses the npm `next` tag
and remains blocked from publication until the final approval steps are
complete.

### Added

- A TypeScript port of the 43-class ActionScript 3 Flixel baseline, with a
  compatibility ledger for all 766 public upstream members.
- Fixed-step state, object, group, collision, input, audio, replay, debugger,
  tween, camera, tilemap, rendering, asset, and browser lifecycle systems.
- PixiJS v8 rendering with explicit ownership and teardown contracts.
- Public browser bootstrap, loading, scaling, safe-area, accessibility, FPS,
  audio-control, and renderer-fallback APIs.
- Playable package-root examples and a pinned Flx-Invaders compatibility port.
- Automated unit, API, package-consumer, performance, soak, browser, and device
  matrix gates.

### Package

- ESM-only output with bundled TypeScript declarations and source maps.
- `pixi.js` `^8.19.0` as a peer dependency.
- Node.js 22.12 or newer for development and package tooling.
- MIT license plus the original Flixel third-party notice.

### Compatibility notice

This is a prerelease API baseline. Feedback may still require breaking changes
between `0.1.0-rc.*` builds. Such changes must be listed in this changelog and
the upgrade guide before a new candidate is published.
