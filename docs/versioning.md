# Versioning and API stability

`flixel-pixi` uses Semantic Versioning, with an intentionally gradual path to
1.0. The first external validation line is `0.1.0`.

## Current release line

`0.1.0-rc.1` is the first published package release candidate. Release
candidates use the npm `next` tag and may contain documented breaking changes
while real games validate the API. After a stable release exists, prereleases
must not move the npm `latest` tag.

The repository and package are public. A version in the repository or on a Git
tag is not considered published until the npm registry contains that immutable
version and its trusted-publishing provenance.

## Compatibility promise

- `0.1.0-rc.*`: breaking changes are allowed only when validation exposes a
  concrete problem. Each one requires an API-report update, changelog entry, and
  upgrade note.
- Stable `0.1.x`: patch releases preserve documented public behavior and root
  exports. They may add compatible APIs and fix defects.
- A breaking change after stable `0.1.0` requires at least the next minor line,
  such as `0.2.0`, with migration guidance. Deprecation should precede removal
  when the old behavior can be retained safely.
- `1.0.0` is reserved for a later explicit decision after multiple real games,
  package releases, and supported-browser cycles validate the API.

SemVer applies to public package-root exports and their documented behavior. It
does not cover internal source paths, demo helpers, generated output, or APIs
marked `@internal`.

## API freeze workflow

[`etc/flixel-pixi.api.md`](https://github.com/vdokkupalle-ebsco/flixel-pixi/blob/main/etc/flixel-pixi.api.md) is the committed public API
baseline. `npm run api:check` regenerates declarations and fails when the current
surface differs from that baseline.

For an intentional public API change:

1. explain the compatibility impact in the pull request or commit;
2. add the corresponding changelog and upgrade-guide entry;
3. run `npm run api:update` and review the generated report as source code;
4. run `npm run check:package` to prove the new declarations and exports in a
   clean consumer;
5. obtain explicit review for a breaking change before merging it.

Public consumers should import only from `flixel-pixi`. Deep imports into
`dist/` or repository `src/` paths are unsupported and blocked by the package
export map.

## Particle Editor compatibility

The Particle Editor is a hosted application deployed from the same commit as
the documentation. It is not an independently installable npm package and does
not have a separate public application version.

Portable `*.effect.json` files are the compatibility boundary between the
editor and a game. Each document carries its own format version:

- Particle Editor effect-document version `1` is supported by
  `flixel-pixi@0.1.0-rc.9` and later compatible releases.
- A breaking document-shape change requires a new document version and explicit
  migration guidance. Existing version `1` exports remain valid.
- The runtime validates an export before constructing emitters and reports an
  unsupported or malformed document rather than silently changing its meaning.
- Texture files are external assets. Their `assetId` values must be preloaded
  with `FlxAssets` before calling `FlxParticleEffect.fromAssets`.

The editor's private workspace manifest references the latest engine already
available from npm, so clean installs never depend on an unpublished version.
Its production and test builds alias `flixel-pixi` to the engine source in the
same repository, ensuring the deployed editor is verified against the exact
runtime shipped from that commit.
