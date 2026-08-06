import type { CodePair, FrameRecordData } from './frame-record';
import { FrameRecord } from './frame-record';
import { MouseRecord } from './mouse-record';

/** Structure of a serialized FlxReplay JSON file. @public */
export interface ReplayFileFormat {
  version: string;
  engineVersion: string;
  seed: number;
  frameCount: number;
  targetFps?: number;
  frames: FrameRecordData[];
}

/** Manages deterministic input recording, playback, and checksum verification. @public */
export class FlxReplay {
  seed: number;
  frame: number;
  frameCount: number;
  finished: boolean;
  diverged: boolean;
  divergenceFrame: number | null;
  divergenceInfo: string | null;
  frames: FrameRecord[];

  constructor() {
    this.seed = 0;
    this.frame = 0;
    this.frameCount = 0;
    this.finished = false;
    this.diverged = false;
    this.divergenceFrame = null;
    this.divergenceInfo = null;
    this.frames = [];
  }

  /** Initializes a clean replay container for recording starting with the specified RNG seed. */
  create(seed: number): void {
    this.destroy();
    this.seed = seed;
    this.frame = 0;
    this.frameCount = 0;
    this.finished = false;
    this.diverged = false;
    this.divergenceFrame = null;
    this.divergenceInfo = null;
    this.frames = [];
  }

  /** Records a single frame's input and optional state checksum. */
  recordFrame(
    frameIndex: number,
    keys: CodePair[] = [],
    mouse: MouseRecord | null = null,
    checksum: string | null = null,
  ): void {
    const record = new FrameRecord(frameIndex, keys, mouse, checksum);
    this.frames.push(record);
    this.frameCount = this.frames.length;
  }

  /** Retrieves the next FrameRecord for playback and advances the frame counter. */
  playNextFrame(): FrameRecord | null {
    if (this.frame >= this.frameCount) {
      this.finished = true;
      return null;
    }
    const currentFrame = this.frames[this.frame] ?? null;
    this.frame++;
    if (this.frame >= this.frameCount) {
      this.finished = true;
    }
    return currentFrame;
  }

  /** Rewinds playback to the first frame. */
  rewind(): void {
    this.frame = 0;
    this.finished = this.frameCount === 0;
    this.diverged = false;
    this.divergenceFrame = null;
    this.divergenceInfo = null;
  }

  /** Serializes the replay into a versioned JSON string. */
  save(): string {
    const output: ReplayFileFormat = {
      version: '1.0',
      engineVersion: 'flixel-pixi 1.0.0',
      seed: this.seed,
      frameCount: this.frameCount,
      frames: this.frames.map((f) => f.save()),
    };
    return JSON.stringify(output, null, 2);
  }

  /** Loads a replay from a JSON string or plain replay object. */
  load(data: string | ReplayFileFormat): void {
    this.destroy();
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data) as ReplayFileFormat;
        this.loadObject(parsed);
      } catch {
        // Fallback for legacy format string parsing
        this.loadLegacyText(data);
      }
    } else {
      this.loadObject(data);
    }
  }

  /** Internal loader for modern structured JSON replays. */
  private loadObject(data: ReplayFileFormat): void {
    this.seed = data.seed ?? 0;
    this.frames = Array.isArray(data.frames)
      ? data.frames.map((f) => {
          const rec = new FrameRecord();
          rec.load(f);
          return rec;
        })
      : [];
    this.frameCount = this.frames.length;
    this.rewind();
  }

  /** Internal parser for legacy AS3 Flixel plain-text replay format. */
  private loadLegacyText(text: string): void {
    const lines = text.split(/\r?\n/);
    this.frames = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.length === 0 || line.startsWith('#')) continue;

      if (line.startsWith('seed:')) {
        this.seed = Number(line.substring(5).trim()) || 0;
        continue;
      }

      // Legacy frame line format: [frame] [keys] [mouseX] [mouseY] [button] [wheel]
      const parts = line.split(/\s+/);
      if (parts.length >= 1) {
        const idx = Number(parts[0]);
        if (!isNaN(idx)) {
          const mouseX = parts.length > 2 ? Number(parts[2]) : 0;
          const mouseY = parts.length > 3 ? Number(parts[3]) : 0;
          const mouseBtn = parts.length > 4 ? Number(parts[4]) : 0;
          const mouseWheel = parts.length > 5 ? Number(parts[5]) : 0;

          const mouseRec =
            parts.length > 2
              ? new MouseRecord(mouseX, mouseY, mouseBtn, mouseWheel)
              : null;
          const frameRec = new FrameRecord(idx, [], mouseRec, null);
          this.frames.push(frameRec);
        }
      }
    }

    this.frameCount = this.frames.length;
    this.rewind();
  }

  /** Flags a divergence error when current engine checksum fails to match replay checksum. */
  flagDivergence(frameIndex: number, expected: string, actual: string): void {
    this.diverged = true;
    this.divergenceFrame = frameIndex;
    this.divergenceInfo = `State diverged at frame ${frameIndex}: expected checksum "${expected}", actual "${actual}".`;
  }

  /** Clears all stored frames and resets status flags. */
  destroy(): void {
    for (const f of this.frames) {
      f.destroy();
    }
    this.frames = [];
    this.frameCount = 0;
    this.frame = 0;
    this.finished = false;
    this.diverged = false;
    this.divergenceFrame = null;
    this.divergenceInfo = null;
  }
}
