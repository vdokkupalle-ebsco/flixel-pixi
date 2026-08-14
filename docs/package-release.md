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

## Publication guard

The repository intentionally remains at version `0.0.0` with `private: true`
during hardening. `npm pack` still permits artifact verification, while
`npm publish` is blocked.

Only after explicit release approval:

1. choose and record the release-candidate version;
2. freeze the API report and complete the changelog and upgrade policy;
3. complete the manual physical-browser/device matrix;
4. remove the private guard in the release commit;
5. run `npm ci`, `npm run verify`, and `npm run verify:budgets` from that commit;
6. publish from the approved GitHub workflow with npm trusted publishing or an
   equivalent OIDC setup so `publishConfig.provenance` produces signed
   provenance;
7. install and validate the registry tarball, then either promote it or record
   and fix the release-candidate defect.

Publishing is never part of `npm run verify` or `npm run check:package`.
