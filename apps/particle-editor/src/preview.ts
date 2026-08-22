import {
  createBrowserGame,
  FlxG,
  FlxGraphic,
  FlxParticleEmitter,
  FlxState,
  parseParticlePreset,
  type BrowserGameApplication,
  type ParticleEmitterDiagnostics,
  type ParticlePresetV1,
  type PixelBuffer,
} from 'flixel-pixi';
import type { PreviewSettings } from './editor-store';

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 220;

let activeState: ParticlePreviewState | undefined;
let pendingPreset: ParticlePresetV1;
let pendingTexture: PixelBuffer;

function previewBackground(color: string): {
  camera: number;
  renderer: number;
} {
  const renderer = Number.parseInt(color.slice(1), 16);
  return { camera: (0xff00_0000 | renderer) >>> 0, renderer };
}

function setActiveState(state: ParticlePreviewState | undefined): void {
  activeState = state;
}

class ParticlePreviewState extends FlxState {
  readonly #burstEffects: {
    emitter: FlxParticleEmitter;
    graphic: FlxGraphic;
  }[] = [];
  #emitter: FlxParticleEmitter | undefined;
  #graphic: FlxGraphic | undefined;
  #effectSequence = 0;

  override create(): void {
    setActiveState(this);
    this.load(pendingPreset, pendingTexture);
  }

  get diagnostics(): ParticleEmitterDiagnostics | undefined {
    const diagnostics = [
      ...(this.#emitter === undefined ? [] : [this.#emitter.diagnostics]),
      ...this.#burstEffects.map(({ emitter }) => emitter.diagnostics),
    ];
    const latest = diagnostics.at(-1);
    if (latest === undefined) return undefined;
    return {
      ...latest,
      activeCount: diagnostics.reduce(
        (total, item) => total + item.activeCount,
        0,
      ),
      capacity: diagnostics.reduce((total, item) => total + item.capacity, 0),
      droppedCount: diagnostics.reduce(
        (total, item) => total + item.droppedCount,
        0,
      ),
      emittedCount: diagnostics.reduce(
        (total, item) => total + item.emittedCount,
        0,
      ),
      emitting: diagnostics.some((item) => item.emitting),
      pooledCount: diagnostics.reduce(
        (total, item) => total + item.pooledCount,
        0,
      ),
    };
  }

  load(
    preset: ParticlePresetV1,
    texture: PixelBuffer,
    source?: { x: number; y: number },
  ): void {
    if (this.#emitter !== undefined) {
      this.remove(this.#emitter, true);
      this.#emitter.destroy();
    }
    this.#graphic?.destroy();
    this.#graphic = FlxGraphic.fromPixels(texture, 'particle-editor-texture');
    const verticalVelocity = preset.motion.velocity.y;
    const originY =
      verticalVelocity.min >= 0 ? 12 : verticalVelocity.max <= 0 ? 174 : 110;
    this.#emitter = new FlxParticleEmitter(
      preset,
      this.#graphic,
      source?.x ?? PREVIEW_WIDTH / 2,
      source?.y ?? originY,
    );
    this.add(this.#emitter);
    this.#emitter.start();
  }

  moveSource(x: number, y: number): void {
    if (this.#emitter === undefined) return;
    this.#emitter.x = x;
    this.#emitter.y = y;
  }

  spawnBurst(
    preset: ParticlePresetV1,
    texture: PixelBuffer,
    source?: { x: number; y: number },
  ): void {
    const graphic = FlxGraphic.fromPixels(
      texture,
      `particle-editor-burst-${String(this.#effectSequence)}`,
    );
    this.#effectSequence += 1;
    const emitter = new FlxParticleEmitter(
      preset,
      graphic,
      source?.x ?? PREVIEW_WIDTH / 2,
      source?.y ?? PREVIEW_HEIGHT / 2,
    );
    this.#burstEffects.push({ emitter, graphic });
    this.add(emitter);
    emitter.start();
  }

  pause(): void {
    this.#emitter?.pause();
  }

  resume(): void {
    this.#emitter?.resume();
  }

  stop(clear = false): void {
    this.#emitter?.stop(clear);
  }

  override update(): void {
    super.update();
    for (let index = this.#burstEffects.length - 1; index >= 0; index -= 1) {
      const effect = this.#burstEffects[index];
      if (
        effect === undefined ||
        effect.emitter.diagnostics.emitting ||
        effect.emitter.diagnostics.activeCount > 0
      ) {
        continue;
      }
      this.remove(effect.emitter, true);
      effect.emitter.destroy();
      effect.graphic.destroy();
      this.#burstEffects.splice(index, 1);
    }
  }

  override destroy(): void {
    if (activeState === this) setActiveState(undefined);
    for (const { emitter, graphic } of this.#burstEffects) {
      emitter.destroy();
      graphic.destroy();
    }
    this.#burstEffects.length = 0;
    this.#graphic = undefined;
    this.#emitter = undefined;
    super.destroy();
  }
}

export interface ParticlePreviewController {
  burst(): void;
  destroy(): void;
  load(preset: ParticlePresetV1, texture: PixelBuffer): void;
  pause(): void;
  restart(): void;
  resume(): void;
  setBackground(color: string): void;
  setPointerMode(mode: PreviewSettings['pointerMode']): void;
  setTimeScale(scale: number): void;
}

function burstPreset(preset: ParticlePresetV1): ParticlePresetV1 {
  if (preset.emission.mode === 'burst') return preset;
  return parseParticlePreset({
    ...structuredClone(preset),
    emission: {
      count: Math.max(1, Math.round(preset.emission.rate * 0.5)),
      mode: 'burst',
    },
  });
}

function trailPreset(preset: ParticlePresetV1): ParticlePresetV1 {
  if (preset.emission.mode === 'continuous') return preset;
  return parseParticlePreset({
    ...structuredClone(preset),
    emission: {
      mode: 'continuous',
      rate: Math.max(
        12,
        Math.min(120, Math.round(preset.emission.count * 0.65)),
      ),
    },
  });
}

export async function createParticlePreview(
  host: HTMLElement,
  initialPreset: ParticlePresetV1,
  texture: PixelBuffer,
  onDiagnostics: (diagnostics: ParticleEmitterDiagnostics) => void,
): Promise<ParticlePreviewController> {
  pendingPreset = initialPreset;
  pendingTexture = texture;
  const application: BrowserGameApplication = await createBrowserGame({
    accessibility: false,
    autoPause: false,
    backgroundColor: 0x07101c,
    height: 220,
    host,
    initialState: ParticlePreviewState,
    preloader: false,
    scaling: 'fit',
    width: 320,
  });
  const unsubscribe = application.onFrame(() => {
    const diagnostics = activeState?.diagnostics;
    if (diagnostics !== undefined) onDiagnostics(diagnostics);
  });
  const canvas = application.app.canvas as HTMLCanvasElement;
  let pointerMode: PreviewSettings['pointerMode'] = 'auto';
  let draggingPointer: number | undefined;

  const pointerPosition = (event: PointerEvent): { x: number; y: number } => {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    return {
      x: Math.max(
        0,
        Math.min(
          PREVIEW_WIDTH,
          ((event.clientX - bounds.left) / width) * PREVIEW_WIDTH,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          PREVIEW_HEIGHT,
          ((event.clientY - bounds.top) / height) * PREVIEW_HEIGHT,
        ),
      ),
    };
  };
  const endDrag = (event: PointerEvent): void => {
    if (event.pointerId !== draggingPointer) return;
    activeState?.stop();
    draggingPointer = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  const handlePointerDown = (event: PointerEvent): void => {
    if (pointerMode === 'auto') return;
    event.preventDefault();
    const source = pointerPosition(event);
    if (pointerMode === 'burst') {
      activeState?.spawnBurst(
        burstPreset(pendingPreset),
        pendingTexture,
        source,
      );
      return;
    }
    draggingPointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    activeState?.load(trailPreset(pendingPreset), pendingTexture, source);
  };
  const handlePointerMove = (event: PointerEvent): void => {
    if (pointerMode !== 'trail' || event.pointerId !== draggingPointer) return;
    event.preventDefault();
    const source = pointerPosition(event);
    activeState?.moveSource(source.x, source.y);
  };
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  FlxG.bgColor = previewBackground('#07101c').camera;

  return {
    burst() {
      activeState?.spawnBurst(burstPreset(pendingPreset), pendingTexture);
    },
    destroy() {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      unsubscribe();
      FlxG.timeScale = 1;
      application.destroy();
    },
    load(preset, nextTexture) {
      pendingPreset = preset;
      pendingTexture = nextTexture;
      activeState?.load(preset, nextTexture);
      if (pointerMode !== 'auto') activeState?.stop(true);
      application.syncRenderer();
    },
    pause() {
      activeState?.pause();
    },
    restart() {
      activeState?.load(pendingPreset, pendingTexture);
      if (pointerMode !== 'auto') activeState?.stop(true);
    },
    resume() {
      activeState?.resume();
    },
    setBackground(color) {
      const background = previewBackground(color);
      application.app.renderer.background.color = background.renderer;
      FlxG.bgColor = background.camera;
    },
    setPointerMode(mode) {
      pointerMode = mode;
      draggingPointer = undefined;
      canvas.style.cursor = mode === 'auto' ? 'default' : 'crosshair';
      canvas.style.touchAction = mode === 'auto' ? 'auto' : 'none';
      if (mode === 'auto') activeState?.load(pendingPreset, pendingTexture);
      else activeState?.stop(true);
    },
    setTimeScale(scale) {
      FlxG.timeScale = scale;
    },
  };
}
