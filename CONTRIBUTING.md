# Contributing to flixel-pixi

Thank you for improving `flixel-pixi`. Changes should preserve deterministic
gameplay behavior, public package boundaries, browser compatibility, and clean
resource ownership.

## Development setup

Requirements:

- Node.js 22.12 or newer.
- npm 10 or newer.
- Chromium, Firefox, and WebKit when running the complete browser matrix.

Install dependencies and start the demo index:

```bash
npm ci
npm run dev
```

Use a feature branch and keep unrelated changes out of the same pull request.
Game and demo code must consume package-root exports rather than private engine
modules.

## Workspace boundaries

The repository uses npm workspaces without moving the existing `flixel-pixi`
engine package from the root:

- `packages/*` contains reusable `@flixel-pixi/*` libraries;
- `apps/*` contains private authoring tools and deployable applications.

Run `npm install` from the repository root when adding or changing a workspace
dependency so `package-lock.json` stays synchronized. Do not create nested lock
files. Applications must set `private: true`; publishable packages must enable
public npm access and provenance. Verify these rules with:

```bash
npm run check:workspaces
```

## Verification

Run the standard local checks before opening a pull request:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run check:workspaces
npm run test:coverage
npm run build
npm run api:check
```

Install the Playwright browsers before the complete verification lane:

```bash
npx playwright install chromium firefox webkit
npm run verify
```

On Linux CI, use:

```bash
npx playwright install --with-deps chromium firefox webkit
```

### Useful commands

| Command                       | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `npm run dev`                 | Start the capability-demo index.                        |
| `npm run build`               | Build declarations, library, demos, and examples.       |
| `npm run test`                | Run unit tests.                                         |
| `npm run test:coverage`       | Run unit tests with coverage gates.                     |
| `npm run test:e2e`            | Run full Chromium and tagged Firefox/WebKit checks.     |
| `npm run test:matrix`         | Run the Android/iOS browser-device matrix.              |
| `npm run test:perf`           | Run portable Chromium stress and teardown checks.       |
| `npm run test:perf:reference` | Apply FPS floors on the documented reference machine.   |
| `npm run test:soak:30m`       | Run the extended lifecycle/resource soak.               |
| `npm run check:budgets`       | Check bundle and deterministic CPU budgets.             |
| `npm run check:package`       | Verify the packed artifact in a clean consumer.         |
| `npm run check:workspaces`    | Verify workspace names and publishing boundaries.       |
| `npm run verify:budgets`      | Check portable performance and resource budgets.        |
| `npm run verify:quality`      | Run release checks that do not require browser engines. |
| `npm run api:check`           | Compare the public API with its committed baseline.     |
| `npm run api:update`          | Regenerate the API baseline after intentional review.   |
| `npm run verify`              | Run the complete release-hardening verification suite.  |

## Public API changes

The committed API baseline is [`etc/flixel-pixi.api.md`](https://github.com/vdokkupalle-ebsco/flixel-pixi/blob/main/etc/flixel-pixi.api.md).
Do not edit it manually.

For an intentional public API change:

1. explain the compatibility impact;
2. update the changelog and upgrade guide when consumers are affected;
3. run `npm run api:update`;
4. review the generated API diff;
5. run `npm run check:package`.

Breaking changes during `0.1.0-rc.*` require a concrete validation reason and
explicit review. See [versioning and API stability](/resources/versioning).

## Pull requests

- Describe the user-visible behavior and the reason for the change.
- Add focused unit or browser coverage proportional to the risk.
- Update the relevant guide when public behavior changes.
- Preserve existing user changes and third-party license notices.
- Resolve review conversations and keep the final history suitable for squash
  merging.

Release publication remains a maintainer-only, manually approved workflow.
