# ADR-0017: Native accessibility over camera render textures

- Status: Accepted
- Date: 2026-08-09

## Context

Flixel display objects are rendered into one Pixi render texture per camera.
Only each camera output sprite is attached to the application stage. Pixi's
accessibility system therefore cannot discover or position an individual
`FlxButton` inside the off-stage camera pass.

Canvas-only keyboard handling would also omit native focus, button semantics,
and screen-reader activation.

## Decision

1. The public browser boot path creates a transparent DOM accessibility layer
   over the canvas by default. `accessibility: false` disables it.
2. Each visible `FlxButton` with a non-null `accessibleLabel` is represented by
   a native `<button>` projected through its logical camera. Native focus,
   Enter, Space, and assistive-technology activation therefore follow browser
   behavior.
3. Accessibility buttons use `pointer-events: none`. Pointer/touch input keeps
   flowing to the canvas and remains on the existing fixed-step input path.
4. DOM focus and activation are queued on the `FlxButton` and consumed during
   its next deterministic update. DOM event timing never calls gameplay
   callbacks directly.
5. The DOM bridge owns and removes its elements, listeners, and temporary host
   positioning with the browser application lifecycle.

## Consequences

- Render-texture cameras retain their existing ownership and compositing model.
- Keyboard and screen-reader users get semantic native controls, while pointer
  behavior and visual focus remain part of the Flixel button.
- The initial bridge projects logical button bounds. Rich transformed hit
  regions and DOM-backed text input remain later UI/scaling slices.
