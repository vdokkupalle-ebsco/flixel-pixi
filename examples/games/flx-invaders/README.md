# Flx-Invaders compatibility port

This is a source-level TypeScript port of Adam Saltsman's
[`Flx-Invaders`](https://github.com/AdamAtomic/Flx-Invaders) pinned at commit
`a941a9dfad7663a20e9f7f4bf2a90603d7effe89`.

The upstream game and its two PNG sprites are MIT licensed. The retained
license is in `LICENSE.upstream.txt`. The port follows all four gameplay source
files: `FlxInvaders.as`, `PlayState.as`, `PlayerShip.as`, and `Alien.as`.

## Run it

From the repository root:

```sh
npm install
npm run dev:games
```

Open <http://127.0.0.1:4174/flx-invaders/>. Use Left/Right to move and Space to
fire. Player and alien shots destroy shields and targets on contact. Losing the
ship or clearing all aliens resets the state and preserves the result message.

For a bounded clean-room review, open
<http://127.0.0.1:4174/flx-invaders/?review=1>. This opt-in review mode adds
**Validate Win** and **Validate Loss** buttons. Each button triggers the same
terminal condition checked by normal gameplay; confirm that the formation is
rebuilt and that the canvas displays `YOU WON` or `YOU LOST`, respectively.
The buttons are absent from normal gameplay.

## Clean-room review checklist

- The page reaches “Pinned Flx-Invaders source port ready”.
- The ship moves with Left/Right and remains inside the game bounds.
- Space fires a white projectile from the ship.
- Aliens animate, move horizontally, descend, and fire downward.
- Projectiles chip individual shield blocks and destroy opposing targets.
- Losing or winning rebuilds the formation and displays the corresponding
  status.
- Destroy removes the game canvas without a browser-console error.

Reviewers should use this README and the public guides only; reading `src/**`
is not required. Record the browser versions used and any behavioral difference
from the pinned upstream source in `docs/external-compatibility-validation.md`.
