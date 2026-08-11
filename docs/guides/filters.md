# Filters

`FlxSprite.filters` accepts immutable renderer-neutral descriptors. Game code
does not import or own Pixi filters:

```ts
const ghost = new FlxSprite(80, 80).makeGraphic(48, 48, 0x38bdf8ff);
ghost.filters = [FlxColorMatrixFilter.grayscale(0.8)];

const panel = new FlxSpriteContainer(200, 100);
panel.add(icon);
panel.add(label);
panel.filters = [new FlxBlurFilter(4, { quality: 2 })];
```

Descriptor order is filter order. Assign a new list to change an effect; lists
and descriptors are immutable so the renderer can rebuild only when identity
changes:

```ts
sprite.filters = []; // Releases every camera-local Pixi filter instance.
```

Each camera projection owns a separate Pixi filter chain. Replacing the list,
removing a camera, or destroying the sprite releases those renderer resources
without changing textures or gameplay state. Collision, input, bounds, and
fixed-step updates never read filtered pixels.

Filters render through intermediate framebuffers. Prefer one filter on a
`FlxSpriteContainer` when the same effect applies to several children, keep
blur quality as low as the art permits, and avoid replacing descriptors every
frame. Custom shaders, displacement textures, and explicit filter-area tuning
are later advanced-rendering slices because they require additional ownership
and backend contracts.
