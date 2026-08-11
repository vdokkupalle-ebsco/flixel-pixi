import {
  FlxG,
  FlxSprite,
  FlxState,
  FlxText,
  type FlxSound,
  type FlxSoundGroup,
  type FlxSoundOffscreenBehavior,
} from '../../../src';

const WORLD_WIDTH = 1_600;
const WORLD_HEIGHT = 360;
const SOURCE_RADIUS = 340;

interface AmbientSource {
  label: FlxText;
  name: string;
  sound: FlxSound;
  sprite: FlxSprite;
}

const AMBIENT_AUDIO_ASSET_URLS = {
  alarm: new URL('./assets/emergency-alarm.wav', import.meta.url).href,
  clock: new URL('./assets/clock-timer.wav', import.meta.url).href,
  waterfall: new URL('./assets/water-flowing-loop.wav', import.meta.url).href,
} as const;

let ambientAudioSources: Record<keyof typeof AMBIENT_AUDIO_ASSET_URLS, string> =
  AMBIENT_AUDIO_ASSET_URLS;

let audioPreload: Promise<void> | null = null;

/** Fetch every ambient track into the browser cache before the state starts. */
export function preloadAmbientAudio(
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (audioPreload) return audioPreload;

  let completed = 0;
  const entries = Object.entries(AMBIENT_AUDIO_ASSET_URLS) as [
    keyof typeof AMBIENT_AUDIO_ASSET_URLS,
    string,
  ][];
  audioPreload = Promise.all(
    entries.map(async ([name, url]) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to preload ambient audio: ${response.status}`);
      }
      const blob = await response.blob();
      completed += 1;
      onProgress?.(completed / entries.length);
      return [name, blob] as const;
    }),
  )
    .then((blobs) => {
      ambientAudioSources = Object.fromEntries(
        blobs.map(([name, blob]) => [name, URL.createObjectURL(blob)]),
      ) as Record<keyof typeof AMBIENT_AUDIO_ASSET_URLS, string>;
    })
    .catch((error: unknown) => {
      audioPreload = null;
      throw error;
    });
  return audioPreload;
}

export interface AmbientAudioSnapshot {
  ambientMuted: boolean;
  masterMuted: boolean;
  autoTour: boolean;
  cameraX: number;
  offscreen: FlxSoundOffscreenBehavior;
  playerX: number;
  sources: {
    amplitude: number;
    gain: number;
    name: string;
    pan: number;
    visible: boolean;
    x: number;
  }[];
}

/** Spatial ambient-audio showcase with deterministic camera traversal. */
export class AmbientAudioState extends FlxState {
  readonly player = new FlxSprite(48, 248);
  readonly sources: AmbientSource[] = [];
  ambientGroup!: FlxSoundGroup;
  autoTour = true;
  offscreen: FlxSoundOffscreenBehavior = 'pause';
  #tourTime = 0;
  #hud!: FlxText;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    FlxG.camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT, true);

    const sky = new FlxSprite(0, 0);
    sky.makeGraphic(WORLD_WIDTH, WORLD_HEIGHT, 0xff07111f);
    this.add(sky);
    const ground = new FlxSprite(0, 292);
    ground.makeGraphic(WORLD_WIDTH, 68, 0xff12263a);
    this.add(ground);
    for (let x = 0; x < WORLD_WIDTH; x += 80) {
      const marker = new FlxSprite(x, 290);
      marker.makeGraphic(40, 2, 0xff28465f);
      this.add(marker);
    }

    this.ambientGroup = FlxG.soundGroup.createChild('ambient-demo');
    this.ambientGroup.volume = 0.8;

    this.#addSource(
      'Waterfall',
      220,
      0xff38bdf8,
      ambientAudioSources.waterfall,
    );
    this.#addSource('Clock Tower', 790, 0xfff59e0b, ambientAudioSources.clock);
    this.#addSource(
      'Alarm Beacon',
      1_360,
      0xffa78bfa,
      ambientAudioSources.alarm,
    );

    this.player.makeGraphic(30, 42, 0xff4ade80);
    this.player.moves = false;
    this.add(this.player);
    FlxG.camera.follow(this.player);

    this.#hud = new FlxText(12, 10, 616, '');
    this.#hud.setFormat(undefined, 11, 0xffe2e8f0, 'left');
    this.#hud.scrollFactor.x = 0;
    this.#hud.scrollFactor.y = 0;
    this.add(this.#hud);
  }

  setAutoTour(enabled: boolean): void {
    this.autoTour = enabled;
  }

  setPlayerX(x: number): void {
    this.autoTour = false;
    this.player.x = Math.max(0, Math.min(WORLD_WIDTH - this.player.width, x));
  }

  setOffscreen(behavior: FlxSoundOffscreenBehavior): void {
    this.offscreen = behavior;
    for (const source of this.sources) this.#attach(source);
  }

  toggleMute(): boolean {
    this.ambientGroup.mute = !this.ambientGroup.mute;
    return this.ambientGroup.mute;
  }

  snapshot(): AmbientAudioSnapshot {
    const playerCenter = this.player.x + this.player.width / 2;
    return {
      ambientMuted: this.ambientGroup.mute,
      masterMuted: FlxG.mute,
      autoTour: this.autoTour,
      cameraX: FlxG.camera.scroll.x,
      offscreen: this.offscreen,
      playerX: this.player.x,
      sources: this.sources.map((source) => {
        const sourceCenter = source.sprite.x + source.sprite.width / 2;
        return {
          amplitude: source.sound.amplitude,
          gain: source.sound.effectiveVolume,
          name: source.name,
          pan: Math.max(
            -1,
            Math.min(1, (sourceCenter - playerCenter) / SOURCE_RADIUS),
          ),
          visible: source.sprite.onScreen(FlxG.camera),
          x: source.sprite.x,
        };
      }),
    };
  }

  override update(): void {
    const manual =
      FlxG.keys.pressed('LEFT') ||
      FlxG.keys.pressed('RIGHT') ||
      FlxG.keys.pressed('A') ||
      FlxG.keys.pressed('D');
    if (manual) this.autoTour = false;

    if (this.autoTour) {
      this.#tourTime += FlxG.elapsed;
      const travel = (this.#tourTime * 105) % (2 * (WORLD_WIDTH - 96));
      this.player.x =
        travel <= WORLD_WIDTH - 96
          ? 48 + travel
          : 48 + 2 * (WORLD_WIDTH - 96) - travel;
    } else {
      const direction =
        (FlxG.keys.pressed('RIGHT') || FlxG.keys.pressed('D') ? 1 : 0) -
        (FlxG.keys.pressed('LEFT') || FlxG.keys.pressed('A') ? 1 : 0);
      this.player.x = Math.max(
        0,
        Math.min(
          WORLD_WIDTH - this.player.width,
          this.player.x + direction * 180 * FlxG.elapsed,
        ),
      );
    }

    if (FlxG.keys.justPressed('T')) this.autoTour = !this.autoTour;
    if (FlxG.keys.justPressed('M')) this.toggleMute();

    const snapshot = this.snapshot();
    const readings = snapshot.sources
      .map(
        (source) =>
          `${source.name} ${source.visible ? 'VIEW' : 'off'} gain ${source.gain.toFixed(2)} pan ${source.pan.toFixed(2)}`,
      )
      .join('  ·  ');
    this.#hud.text = `AMBIENT AUDIO — A/D or ←/→ move · T tour · M mute\n${readings}`;
    for (const source of this.sources) {
      const detail = snapshot.sources.find((item) => item.name === source.name);
      source.label.text = `${source.name}\ngain ${detail?.gain.toFixed(2) ?? '0.00'}  pan ${detail?.pan.toFixed(2) ?? '0.00'}`;
    }

    super.update();
  }

  override destroy(): void {
    this.ambientGroup.destroy();
    this.sources.length = 0;
    super.destroy();
  }

  #addSource(name: string, x: number, color: number, url: string): void {
    const range = new FlxSprite(x - SOURCE_RADIUS + 18, 281);
    range.makeGraphic(SOURCE_RADIUS * 2, 3, color);
    range.alpha = 0.28;
    this.add(range);

    const sprite = new FlxSprite(x, 224);
    sprite.makeGraphic(36, 56, color);
    this.add(sprite);
    const label = new FlxText(x - 72, 176, 180, name);
    label.setFormat(undefined, 11, 0xfff8fafc, 'center');
    this.add(label);

    const sound = FlxG.stream(url, 0.9, true, false, this.ambientGroup);
    const source = { label, name, sound, sprite };
    this.sources.push(source);
    this.#attach(source);
  }

  #attach(source: AmbientSource): void {
    source.sound.attachTo(source.sprite, {
      listener: this.player,
      margin: 32,
      offscreen: this.offscreen,
      pan: true,
      radius: SOURCE_RADIUS,
      viewport: 'visible',
    });
  }
}
