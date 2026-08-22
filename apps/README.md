# Ecosystem applications

Flixel-Pixi authoring tools and other deployable applications live in this
directory as npm workspaces. Application names must use the `@flixel-pixi/`
scope and every application package must set `private` to `true`.

Applications are built and deployed through explicit workflows. They are never
published by the engine's npm release process.
