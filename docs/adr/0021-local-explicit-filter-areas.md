# ADR-0021: Local explicit filter areas with automatic fallback

- Status: Accepted
- Date: 2026-08-11
- Accepted: 2026-08-11 (advanced-rendering checkpoint)

## Context

When a filtered Pixi container has no explicit area, Pixi measures its global
bounds every frame. That recursive traversal is useful and safe by default, but
it is unnecessary for composites whose filtered extent is already known.

Exposing Pixi `Rectangle` objects would leak renderer state into gameplay code.
Defining areas in global or camera coordinates would also require games to
recalculate them for scroll, zoom, rotation, and every camera projection.

## Decision

1. `FlxSprite.filterArea` is an optional rectangle in the object's local render
   coordinates. Sprite groups use the same coordinates as their local members.
2. The setter validates and clones the rectangle. Caller mutation cannot change
   renderer state implicitly; `setFilterArea()` and `clearFilterArea()` are the
   fluent authoring helpers.
3. Each render handle owns one reusable Pixi rectangle. Pixi applies the
   container transform, so camera scroll/zoom and object transforms need no
   gameplay-side conversion.
4. An explicit area is attached only while the object has filters. Removing all
   filters clears the Pixi area without discarding the logical configuration;
   adding a filter later restores it.
5. `null` means automatic bounds measurement. This remains the safe default.
6. Filter padding is still applied by Pixi. The explicit rectangle describes
   the unfiltered local content that participates in the effect and does not
   alter collision, culling, input, or `onScreen()` behavior.

## Consequences

- Known-size filtered composites avoid recursive bounds measurement every
  rendered frame.
- The same logical area works across camera projections while renderer
  rectangles remain independently owned and are released with their handles.
- An undersized or stale area clips visual content. Dynamic composites should
  update the area when their extent changes or call `clearFilterArea()` to
  restore automatic measurement.
- The filter showcase can toggle between explicit and automatic bounds while
  rendering identical pixels, making the optimization contract observable.
