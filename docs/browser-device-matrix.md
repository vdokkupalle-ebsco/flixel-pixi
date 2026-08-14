# Browser and device release matrix

This focused mobile matrix complements the desktop coverage in
`npm run test:e2e`. Run it with:

```sh
npm run test:matrix
```

## Automated profiles

| Profile        | Playwright engine/device |                DPR | Input model             |
| -------------- | ------------------------ | -----------------: | ----------------------- |
| Android Chrome | Chromium / Pixel 7       | 2.625, capped to 2 | touch + mobile viewport |
| iOS Safari     | WebKit / iPhone 15       |     3, capped to 2 | touch + mobile viewport |

Each profile must pass these contracts:

- portrait, landscape, and square resizing preserves valid visible/safe logical
  rectangles;
- renderer and camera DPR remain capped at 2, bounding a 640×360 canvas backing
  store to 1280×720;
- the safe-area HUD control remains visible, semantically named, and keyboard
  focusable;
- fullscreen entry/exit updates the viewport snapshot and control label;
- visibility loss produces zero simulation steps and resume stays within a
  12-step observation budget without hidden-time catch-up;
- five repeated orientation/resize/destroy cycles remove every canvas and native
  accessibility control;
- The Android Chromium profile survives a critical DevTools Protocol
  memory-pressure notification and continue rendering before clean teardown.

The numeric limits live in [`performance-budgets.json`](../performance-budgets.json)
so test expectations and the published budget cannot drift.

## What emulation proves

Pixel 7 and iPhone 15 projects apply Playwright's mobile user agent, viewport,
DPR, touch, and browser-context settings to Chromium and WebKit respectively.
Desktop Chromium runs the complete browser suite; Firefox and WebKit run the
tagged compatibility contracts through `npm run test:e2e`.

Headless browsers do not provide a portable real fullscreen session, so the
automated fullscreen check uses standards-shaped `requestFullscreen`,
`exitFullscreen`, `fullscreenElement`, and `fullscreenchange` behavior. Firefox
WebKit exposes no Playwright memory-pressure control; its automated pressure
evidence is repeated high-DPR viewport churn and complete teardown.

## Manual release-candidate pass

Before publishing 1.0, record a manual pass on physical/native targets:

| Target                       | Required checks                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| Current and previous Chrome  | real fullscreen, tab hide/show, zoom/DPR, keyboard accessibility                       |
| Current and previous Edge    | same checks, including native Edge rather than Chromium inference                      |
| Current and previous Firefox | real fullscreen, tab hide/show, keyboard accessibility                                 |
| Current and previous Safari  | real fullscreen, tab hide/show, Retina DPR, VoiceOver                                  |
| Current Android Chrome       | orientation, touch, audio interruption, memory pressure/background restore             |
| Current iOS Safari           | safe-area/notch insets, orientation, VoiceOver, audio interruption, background restore |

Real-device results should include browser/OS versions and any deviations. The
automated matrix is blocking in CI; this manual table is blocking for the final
1.0 release approval because desktop emulation cannot prove mobile OS lifecycle,
speaker output, notch values, or assistive-technology announcements.
