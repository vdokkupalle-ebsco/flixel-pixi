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
files and compressed/uncompressed size ceilings live in
[`package-artifact.json`](../package-artifact.json). Demos, test output, game
assets, and source files are deliberately excluded from the published package.

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

The repository uses the prerelease version `0.1.0-rc.1` and is publishable only
after the release-preparation change is approved. The npm `next` tag is
configured so the release candidate cannot accidentally replace `latest`.

Only after explicit release approval:

1. confirm the release-candidate version and release notes;
2. complete the manual physical-browser/device matrix;
3. confirm that the private guard was removed in the release commit;
4. run `npm ci`, `npm run verify`, and `npm run verify:budgets` from that commit;
5. for the first publication only, check out the immutable release tag and run
   `npm publish --access public --tag next --provenance=false` with an npm login
   protected by 2FA;
6. configure npm trusted publishing for `publish-npm.yml` and the `npm-release`
   GitHub environment, then remove the workflow's `NPM_TOKEN` fallback;
7. publish later releases from the approved GitHub workflow so npm generates
   signed provenance through OIDC automatically;
8. install and validate the registry tarball, then either promote it or record
   and fix the release-candidate defect.

Publishing is never part of `npm run verify` or `npm run check:package`.
