# Introduction to Flixel-Pixi

**Flixel-Pixi** is an open-source, browser-native TypeScript game engine that ports AdamAtomic's legendary ActionScript 3 Flixel engine onto **PixiJS v8**.

It brings the deterministic physics, state hierarchy, group management, and rapid prototyping workflows of classic 2D indie games to modern browsers, powered by WebGL and WebGPU rendering.

---

## The Philosophy of Flixel

Originally created for Flash by Adam 'Atomic' Saltsman, Flixel powered indie classics such as _Canabalt_, _VVVVVV_, _Super Meat Boy (prototype)_, and _Monster Trucks Nitro_.

Flixel's core design principles remain timeless:

1. **Deterministic Fixed-Step Simulation**: Gameplay logic never depends on fluctuating frame rates. A 60 FPS physics calculation advances identically whether rendered on a 60Hz laptop, 144Hz gaming monitor, or low-end mobile phone.
2. **State-Driven Architecture**: Games are structured into modular, self-contained `FlxState` and `FlxSubState` classes for menus, levels, and modal pause dialogs.
3. **Simplicity over Ceremony**: Add sprites, detect collisions, play sounds, and read controller inputs with minimal boilerplate.
4. **Clean Object Hierarchy**: Everything in the game world inherits from `FlxBasic` and `FlxObject`.

---

## Why Flixel on PixiJS v8?

While Flash has ended and web standards evolved, PixiJS has become the premier 2D rendering pipeline on the web.

Flixel-Pixi bridges both worlds by **decoupling game simulation from GPU rendering**:

```
┌───────────────────────────────────────────────────────────┐
│                      GAMEPLAY LAYER                       │
│  FlxState • FlxSprite • FlxGroup • QuadTree • FlxTween    │
│            (Deterministic Fixed Timestep: 1/60s)          │
└─────────────────────────────┬─────────────────────────────┘
                              │ World Sync
                              ▼
┌───────────────────────────────────────────────────────────┐
│                     RENDER ADAPTERS                       │
│  FlxSpriteRenderHandle • FlxGraphicsRenderHandle • Camera │
└─────────────────────────────┬─────────────────────────────┘
                              │ Draw Calls
                              ▼
┌───────────────────────────────────────────────────────────┐
│                      PIXIJS V8 ENGINE                     │
│      Batched WebGL / WebGPU Pipeline • Filters • Shaders  │
└───────────────────────────────────────────────────────────┘
```

### Key Advantages

- **Zero Memory Leaks**: Strict lifecycle ownership contracts and soak-tested teardown routines.
- **Modern Input**: Out-of-the-box support for Keyboard, Mouse, Touch, Gamepads, Virtual Sticks, and Action Rebinding.
- **Universal Browser Compatibility**: Works across modern desktop and mobile browsers following the baseline target.
- **Production Ready**: 400+ unit tests, browser compatibility suites, and performance budget verification.

---

## Next Steps

- Follow the [Installation & Quick Start](/guide/getting-started) guide to install Flixel-Pixi.
- Build a complete mini-game in [Creating Your First Game](/guide/first-game).
- Explore the [Examples Gallery](/examples/) to see real running games.
