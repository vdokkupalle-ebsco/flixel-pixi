# Meshes & Strips

`FlxStrip` allows rendering arbitrary 2D triangle strips, deformable textured ribbons, flags, and ropes using dynamic vertex buffers.

---

## Creating a Deformable Triangle Strip

```ts
import { FlxStrip } from 'flixel-pixi';

const strip = new FlxStrip(100, 100, 'assets/ribbon.png');

// Define vertices (x, y coordinates for each point)
strip.vertices = new Float32Array([0, 0, 50, 0, 0, 100, 50, 100]);

// UV texture coordinates (0.0 to 1.0)
strip.uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

// Indices forming triangles
strip.indices = new Uint16Array([0, 1, 2, 1, 3, 2]);

this.add(strip);
```

---

## Dynamic Vertex Wave Deformation

In `update()`:

```ts
override update(elapsed: number): void {
  super.update(elapsed);

  // Deform vertex Y positions dynamically for wave animation
  for (let i = 0; i < strip.vertices.length; i += 2) {
    strip.vertices[i + 1] += Math.sin(Date.now() * 0.005 + i) * 2;
  }
}
```
