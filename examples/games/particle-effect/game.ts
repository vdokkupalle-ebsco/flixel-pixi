import {
  FlxG,
  FlxParticleEffect,
  FlxSprite,
  FlxState,
  FlxText,
  parseParticleEffect,
  type ParticleEffectDocumentV1,
} from '../../../src';

let campfireDocument: ParticleEffectDocumentV1 | undefined;

export function registerCampfireDocument(value: unknown): void {
  campfireDocument = parseParticleEffect(value);
}

export interface ParticleEffectSnapshot {
  activeCount: number;
  emitting: boolean;
  emittedCount: number;
  layerCount: number;
  paused: boolean;
  x: number;
  y: number;
}

/** Playable runtime example for a Particle Editor multi-emitter export. */
export class ParticleEffectState extends FlxState {
  effect!: FlxParticleEffect;
  label!: FlxText;
  paused = false;

  override create(): void {
    super.create();
    if (campfireDocument === undefined) {
      throw new Error('The campfire effect document was not preloaded.');
    }

    FlxG.camera.bgColor = 0xff07111f;

    const floorGlow = new FlxSprite(190, 326);
    floorGlow.makeGraphic(260, 18, 0xff14283b);
    this.add(floorGlow);

    const logLeft = new FlxSprite(278, 302);
    logLeft.makeGraphic(84, 14, 0xff7c3f2b);
    logLeft.angle = 12;
    this.add(logLeft);

    const logRight = new FlxSprite(278, 302);
    logRight.makeGraphic(84, 14, 0xff9a5134);
    logRight.angle = -12;
    this.add(logRight);

    this.effect = FlxParticleEffect.fromAssets(campfireDocument, {
      autoStart: true,
      x: 320,
      y: 304,
    });
    this.add(this.effect);

    this.label = new FlxText(18, 16, 604, '');
    this.label.setFormat(undefined, 13, 0xffd8f3ff, 'left');
    this.add(this.label);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.effect.pause();
    else this.effect.resume();
  }

  resetEffect(): void {
    this.effect.reset();
    this.effect.start();
    this.paused = false;
  }

  moveTo(x: number, y: number): void {
    this.effect.setPosition(
      Math.max(48, Math.min(FlxG.width - 48, x)),
      Math.max(120, Math.min(FlxG.height - 42, y)),
    );
  }

  snapshot(): ParticleEffectSnapshot {
    const diagnostics = this.effect.diagnostics;
    return {
      activeCount: diagnostics.activeCount,
      emittedCount: diagnostics.emittedCount,
      emitting: diagnostics.emitting,
      layerCount: this.effect.layers.length,
      paused: this.paused,
      x: this.effect.x,
      y: this.effect.y,
    };
  }

  override update(): void {
    const movement = 150 * FlxG.elapsed;
    let x = this.effect.x;
    let y = this.effect.y;
    if (FlxG.keys.pressed('LEFT')) x -= movement;
    if (FlxG.keys.pressed('RIGHT')) x += movement;
    if (FlxG.keys.pressed('UP')) y -= movement;
    if (FlxG.keys.pressed('DOWN')) y += movement;
    if (x !== this.effect.x || y !== this.effect.y) this.moveTo(x, y);

    if (FlxG.mouse.justPressed()) {
      const pointer = FlxG.mouse.getGlobalPosition();
      this.moveTo(pointer.x, pointer.y);
    }
    if (FlxG.keys.justPressed('P')) this.setPaused(!this.paused);
    if (FlxG.keys.justPressed('R')) this.resetEffect();

    const diagnostics = this.effect.diagnostics;
    this.label.text = [
      'COMPOSED CAMPFIRE · 3 EXPORTED LAYERS',
      'click / tap to move · arrows to nudge · P pause · R reset',
      `${this.paused ? 'PAUSED' : 'RUNNING'} · ${String(diagnostics.activeCount)} active · ${String(diagnostics.emittedCount)} emitted`,
    ].join('\n');

    super.update();
  }
}
