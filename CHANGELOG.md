# Changelog

Notable changes to `flixel-pixi` are recorded here. The project follows the
versioning and compatibility rules in
[`docs/versioning.md`](docs/versioning.md).

## Unreleased

Changes after the current release candidate are collected here before they are
assigned to a version.

## 0.1.0-rc.3 — 2026-08-15

This release candidate aligns pull-request and npm-release verification on
Node.js 24 while retaining a lightweight Node.js 22 compatibility check. The
runtime API and package contents are unchanged from `0.1.0-rc.1` apart from
release metadata.

### Changed

- Made Node.js 24 the canonical pull-request coverage environment so it matches
  the trusted-publishing workflow.
- Added a parallel Node.js 22 type-check and unit-test compatibility job capped
  at two workers.
- Increased Node.js 24 branch coverage from 87.40% to 89.03% with targeted tests
  for input, assets, audio controls, debugger utilities, replay, and signals.

## 0.1.0-rc.2 — 2026-08-14

This version was tagged but not published. Its trusted-publishing workflow
stopped at the Node.js 24 coverage gate, so npm's `next` tag remained on
`0.1.0-rc.1`.

### Changed

- Prepared GitHub Actions OIDC trusted publishing without a long-lived npm
  token.
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
