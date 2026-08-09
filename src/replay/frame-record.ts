import { MouseRecord } from './mouse-record';
import type { FlxGamepadFrameRecord } from '../input/flx-gamepad';
import type { FlxTouchFrameRecord } from '../input/flx-touch';

/** Serializable key input state for a single replay frame. @public */
export interface CodePair {
  code: number;
  value: number;
}

/** Raw JSON representation of a FrameRecord. @public */
export interface FrameRecordData {
  frame: number;
  keys?: CodePair[];
  mouse?: { x: number; y: number; button: number; wheel: number } | null;
  gamepads?: FlxGamepadFrameRecord[];
  touches?: FlxTouchFrameRecord[];
  checksum?: string | null;
}

/** Represents recorded inputs and state checksum for a single simulation frame. @public */
export class FrameRecord {
  frame: number;
  keys: CodePair[];
  mouse: MouseRecord | null;
  checksum: string | null;
  gamepads: FlxGamepadFrameRecord[];
  touches: FlxTouchFrameRecord[];

  constructor(
    frame = 0,
    keys: CodePair[] = [],
    mouse: MouseRecord | null = null,
    checksum: string | null = null,
    gamepads: FlxGamepadFrameRecord[] = [],
    touches: FlxTouchFrameRecord[] = [],
  ) {
    this.frame = frame;
    this.keys = keys;
    this.mouse = mouse;
    this.checksum = checksum;
    this.gamepads = gamepads;
    this.touches = touches;
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
    if (this.gamepads.length > 0) {
      data.gamepads = this.gamepads.map((gamepad) => ({
        axes: [...gamepad.axes],
        buttons: gamepad.buttons.map((button) => ({ ...button })),
        id: gamepad.id,
        index: gamepad.index,
        mapping: gamepad.mapping,
        uid: gamepad.uid,
      }));
    }
    if (this.touches.length > 0)
      data.touches = this.touches.map((touch) => ({ ...touch }));
    return data;
  }

  /** Loads data into this frame record from a plain object or serialized string. */
  load(data: string | FrameRecordData): void {
    const parsed: FrameRecordData =
      typeof data === 'string' ? (JSON.parse(data) as FrameRecordData) : data;
    this.frame = parsed.frame ?? 0;
    this.keys = Array.isArray(parsed.keys)
      ? parsed.keys.map((k) => ({
          code: Number(k.code),
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
    this.gamepads = Array.isArray(parsed.gamepads)
      ? parsed.gamepads.map((gamepad) => ({
          axes: gamepad.axes.map(Number),
          buttons: gamepad.buttons.map((button) => ({
            state: Number(button.state),
            value: Number(button.value),
          })),
          id: String(gamepad.id),
          index: Number(gamepad.index),
          mapping: String(gamepad.mapping),
          uid: Number(gamepad.uid),
        }))
      : [];
    this.touches = Array.isArray(parsed.touches)
      ? parsed.touches.map((touch) => ({
          age: Number(touch.age),
          cancelled: Boolean(touch.cancelled),
          isPrimary: Boolean(touch.isPrimary),
          pointerId: Number(touch.pointerId),
          pressure: Number(touch.pressure),
          startX: Number(touch.startX),
          startY: Number(touch.startY),
          state: Number(touch.state),
          x: Number(touch.x),
          y: Number(touch.y),
        }))
      : [];
  }

  /** Releases resources associated with this frame record. */
  destroy(): void {
    this.keys = [];
    this.mouse = null;
    this.checksum = null;
    this.gamepads = [];
    this.touches = [];
  }
}
