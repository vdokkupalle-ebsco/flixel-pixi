import {
  createBrowserGame,
  FlxGraphic,
  FlxParticleEmitter,
  FlxState,
  type BrowserGameApplication,
  type ParticleEmitterDiagnostics,
} from 'flixel-pixi';

import { starterPreset } from './preset';

let activeEmitter: FlxParticleEmitter | undefined;
let sparkGraphic: FlxGraphic | undefined;

class ParticlePreviewState extends FlxState {
  override create(): void {
    sparkGraphic = FlxGraphic.fromPixels(
      {
        data: new Uint32Array([
          0x00000000, 0x66f7ffff, 0x00000000, 0x66f7ffff, 0xffffffff,
          0x66f7ffff, 0x00000000, 0x66f7ffff, 0x00000000,
        ]),
        height: 3,
        width: 3,
      },
      'particle-editor-spark',
    );
    activeEmitter = new FlxParticleEmitter(
      starterPreset,
      sparkGraphic,
      160,
      188,
    );
    this.add(activeEmitter);
    activeEmitter.start();
  }

  override destroy(): void {
    activeEmitter = undefined;
    sparkGraphic?.destroy();
    sparkGraphic = undefined;
    super.destroy();
  }
}

export interface ParticlePreviewController {
  destroy(): void;
  pause(): void;
  restart(): void;
  resume(): void;
}

export async function createParticlePreview(
  host: HTMLElement,
  onDiagnostics: (diagnostics: ParticleEmitterDiagnostics) => void,
): Promise<ParticlePreviewController> {
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
    if (activeEmitter !== undefined) onDiagnostics(activeEmitter.diagnostics);
  });

  return {
    destroy() {
      unsubscribe();
      application.destroy();
    },
    pause() {
      activeEmitter?.pause();
    },
    restart() {
      activeEmitter?.start(true);
    },
    resume() {
      activeEmitter?.resume();
    },
  };
}
