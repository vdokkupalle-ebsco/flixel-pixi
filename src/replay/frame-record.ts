import { MouseRecord } from './mouse-record';

/** Serializable key input state for a single replay frame. @public */
export interface CodePair {
  code: string;
  value: number;
}

/** Raw JSON representation of a FrameRecord. @public */
export interface FrameRecordData {
  frame: number;
  keys?: CodePair[];
  mouse?: { x: number; y: number; button: number; wheel: number } | null;
  checksum?: string | null;
}

/** Represents recorded inputs and state checksum for a single simulation frame. @public */
export class FrameRecord {
  frame: number;
  keys: CodePair[];
  mouse: MouseRecord | null;
  checksum: string | null;

  constructor(
    frame = 0,
    keys: CodePair[] = [],
    mouse: MouseRecord | null = null,
    checksum: string | null = null,
  ) {
    this.frame = frame;
    this.keys = keys;
    this.mouse = mouse;
    this.checksum = checksum;
  }

  /** Serializes the frame record into a plain JSON object. */
  save(): FrameRecordData {
    const data: FrameRecordData = {
      frame: this.frame,
    };
    if (this.keys.length > 0) {
      data.keys = this.keys.map((k) => ({ code: k.code, value: k.value }));
    }
    if (this.mouse !== null) {
      data.mouse = {
        x: this.mouse.x,
        y: this.mouse.y,
        button: this.mouse.button,
        wheel: this.mouse.wheel,
      };
    }
    if (this.checksum !== null) {
      data.checksum = this.checksum;
    }
    return data;
  }

  /** Loads data into this frame record from a plain object or serialized string. */
  load(data: string | FrameRecordData): void {
    const parsed: FrameRecordData =
      typeof data === 'string' ? (JSON.parse(data) as FrameRecordData) : data;
    this.frame = parsed.frame ?? 0;
    this.keys = Array.isArray(parsed.keys)
      ? parsed.keys.map((k) => ({
          code: String(k.code),
          value: Number(k.value),
        }))
      : [];
    if (parsed.mouse) {
      this.mouse = new MouseRecord(
        parsed.mouse.x,
        parsed.mouse.y,
        parsed.mouse.button,
        parsed.mouse.wheel,
      );
    } else {
      this.mouse = null;
    }
    this.checksum = parsed.checksum ?? null;
  }

  /** Releases resources associated with this frame record. */
  destroy(): void {
    this.keys = [];
    this.mouse = null;
    this.checksum = null;
  }
}
