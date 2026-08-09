# UI authoring

The first UI checkpoint provides efficient value bars and reusable buttons with
native browser accessibility.

## Value bars

`FlxBar` can hold a value directly, read a numeric property once per fixed
update, or use a provider callback:

```ts
class Player {
  health = 75;
}

const player = new Player();
const health = new FlxBar(
  16,
  16,
  FlxBar.LEFT_TO_RIGHT,
  160,
  12,
  player,
  'health',
  0,
  100,
  true,
).createFilledBar(0x172033ff, 0x22c55eff, true, 0xffffffff);

health.setCallbacks(
  () => playerDied(),
  () => awardFullHealthBonus(),
);
add(health);
```

All eight HaxeFlixel fill directions are available as `FlxBar` constants.
Changing a value resizes renderer-owned white sprites; it does not regenerate
or upload a texture. `fraction` returns 0–1 and `percent` returns 0–100.

Use `setValueProvider(() => value)` when a property-name binding is not a good
fit. Invalid and non-finite values fail at the fixed update that reads them.

## Buttons and accessibility

`FlxButton` supports mutable `text`, `enabled`, `accessibleLabel`, `tabIndex`,
`focused`, and explicit `activate()` behavior:

```ts
const heal = new FlxButton(24, 48, 'Heal', () => {
  player.health = Math.min(100, player.health + 10);
});
heal.accessibleLabel = 'Heal player by 10 points';
heal.enabled = player.health < 100;
add(heal);
```

`createBrowserGame` projects eligible buttons into an invisible native DOM
layer. Tab establishes focus; Enter, Space, and screen-reader actions queue the
same activation consumed by pointer input on the next fixed update. The DOM
controls do not intercept pointer events.

Set `accessibleLabel = null` to omit a decorative button from this layer. Use a
specific label whenever the visible text is ambiguous. The bridge is enabled by
default and can be disabled for a custom host integration:

```ts
createBrowserGame({
  accessibility: false,
  host,
  initialState: PlayState,
});
```

See the public [`ui` demo](../../examples/games/ui/game.ts) for a bound health
bar and keyboard-operable damage/heal controls.

## Remaining UI checkpoint

Bitmap-font file parsing, DOM/IME-backed text input, and virtual controls remain
separate slices. They must keep the same asset-ownership, deterministic input,
and native accessibility boundaries.
