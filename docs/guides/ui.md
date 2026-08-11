# UI authoring

The UI checkpoint provides efficient value bars, reusable buttons, bitmap-font
labels, and browser-native text entry.

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

See the public [`ui` demo](../../examples/games/ui/game.ts) for Kenney RPG UI
sprites (`FlxG.atlas` + `FlxBar` + `FlxButton`) with a bound health bar and
keyboard-operable damage/heal controls.

## Nine-slice panels and buttons

`FlxNineSliceSprite` and `FlxNineSliceButton` resize through Pixi 9-slice
geometry so corner and edge art stays crisp. Set border insets, then target
width/height — do not rely on uniform `scale` for UI chrome:

```ts
const panel = new FlxNineSliceSprite(16, 16, 380, 228);
panel.loadNineSliceFrame(atlas, 'panel_beige', 380, 228, {
  left: 20,
  top: 20,
  right: 20,
  bottom: 20,
});

const action = new FlxNineSliceButton(24, 200, 'Heal', onHeal);
action.loadNineSliceGraphic(
  strip,
  true,
  false,
  190,
  49,
  { left: 24, top: 16, right: 24, bottom: 16 },
  190,
  49,
);
```

Kenney RPG bars in the public demo still use atlas cap/mid/cap strips because
those assets are authored as horizontal 3-part fills, not full 9-slice tiles.

## Bitmap fonts and labels

`FlxBitmapFont` parses AngelCode BMFont XML or builds a monospace grid, then
registers a Pixi `BitmapFont` for `FlxBitmapText`:

```ts
const font = FlxBitmapFont.fromAngelCode(texture, xmlText);
const score = new FlxBitmapText(8, 8, 'Health 100', font, 160);
score.setFormat(null, 0, 0x4a3b30, 'left');
add(score);
```

Use `FlxBitmapText` for HUD counters and labels that update every frame; keep
styled `FlxText` for infrequent labels with borders and shadows.

Bitmap-font family names must be unique while registered. Destroying an owned
`FlxBitmapFont` removes that registration and its glyph metadata, but leaves the
source `FlxGraphic` or texture under its original owner's control.

## Native text input and IME

`FlxInputText` renders through Pixi when no browser bridge exists. Under
`createBrowserGame`, it is replaced by a camera-positioned native `<input>` or
`<textarea>`. This preserves the browser's caret, selection, password manager,
mobile keyboard, and IME composition behavior:

```ts
const playerName = new FlxInputText(24, 96, 220, '', {
  accessibleLabel: 'Player name',
  maxLength: 24,
  placeholder: 'Enter a name',
});
playerName.setFormat('Arial', 14, 0xffffff);
playerName.onTextChange = (value) => previewName(value);
playerName.onSubmit = (value) => acceptName(value);
add(playerName);
```

DOM edits, selection, focus, composition state, and Enter submission are
coalesced and published to `FlxInputText` on fixed updates. Gameplay callbacks
never run directly from a DOM event. Key-downs originating in native editable
elements are excluded from `FlxG.keys`, so text entry does not trigger gameplay
bindings.

Use `multiline: true` for a `<textarea>`, `type: 'password'` for concealed
single-line entry, and `inputMode` to hint the mobile keyboard. `enabled`,
`editable`, `tabIndex`, `focus()`, `blur()`, `select()`, `selectionStart`, and
`selectionEnd` cover common form behavior. Colors are configurable through
`backgroundColor`, `inputBorderColor`, `focusedBorderColor`, and the inherited
text `color`.

The visible native field depends on the default accessibility bridge. If an
application sets `accessibility: false`, it must provide its own DOM input
adapter; Pixi remains a visual fallback but cannot provide browser IME.

## Remaining UI checkpoint

### Virtual controls

`FlxVirtualPad` provides a HUD-aligned D-pad and optional A/B action buttons.
Each `FlxVirtualButton` publishes a stable, serializable source through
`button.source`; `bindActions()` and `bindAxes()` add those sources alongside
existing keyboard and gamepad bindings:

```ts
const pad = new FlxVirtualPad('full', 'a-b', {
  idPrefix: 'play-pad',
});
pad
  .bindAxes(FlxG.actions, {
    horizontal: 'move-x',
    vertical: 'move-y',
  })
  .bindActions(FlxG.actions, { A: 'jump', B: 'dash' });
add(pad);
```

Virtual input advances after live or replayed pointer state and before state
updates. It therefore preserves fixed-step `pressed`, `justPressed`, and
`justReleased` transitions without synthesizing keyboard events. Recorded
touch frames remain the replay authority; virtual button state is derived from
them. Buttons also inherit the native semantic-button bridge, so their
`accessibleLabel`, focus, and keyboard activation follow regular `FlxButton`
behavior.

Use a stable `idPrefix` whenever bindings are saved. A context rejects duplicate
virtual input IDs to prevent ambiguous action resolution. The public Action
demo combines virtual, keyboard, and gamepad sources for the same movement and
burst actions.

Asset-backed multi-page bitmap-font loading and analog virtual sticks remain
separate slices. They must keep the same asset-ownership, deterministic input,
and native accessibility boundaries.
