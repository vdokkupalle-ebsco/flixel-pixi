# Particles & Emitters

Particle effects in Flixel-Pixi are handled through `FlxEmitter` and `FlxParticle`. Emitters manage pooled particles with randomized velocities, lifespans, rotations, and gravity.

---

## Creating an Explosion / Spark Emitter

```ts
import { FlxEmitter, FlxParticle, FlxPoint } from 'flixel-pixi';

export class ExplosionEmitter extends FlxEmitter {
  constructor(x: number = 0, y: number = 0) {
    super(x, y, 40); // 40 particles max

    // Particle velocity ranges (min to max)
    this.minParticleSpeed = new FlxPoint(-150, -200);
    this.maxParticleSpeed = new FlxPoint(150, -50);

    // Particle rotation
    this.minRotation = -360;
    this.maxRotation = 360;

    // Gravity
    this.gravity = 500;

    // Create 40 small 4x4 spark particles
    for (let i = 0; i < 40; i++) {
      const p = new FlxParticle();
      p.makeGraphic(4, 4, 0xfacc15);
      p.exists = false;
      this.add(p);
    }
  }

  public explode(x: number, y: number): void {
    this.x = x;
    this.y = y;
    // Emit 25 particles in a single burst with 1.2s lifespan
    this.start(true, 1.2, 0, 25);
  }
}
```

---

## Continuous Emitters (Smoke / Rain)

For continuous effects like rain or exhaust smoke:

```ts
const rain = new FlxEmitter(0, 0, 100);
rain.width = 640; // Emit across the entire screen width
rain.minParticleSpeed.set(-10, 300);
rain.maxParticleSpeed.set(10, 450);

for (let i = 0; i < 100; i++) {
  const drop = new FlxParticle();
  drop.makeGraphic(2, 8, 0x60a5fa);
  rain.add(drop);
}

// Start continuous emission: explode = false, lifespan = 2s, frequency = 0.05s
rain.start(false, 2.0, 0.05);
this.add(rain);
```
