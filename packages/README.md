# Ecosystem packages

Reusable Flixel-Pixi ecosystem libraries live in this directory as npm
workspaces. Package names must use the `@flixel-pixi/` scope.

Packages may be private while they are experimental. Before publication, a
package must declare a semantic version and enable public npm access and
provenance in its `publishConfig`.

The `flixel-pixi` engine remains the publishable root package; it is not moved
into this directory.
