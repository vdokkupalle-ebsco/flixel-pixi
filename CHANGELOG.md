# Changelog

Notable changes to `flixel-pixi` are recorded here. The project follows the
versioning and compatibility rules in
[versioning and API stability](/resources/versioning).

## Unreleased

Changes after the current release candidate are collected here before they are
assigned to a version.

## 0.1.0-rc.7 — 2026-08-20

This release candidate separates portable hosted-CI performance contracts from
absolute frame-rate thresholds that are meaningful only on the documented
reference machine.

### Changed

- Keep sprite stress readiness, object counts, finite positive frame metrics,
  lifecycle ownership, and teardown checks in hosted release verification.
- Add `npm run test:perf:reference` as the explicit Apple M4 Pro lane for the
  frozen 2k, 5k, and 10k sprite median-FPS floors.
- Run the portable performance and resource budget command during pre-tag
  release verification as well as trusted publishing.

## 0.1.0-rc.6 — 2026-08-20

This version was tagged but not published. Functional and cross-browser gates
passed, but trusted publishing compared Apple M4 Pro FPS floors with a
throttled GitHub-hosted runner and stopped before package preview or publish.
It separates mobile resize pressure from repeated
application lifecycle soak so headless browser verification exercises each
contract without rapid WebGL context churn obscuring the result.

### Added

- Added the VitePress documentation website, generated API reference, embedded
  examples, release snapshots, and GitHub Pages deployment workflow.

### Changed

- Keep all five mobile resize-pressure cycles on one live application, then
  verify canvas and accessibility surfaces are released after teardown.
- Leave repeated boot/destroy coverage to the dedicated performance soak rather
  than forcing rapid WebGL context loss and recreation inside the resize test.
- Refined the documentation website layout, navigation, version picker, and
  responsive presentation.

## 0.1.0-rc.5 — 2026-08-15

This version was tagged but not published. Its isolated mobile browser gate
lost the headless Chromium session during rapid repeated WebGL context
recreation before package preview and trusted publishing, so npm's `next` tag
remained on `0.1.0-rc.1`.

### Changed

- Split npm publication verification into isolated Chromium, headed Firefox,
  WebKit, and mobile commands so renderer resources are released between
  browser projects.
- Kept Firefox compatibility validation on the headed Xvfb path that passes on
  GitHub's Linux runner.
- Made the swipe demo test track its deterministic test bomb independently of
  bombs spawned by normal gameplay.
- Retained browser traces and verification reports when trusted publishing
  stops before npm publication.

## 0.1.0-rc.4 — 2026-08-15

This version was tagged but not published. Its browser release matrix failed
before package preview and trusted publishing, so npm's `next` tag remained on
`0.1.0-rc.1`.

### Changed

- Limited Playwright CI execution to one worker so Chromium, Firefox, and
  WebKit do not contend for the release runner's renderer and asset resources.
- Made the animation restart assertion tolerant of legitimate fixed-step
  progress between the click and browser snapshot.
- Reduced the debugger console scroll exercise from 30 commands to 15 while
  retaining the overflow and automatic-scroll contract.
- Extended affected cross-browser demo readiness waits for slower CI renderer
  and asset initialization.

## 0.1.0-rc.3 — 2026-08-15

This version was tagged but not published. It aligned pull-request and
npm-release verification on Node.js 24, but its browser release matrix failed
before trusted publishing ran. npm's `next` tag remained on `0.1.0-rc.1`.

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
