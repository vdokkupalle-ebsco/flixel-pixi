# Package and release procedure

The npm release gate tests the artifact that a consumer receives, rather than
assuming a successful repository build implies a usable package.

## Artifact contract

Run the complete local gate with:

```bash
npm run check:package
```

The command builds the ESM entry and declarations, checks the committed API
report, and creates a tarball with an isolated temporary npm cache. The allowed
root package metadata, exports, publish settings, peer dependencies, files, and
compressed/uncompressed size ceilings live in
[`package-artifact.json`](../package-artifact.json). Demos, test output, game
assets, and source files are deliberately excluded from the published package.

Every pull request runs the faster contract-only gate after the production
build and API extraction:

```bash
npm run check:package:contract
```

That command uses `npm pack --dry-run` to verify the root manifest, exact file
set, and size ceilings without installing the tarball or launching a browser.
The complete `check:package` gate remains responsible for testing the packed
artifact in a clean consumer project and Chromium.

The gate then creates a temporary consumer project and verifies:

- the exact tarball file allowlist and size ceilings;
- the root ESM export and rejection of undeclared deep imports;
- strict TypeScript consumption through the exported declaration file;
- a production Vite build using `pixi.js` as the declared peer dependency;
- source-map linkage, embedded sources, and absence of absolute build paths;
- MIT licensing, third-party notices, repository metadata, and npm provenance
  configuration;
- a headless Chromium boot, first canvas, clean destroy, and error-free console.

The temporary consumer links the repository's already-installed PixiJS peer so
the test is deterministic and does not depend on registry access. It does not
publish or modify the user's npm cache.

The committed project-level [`.npmrc`](../.npmrc) pins package operations to
`https://registry.npmjs.org/`. This prevents a user- or organization-level npm
configuration from accidentally packing, resolving, or publishing through a
different registry. Authentication remains outside the repository; never add a
token to `.npmrc`.

## Publication guard

The initial `0.1.0-rc.1` release established the package on npm. Subsequent
releases use npm trusted publishing from the `publish-npm.yml` workflow and the
`npm-release` GitHub environment. The workflow receives a short-lived OIDC
credential through `id-token: write`; it does not receive an `NPM_TOKEN`.

Only after explicit release approval:

1. confirm the release-candidate version and release notes;
2. complete the manual physical-browser/device matrix;
3. confirm that the package is publishable and the version is unused;
4. run `npm ci`, `npm run verify`, and `npm run verify:budgets` from that commit;
   run `npm run test:perf:reference` separately on the documented reference
   machine when validating absolute FPS floors;
5. create an immutable `v<version>` tag on the approved commit;
6. dispatch `publish-npm.yml` from that tag with the exact version as input;
7. confirm npm generated signed provenance through trusted publishing;
8. install and validate the registry tarball, then either promote it or record
   and fix the release-candidate defect.

Publishing is never part of `npm run verify` or `npm run check:package`.
