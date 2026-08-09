# Tweens and easing

Tweens run on deterministic game time. They advance from `FlxGame.step()`, use
`FlxG.elapsed`, pause with the game, and are cleared when the active state
changes. Rendering frequency does not affect their result.

## Tween object properties

```ts
import { FlxEase, FlxSprite, FlxTween } from 'flixel-pixi';

const card = new FlxSprite(20, 40);

FlxTween.tween(
  card,
  { x: 240, alpha: 0.4, 'scale.x': 1.5, 'scale.y': 1.5 },
  0.75,
  {
    ease: FlxEase.quadInOut,
    onComplete: () => {
      card.alpha = 1;
    },
  },
);
```

Start values are captured when the start delay ends. This makes it safe to
configure or reposition an object while a delayed tween is waiting.

## Tween a standalone number

```ts
FlxTween.num(0, 100, 1.5, { ease: FlxEase.sineOut }, (value) => {
  scoreLabel.text = `Score ${Math.round(value)}`;
});
```

## Completion modes

- `FlxTween.ONESHOT` is the default. It completes and removes itself.
- `FlxTween.PERSIST` completes but remains available for `start()`.
- `FlxTween.LOOPING` restarts from the beginning.
- `FlxTween.PINGPONG` alternates forward and backward.
- `FlxTween.BACKWARD` runs once from the target value to the starting value.

Looping tweens can use `loopDelay`; every tween can use `startDelay`. The
optional `framerate` setting quantizes tween changes while the underlying game
simulation continues at its configured update rate.

```ts
const pulse = FlxTween.tween(sprite, { alpha: 0.25 }, 0.4, {
  type: FlxTween.PINGPONG,
  ease: FlxEase.sineInOut,
  loopDelay: 0.1,
});

pulse.active = false; // pause
pulse.active = true; // resume
pulse.cancel();
```

## Chains

```ts
const enter = FlxTween.tween(panel, { y: 80 }, 0.3, {
  ease: FlxEase.backOut,
});
const leave = FlxTween.tween(panel, { y: -120 }, 0.25, {
  ease: FlxEase.quadIn,
});

enter.wait(1).then(leave);
```

`cancel()` yields to the next tween in a chain. `cancelChain()` cancels the
whole remaining chain.

## Managing target tweens

```ts
FlxTween.cancelTweensOf(player);
FlxTween.cancelTweensOf(player, ['x', 'scale.x']);
FlxTween.completeTweensOf(hud, ['alpha']);
```

Completing a tween applies its final value immediately; its completion callback
is processed by the manager on the next game step. Looping and ping-pong tweens
are intentionally ignored by `completeTweensOf`.

`FlxTween.globalManager` is installed automatically by `FlxGame`. If you build
a custom headless loop with `FlxContext`, add one `FlxTweenManager` plugin before
using the static factories.
