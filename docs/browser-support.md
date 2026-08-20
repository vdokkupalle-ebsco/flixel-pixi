# Browser and CI support policy

## Runtime baseline

The 1.0 target is the current and previous major release of Chrome, Edge,
Firefox, and Safari at the time of each flixel-pixi release. WebGL is the
required renderer baseline. WebGPU can be preferred through `createBrowserGame`;
initialization failure retries a fresh WebGL application before game state is
created and exposes the selected backend and fallback details.

Internet Explorer and legacy browsers without modern ESM, Pointer Events, and
Web Audio support are outside scope.

## Development baseline

- Node.js 22.12 or newer.
- npm 10 or newer.
- TypeScript strict mode.
- PixiJS 8.19 or a compatible later 8.x release.

## CI lanes

Browser coverage is proportional to browser-specific risk instead of repeating
every gameplay contract in every engine:

- pull requests run formatting, linting, TypeScript, unit coverage, builds, and
  the public API check;
- manual release verification runs package and deterministic quality gates;
- Chromium runs the complete browser suite;
- Firefox and WebKit run tests tagged `@cross-browser` for renderer lifecycle,
  assets, representative gameplay, input, audio, accessible UI, viewport
  layout, and DPR behavior;
- Pixel 7/Chromium and iPhone 15/WebKit run the focused mobile matrix;
- performance and extended soak tests remain dedicated opt-in commands.

On Linux CI, Firefox runs headed through Xvfb because PixiJS requires a real
WebGL implementation and Firefox headless can reject every available Mesa
driver. A renderer preflight runs without retries before the compatibility
contracts so an unavailable CI renderer fails once and clearly. Edge remains
covered by the Chromium engine lane until a native Edge job is added.

Visual baselines remain canonical to their selected browser environment rather
than comparing font rasterization across operating systems. Cross-browser tests
prefer semantic state, dimensions, lifecycle, and input contracts. Speaker
output, localStorage restrictions, real fullscreen, device notches, mobile
interruption recovery, and assistive-technology announcements remain manual
release evidence.

The focused mobile lane runs through `npm run test:matrix`. Its budgets and
physical-device limitations are documented in
[browser and device release matrix](https://github.com/vdokkupalle-ebsco/flixel-pixi/blob/main/docs/browser-device-matrix.md).

## Reports

Release CI uploads coverage, API model, benchmark, bundle-size, and Playwright
reports.
Release candidates additionally run `npm run verify:budgets` on hosted CI. That
portable lane exercises the browser stress scenes, resource ownership, teardown,
bundle size, and deterministic workloads without comparing hosted hardware to
the Apple M4 Pro FPS floors. Maintainers run `npm run test:perf:reference` on the
documented reference profile when validating those absolute frame-rate limits.
The same candidates run `npm run test:matrix`; native Edge, desktop Firefox and
Safari interaction checks, physical Android, and physical iOS/Safari results
remain explicit manual approval evidence.
The input suite adds committed baselines plus real keyboard, pointer capture,
blur-release, and touch-style cancellation assertions. These complement the
multi-camera tilemap baselines and large-map benchmarks. Real-device/mobile
Safari and touch-latency budgets remain release-gate work.
