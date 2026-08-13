# flixel-pixi

`flixel-pixi` is a TypeScript port of Adam Saltsman's original ActionScript 3
Flixel engine, using PixiJS v8 as its browser rendering foundation.

The engine includes playable public-API samples, a complete upstream API ledger,
and capability-focused browser demos. It is currently in pre-1.0 stabilization.
The pinned external source-port and independent clean-room review are complete.
Current work is release hardening toward the 1.0 candidate. See
[ROADMAP.md](ROADMAP.md).

## Prerequisites

- Node.js 22.12 or newer.
- npm 10 or newer.

## Verify a fresh clone

The complete verification flow is one shell command:

```bash
npm ci && npx playwright install chromium firefox webkit && npm run verify
```

On Linux CI, use `npx playwright install --with-deps chromium firefox webkit` so
browser system dependencies are installed too.

`npm run verify` checks formatting, linting, types, unit coverage, production
builds, the public API report, benchmark/bundle reports, and the Playwright
browser smoke test.

## Development

```bash
npm install
npm run dev
```

The demo index starts on Vite's displayed local URL. Capability routes include
`/rendering.html`, `/sprites-text.html`, `/cameras.html`, `/tilemaps.html`,
`/input.html`, `/effects.html`, `/platform-services.html`, `/replay.html`, and
`/debugger.html`. The root route remains the minimal Pixi lifecycle smoke test.

Useful commands:

| Command                  | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `npm run build`          | Build declarations, ESM library, smoke example, and bundle report. |
| `npm run test`           | Run headless unit tests.                                           |
| `npm run test:e2e`       | Run lifecycle, GPU isolation, and high-DPI camera checks.          |
| `npm run test:perf`      | Run serial Chromium render-FPS floors and the teardown soak.       |
| `npm run test:soak:30m`  | Run the release-hardening 30-minute lifecycle/resource soak.       |
| `npm run check:budgets`  | Enforce bundle and deterministic CPU benchmark ceilings.           |
| `npm run verify:budgets` | Enforce every reference-hardware performance/resource budget.      |
| `npm run test:coverage`  | Run unit tests with initial coverage gates.                        |
| `npm run bench`          | Write fixed-loop and pixel-operation benchmark JSON.               |
| `npm run api:check`      | Verify the committed public API report.                            |
| `npm run api:update`     | Intentionally update the API report after review.                  |
| `npm run format`         | Format supported project files.                                    |

## Source baseline

Compatibility is pinned to Flixel commit
`8989e5044be072c4abbbaa1317c9854786f6447f`. The baseline contains 43 AS3 classes,
766 public members, and 14,928 source lines under `org/flixel`.

- [Compatibility ledger](docs/compatibility.md)
- [HaxeFlixel parity priorities](docs/haxeflixel-priorities.md)
- [Architecture decisions](docs/adr/README.md)
- [Lifecycle guide](docs/guides/lifecycle.md)
- [Loading and preloader guide](docs/guides/loading.md)
- [Making games (pools, actions, sync)](docs/guides/making-games.md)
- [Animation and frame collections](docs/guides/animation.md)
- [Containers and sprite groups](docs/guides/containers.md)
- [UI, accessible controls, bitmap fonts, and native text input](docs/guides/ui.md)
- [Gamepads](docs/guides/gamepads.md)
- [Tweens and easing](docs/guides/tweens.md)
- [Performance guide](docs/guides/performance.md)
- [Browser guide](docs/guides/browser.md)
- [Debugging guide](docs/guides/debugging.md)
- [Extension points](docs/guides/extensions.md)
- [Game-maker developer-experience evidence](docs/dx-evidence.md)
- [Historical port evidence](docs/history/porting/README.md)
- [Current roadmap](ROADMAP.md)
- [Browser support policy](docs/browser-support.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## License

The port is MIT licensed. The original Flixel copyright and license are
preserved in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
