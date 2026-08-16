# Cameras & Viewport Effects

`FlxCamera` controls scrolling, target tracking with deadzones, zoom, screen shakes, flashes, and fades.

---

## 1. Tracking the Player

```ts
// Follow target with platformer deadzone style
this.camera.follow(this.player, 'PLATFORMER', 0.1);

// Set camera scroll boundaries (prevent scrolling outside level)
this.camera.setBounds(0, 0, 2000, 1000);
```

### Camera Follow Styles

- `'LOCKON'`: Strict center lock.
- `'PLATFORMER'`: Horizontal deadzone with upper/lower lead.
- `'TOPDOWN'`: Box deadzone centered on target.
- `'NO_DEAD_ZONE'`: Smooth linear interpolation directly to target coordinates.

---

## 2. Camera FX (Shake, Flash, Fade)

```ts
// Screen shake (intensity, duration, direction)
this.camera.shake(0.015, 0.35);

// White flash (color, duration)
this.camera.flash(0xffffff, 0.2);

// Fade to black on death
this.camera.fade(0x000000, 1.0, false, () => {
  this.restartState();
});
```
