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

The focused release matrix runs separately through `npm run test:matrix`. It
covers Desktop Chrome, Desktop Firefox, Desktop Safari, Pixel 7/Chromium, and
iPhone 15/WebKit profiles without making every showcase run under every mobile
emulation. Its budgets and manual physical-device limitations are published in
[browser-device-matrix.md](browser-device-matrix.md).

The container showcase is covered in Chromium, Firefox, and WebKit. Its browser
contract verifies nested composite rendering, fixed-step local/world coordinate
stability, member-AABB collision, and recursive adapter teardown. Collision and
lifecycle assertions also run headlessly so browser rendering cannot become an
authoritative input.

The UI suite runs in Chromium, Firefox, and WebKit. It verifies camera-aligned
semantic buttons, native text focus and selection, synthetic IME composition,
fixed-step value publication, Enter submission, and complete DOM teardown.

The viewport suite runs in Chromium, Firefox, and WebKit. It verifies fit/fill
layout changes, cropped logical bounds, safe HUD padding, pointer conversion,
alignment changes, DPR-backed renderer/camera resolution, focus-loss simulation
pause, resume timing, and native accessibility projection against the same
canvas bounds. Device-notch values still require real-device coverage before
1.0.

The ambient-audio suite runs in Chromium, Firefox, and WebKit. It moves a
listener deterministically across supplied looping emitters and verifies camera
visibility gating, distance attenuation, left/right pan, hierarchical and
master mute, volume controls, and offscreen playback policy. Automated tests
validate engine state and native control synchronization; speaker output,
localStorage restrictions, and mobile interruption recovery remain manual
real-device checks.

The filter showcase runs in Chromium, Firefox, and WebKit. It validates actual
rendered pixels for an unfiltered control and color-matrix output, exercises
runtime filter-chain replacement, composite-level filtering, typed live shader
uniforms, declared WebGL/WebGPU shader compatibility, animated displacement-map
output, explicit-versus-automatic composite bounds equivalence, and complete
canvas teardown. WebGPU execution and context-loss recovery remain later
advanced-rendering gates.

The mesh showcase runs in Chromium, Firefox, and WebKit. It validates actual
textured triangle output, revision-driven water and chain deformation,
`triangle-list` and `triangle-strip` topology, animation pause, and
complete canvas teardown. Unit coverage additionally verifies independent
camera geometry, buffer reuse, topology replacement, validation, transformed
visual culling, filter inheritance, and non-owning texture teardown. WebGPU
execution and forced context-loss recovery remain later release gates.

The vector-graphics showcase is specified for Chromium, Firefox, and WebKit. It
checks rendered linear/radial gradients, stable revisions during transform-only
animation, an intentional day/night command rebuild, and complete teardown.
Unit coverage verifies immutable descriptors, camera-local contexts and
gradient textures, rebuild cleanup, primitives, validation, filters, culling,
and handle teardown. The committed browser contract is awaiting its next
available browser execution window.

## Reports

CI uploads coverage, API model, benchmark, bundle-size, and Playwright reports.
Release candidates additionally run `npm run verify:budgets` on the documented
Apple M4 Pro reference profile. The portable CI lane continues to record
benchmark reports without pretending that one machine's FPS floor applies to
every hosted runner.
The same candidates run `npm run test:matrix`; native Edge, physical Android,
and physical iOS/Safari results remain explicit manual approval evidence.
The input suite adds committed baselines plus real keyboard, pointer capture,
blur-release, and touch-style cancellation assertions. These complement the
multi-camera tilemap baselines and large-map benchmarks. Real-device/mobile
Safari and touch-latency budgets remain release-gate work.
