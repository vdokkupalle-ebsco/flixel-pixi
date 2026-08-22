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

let activeState: ParticlePreviewState | undefined;
let pendingPreset: ParticlePresetV1;
let pendingTexture: PixelBuffer;

function setActiveState(state: ParticlePreviewState | undefined): void {
  activeState = state;
}

class ParticlePreviewState extends FlxState {
  #emitter: FlxParticleEmitter | undefined;
  #graphic: FlxGraphic | undefined;

  override create(): void {
    setActiveState(this);
    this.load(pendingPreset, pendingTexture);
  }

  get diagnostics(): ParticleEmitterDiagnostics | undefined {
    return this.#emitter?.diagnostics;
  }

  load(preset: ParticlePresetV1, texture: PixelBuffer): void {
    if (this.#emitter !== undefined) {
      this.remove(this.#emitter, true);
      this.#emitter.destroy();
    }
    this.#graphic?.destroy();
    this.#graphic = FlxGraphic.fromPixels(texture, 'particle-editor-texture');
    const fallsDown = preset.motion.velocity.y.min > 0;
    this.#emitter = new FlxParticleEmitter(
      preset,
      this.#graphic,
      160,
      fallsDown ? 12 : 174,
    );
    this.add(this.#emitter);
    this.#emitter.start();
  }

  pause(): void {
    this.#emitter?.pause();
  }

  resume(): void {
    this.#emitter?.resume();
  }

  override destroy(): void {
    if (activeState === this) setActiveState(undefined);
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
  setTimeScale(scale: number): void;
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

  return {
    burst() {
      const preset =
        pendingPreset.emission.mode === 'burst'
          ? pendingPreset
          : parseParticlePreset({
              ...structuredClone(pendingPreset),
              emission: {
                count: Math.max(
                  1,
                  Math.round(pendingPreset.emission.rate * 0.5),
                ),
                mode: 'burst',
              },
            });
      activeState?.load(preset, pendingTexture);
    },
    destroy() {
      unsubscribe();
      application.destroy();
      FlxG.timeScale = 1;
    },
    load(preset, nextTexture) {
      pendingPreset = preset;
      pendingTexture = nextTexture;
      activeState?.load(preset, nextTexture);
      application.syncRenderer();
    },
    pause() {
      activeState?.pause();
    },
    restart() {
      activeState?.load(pendingPreset, pendingTexture);
    },
    resume() {
      activeState?.resume();
    },
    setBackground(color) {
      application.app.renderer.background.color = Number.parseInt(
        color.slice(1),
        16,
      );
    },
    setTimeScale(scale) {
      FlxG.timeScale = scale;
    },
  };
}
