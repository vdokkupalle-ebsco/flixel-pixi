import {
  FlxG,
  FlxGame,
  FlxSave,
  FlxState,
  LocalStorageBackend,
  WebAudioBackend,
} from '../../src';

export interface PhaseNineMetrics {
  saveSlotName: string;
  coins: number;
  unlockedAudio: boolean;
  volume: number;
}

export class PhaseNineState extends FlxState {
  save = new FlxSave();
  coins = 0;

  override create(): void {
    super.create();
    this.save.bind('smoke_slot', {
      version: 1,
      backend: new LocalStorageBackend(),
    });

    this.coins = (this.save.data?.coins as number) ?? 10;
    this.coins += 1;
    this.save.data!.coins = this.coins;
    this.save.flush();
  }

  override destroy(): void {
    this.save.close();
    super.destroy();
  }
}

export interface PhaseNineApplication {
  advance(steps: number): void;
  destroy(): void;
  metrics: PhaseNineMetrics;
  getCoins(): number;
}

export async function createPhaseNineApplication(
  host: HTMLElement,
): Promise<PhaseNineApplication> {
  const audioBackend = new WebAudioBackend();
  audioBackend.unlockAudio();

  const game = new FlxGame(
    320,
    240,
    PhaseNineState,
    1,
    60,
    30,
    false,
    {},
    audioBackend,
  );

  // Mount element if needed
  void host;

  // Step once to execute state.create()
  game.step(1 / 60);

  return {
    advance(steps: number) {
      for (let i = 0; i < steps; i++) {
        game.step(1 / 60);
      }
    },
    destroy() {
      game.destroy();
    },
    get metrics(): PhaseNineMetrics {
      const state = game.state as PhaseNineState | null;
      return {
        saveSlotName: state?.save.name ?? '',
        coins: state?.coins ?? 0,
        unlockedAudio: audioBackend.unlocked,
        volume: FlxG.volume,
      };
    },
    getCoins() {
      return (game.state as PhaseNineState | null)?.coins ?? 0;
    },
  };
}
