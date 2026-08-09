# Browser and CI support policy

## Runtime baseline

The 1.0 target is the current and previous major release of Chrome, Edge,
Firefox, and Safari at the time of each flixel-pixi release. WebGL is the
required renderer baseline. WebGPU may be selected by PixiJS when available,
but it must not change gameplay behavior and must fall back cleanly.

Internet Explorer and legacy browsers without modern ESM, Pointer Events, and
Web Audio support are outside scope.

## Development baseline

- Node.js 22.12 or newer.
- npm 10 or newer.
- TypeScript strict mode.
- PixiJS 8.19 or a compatible later 8.x release.

## CI lanes

CI runs the complete verification suite on Node 22 plus Chromium, Firefox,
and WebKit:

- formatting and linting;
- TypeScript checking;
- unit tests and coverage;
- library and smoke-example production builds;
- API report verification;
- benchmark JSON generation;
- bundle-size JSON generation;
- Playwright browser smoke test.

Firefox and WebKit are blocking for the sprites-and-text browser suite. Edge is
covered by the Chromium engine lane until the release-candidate matrix adds a
native Edge job. Real-device/mobile Safari and WebGPU lanes become blocking
before the 1.0 release gate.

The container showcase is covered in Chromium, Firefox, and WebKit. Its browser
contract verifies nested composite rendering, fixed-step local/world coordinate
stability, member-AABB collision, and recursive adapter teardown. Collision and
lifecycle assertions also run headlessly so browser rendering cannot become an
authoritative input.

## Reports

CI uploads coverage, API model, benchmark, bundle-size, and Playwright reports.
The input suite adds committed baselines plus real keyboard, pointer capture,
blur-release, and touch-style cancellation assertions. These complement the
multi-camera tilemap baselines and large-map benchmarks. Real-device/mobile
Safari and touch-latency budgets remain release-gate work.
