import {
  FlxG,
  FlxGame,
  FlxSave,
  FlxSprite,
  FlxState,
  FlxText,
  LocalStorageBackend,
  WebAudioBackend,
} from '../../src';

/** Generate a synthetic sound AudioBuffer using Web Audio API */
function createSynthBuffer(
  ctx: AudioContext,
  type: 'coin' | 'jump' | 'music',
): AudioBuffer {
  const sampleRate = ctx.sampleRate;

  if (type === 'coin') {
    const duration = 0.25;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freq = t < 0.1 ? 987.77 : 1318.51; // B5 to E6
      const env = Math.exp(-t * 12);
      data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.4;
    }
    return buffer;
  } else if (type === 'jump') {
    const duration = 0.3;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freq = 150 + t * 800; // pitch sweep up
      const env = Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.4;
    }
    return buffer;
  } else {
    // Synth music loop (2 seconds)
    const duration = 2.0;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t * 4) % notes.length;
      const freq = notes[noteIndex]!;
      const noteTime = (t % 0.5);
      const env = Math.exp(-noteTime * 5);
      data[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t)) * env * 0.2;
    }
    return buffer;
  }
}

export interface PhaseNineMetrics {
  saveSlotName: string;
  coins: number;
  unlockedAudio: boolean;
  volume: number;
  muted: boolean;
}

export class PhaseNineState extends FlxState {
  save = new FlxSave();
  coins = 0;
  coinText!: FlxText;
  statusText!: FlxText;
  playerSprite!: FlxSprite;

  override create(): void {
    super.create();

    // Bind save data
    this.save.bind('smoke_slot', {
      version: 1,
      backend: new LocalStorageBackend(),
    });

    this.coins = (this.save.data?.coins as number) ?? 10;
    this.save.data!.coins = this.coins;
    this.save.flush();

    // Visual player sprite
    this.playerSprite = new FlxSprite(140, 100);
    this.playerSprite.makeGraphic(40, 40, 0xff0090e9);
    this.add(this.playerSprite);

    // Text overlays
    this.coinText = new FlxText(10, 10, 300, `Coins Saved: ${this.coins}`);
    this.coinText.size = 14;
    this.coinText.color = 0xffffff00;
    this.add(this.coinText);

    this.statusText = new FlxText(10, 30, 300, 'Phase 9: Audio & Save Active');
    this.statusText.size = 11;
    this.add(this.statusText);
  }

  addCoin(): void {
    this.coins += 1;
    if (this.save.data) {
      this.save.data.coins = this.coins;
      this.save.flush();
    }
    if (this.coinText) {
      this.coinText.text = `Coins Saved: ${this.coins}`;
    }
    // Bounce player sprite visually
    if (this.playerSprite) {
      this.playerSprite.y = 80;
    }
  }

  resetCoins(): void {
    this.coins = 0;
    if (this.save.data) {
      this.save.data.coins = 0;
      this.save.flush();
    }
    if (this.coinText) {
      this.coinText.text = `Coins Saved: ${this.coins}`;
    }
  }

  override update(): void {
    super.update();
    // Return player sprite smoothly to position
    if (this.playerSprite && this.playerSprite.y < 100) {
      this.playerSprite.y += 1;
    }
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
  addCoin(): void;
  resetCoins(): void;
  playCoinSound(): void;
  playJumpSound(): void;
  toggleMusic(): void;
  setVolume(vol: number): void;
  toggleMute(): boolean;
  game: FlxGame;
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

  void host;
  game.step(1 / 60);

  // Lazy Web Audio Context synth generator
  let tempCtx: AudioContext | null = null;
  const getCtx = () => {
    if (!tempCtx) tempCtx = new AudioContext();
    return tempCtx;
  };

  let musicPlaying = false;

  return {
    game,
    advance(steps: number) {
      for (let i = 0; i < steps; i++) {
        game.step(1 / 60);
      }
    },
    destroy() {
      if (tempCtx) tempCtx.close().catch(() => {});
      game.destroy();
    },
    get metrics(): PhaseNineMetrics {
      const state = game.state as PhaseNineState | null;
      return {
        saveSlotName: state?.save.name ?? '',
        coins: state?.coins ?? 0,
        unlockedAudio: audioBackend.unlocked,
        volume: FlxG.volume,
        muted: FlxG.mute,
      };
    },
    addCoin() {
      const state = game.state as PhaseNineState | null;
      state?.addCoin();
    },
    resetCoins() {
      const state = game.state as PhaseNineState | null;
      state?.resetCoins();
    },
    playCoinSound() {
      try {
        const buffer = createSynthBuffer(getCtx(), 'coin');
        FlxG.play(buffer, 0.8);
      } catch {
        // Fallback stub for environments without Web Audio
      }
    },
    playJumpSound() {
      try {
        const buffer = createSynthBuffer(getCtx(), 'jump');
        FlxG.play(buffer, 0.7);
      } catch {
        // Fallback stub
      }
    },
    toggleMusic() {
      if (musicPlaying) {
        FlxG.music?.stop();
        musicPlaying = false;
      } else {
        try {
          const buffer = createSynthBuffer(getCtx(), 'music');
          FlxG.playMusic(buffer, 0.5);
          musicPlaying = true;
        } catch {
          // Fallback stub
        }
      }
    },
    setVolume(vol: number) {
      FlxG.volume = vol;
    },
    toggleMute() {
      FlxG.mute = !FlxG.mute;
      return FlxG.mute;
    },
  };
}
