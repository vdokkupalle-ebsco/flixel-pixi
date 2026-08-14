# Changelog

Notable changes to `flixel-pixi` are recorded here. The project follows the
versioning and compatibility rules in
[`docs/versioning.md`](docs/versioning.md).

## Unreleased

Changes after the current release candidate are collected here before they are
assigned to a version.

## 0.1.0-rc.2 — 2026-08-14

The first release candidate published through npm Trusted Publishing. The
runtime API and package contents are unchanged from `0.1.0-rc.1` apart from
release metadata.

### Changed

- Replaced the long-lived npm token fallback with GitHub Actions OIDC.
- Updated the release procedure after the initial npm publication.

## 0.1.0-rc.1 — 2026-08-14

The first package release candidate. It was published with the npm `next` tag
through a one-time, 2FA-protected bootstrap release.

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
