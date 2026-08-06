import { Input } from './input';

/** Minimal browser keyboard event shape accepted by the deterministic queue. @public */
export interface FlxKeyboardEventLike {
  readonly code?: string;
  readonly key?: string;
  readonly keyCode?: number;
  readonly repeat?: boolean;
}

const LEGACY_KEYS = [
  ['BACKSPACE', 8],
  ['TAB', 9],
  ['ENTER', 13],
  ['SHIFT', 16],
  ['CONTROL', 17],
  ['ALT', 18],
  ['CAPSLOCK', 20],
  ['ESCAPE', 27],
  ['SPACE', 32],
  ['PAGEUP', 33],
  ['PAGEDOWN', 34],
  ['END', 35],
  ['HOME', 36],
  ['LEFT', 37],
  ['UP', 38],
  ['RIGHT', 39],
  ['DOWN', 40],
  ['INSERT', 45],
  ['DELETE', 46],
  ['NUMPADPLUS', 107],
  ['NUMPADMINUS', 109],
  ['NUMPADPERIOD', 110],
  ['NUMPADSLASH', 111],
  ['SEMICOLON', 186],
  ['PLUS', 187],
  ['COMMA', 188],
  ['MINUS', 189],
  ['PERIOD', 190],
  ['SLASH', 191],
  ['LBRACKET', 219],
  ['BACKSLASH', 220],
  ['RBRACKET', 221],
  ['QUOTE', 222],
] as const;

/** AS3-compatible keyboard names backed by physical DOM `code` mappings. @public */
export class Keyboard extends Input {
  declare readonly ESCAPE: boolean;
  declare readonly F1: boolean;
  declare readonly F2: boolean;
  declare readonly F3: boolean;
  declare readonly F4: boolean;
  declare readonly F5: boolean;
  declare readonly F6: boolean;
  declare readonly F7: boolean;
  declare readonly F8: boolean;
  declare readonly F9: boolean;
  declare readonly F10: boolean;
  declare readonly F11: boolean;
  declare readonly F12: boolean;
  declare readonly ZERO: boolean;
  declare readonly ONE: boolean;
  declare readonly TWO: boolean;
  declare readonly THREE: boolean;
  declare readonly FOUR: boolean;
  declare readonly FIVE: boolean;
  declare readonly SIX: boolean;
  declare readonly SEVEN: boolean;
  declare readonly EIGHT: boolean;
  declare readonly NINE: boolean;
  declare readonly NUMPADZERO: boolean;
  declare readonly NUMPADONE: boolean;
  declare readonly NUMPADTWO: boolean;
  declare readonly NUMPADTHREE: boolean;
  declare readonly NUMPADFOUR: boolean;
  declare readonly NUMPADFIVE: boolean;
  declare readonly NUMPADSIX: boolean;
  declare readonly NUMPADSEVEN: boolean;
  declare readonly NUMPADEIGHT: boolean;
  declare readonly NUMPADNINE: boolean;
  declare readonly PAGEUP: boolean;
  declare readonly PAGEDOWN: boolean;
  declare readonly HOME: boolean;
  declare readonly END: boolean;
  declare readonly INSERT: boolean;
  declare readonly MINUS: boolean;
  declare readonly NUMPADMINUS: boolean;
  declare readonly PLUS: boolean;
  declare readonly NUMPADPLUS: boolean;
  declare readonly DELETE: boolean;
  declare readonly BACKSPACE: boolean;
  declare readonly TAB: boolean;
  declare readonly Q: boolean;
  declare readonly W: boolean;
  declare readonly E: boolean;
  declare readonly R: boolean;
  declare readonly T: boolean;
  declare readonly Y: boolean;
  declare readonly U: boolean;
  declare readonly I: boolean;
  declare readonly O: boolean;
  declare readonly P: boolean;
  declare readonly LBRACKET: boolean;
  declare readonly RBRACKET: boolean;
  declare readonly BACKSLASH: boolean;
  declare readonly CAPSLOCK: boolean;
  declare readonly A: boolean;
  declare readonly S: boolean;
  declare readonly D: boolean;
  declare readonly F: boolean;
  declare readonly G: boolean;
  declare readonly H: boolean;
  declare readonly J: boolean;
  declare readonly K: boolean;
  declare readonly L: boolean;
  declare readonly SEMICOLON: boolean;
  declare readonly QUOTE: boolean;
  declare readonly ENTER: boolean;
  declare readonly SHIFT: boolean;
  declare readonly Z: boolean;
  declare readonly X: boolean;
  declare readonly C: boolean;
  declare readonly V: boolean;
  declare readonly B: boolean;
  declare readonly N: boolean;
  declare readonly M: boolean;
  declare readonly COMMA: boolean;
  declare readonly PERIOD: boolean;
  declare readonly NUMPADPERIOD: boolean;
  declare readonly SLASH: boolean;
  declare readonly NUMPADSLASH: boolean;
  declare readonly CONTROL: boolean;
  declare readonly ALT: boolean;
  declare readonly SPACE: boolean;
  declare readonly UP: boolean;
  declare readonly DOWN: boolean;
  declare readonly LEFT: boolean;
  declare readonly RIGHT: boolean;

  readonly #domCodes = new Map<string, number>();

  constructor() {
    super();
    for (let index = 0; index < 26; index += 1) {
      const name = String.fromCharCode(65 + index);
      this.#register(name, 65 + index, `Key${name}`);
    }
    const numberNames = [
      'ZERO',
      'ONE',
      'TWO',
      'THREE',
      'FOUR',
      'FIVE',
      'SIX',
      'SEVEN',
      'EIGHT',
      'NINE',
    ];
    for (let index = 0; index < numberNames.length; index += 1) {
      this.#register(numberNames[index] as string, 48 + index, `Digit${index}`);
      this.#register(
        `NUMPAD${numberNames[index] as string}`,
        96 + index,
        `Numpad${index}`,
      );
    }
    for (let index = 1; index <= 12; index += 1) {
      this.#register(`F${index}`, 111 + index, `F${index}`);
    }
    for (const [name, code] of LEGACY_KEYS) this.addKey(name, code);
    const domAliases: readonly (readonly [string, string])[] = [
      ['Escape', 'ESCAPE'],
      ['PageUp', 'PAGEUP'],
      ['PageDown', 'PAGEDOWN'],
      ['Home', 'HOME'],
      ['End', 'END'],
      ['Insert', 'INSERT'],
      ['Delete', 'DELETE'],
      ['Backspace', 'BACKSPACE'],
      ['Tab', 'TAB'],
      ['Enter', 'ENTER'],
      ['NumpadEnter', 'ENTER'],
      ['ShiftLeft', 'SHIFT'],
      ['ShiftRight', 'SHIFT'],
      ['ControlLeft', 'CONTROL'],
      ['ControlRight', 'CONTROL'],
      ['AltLeft', 'ALT'],
      ['AltRight', 'ALT'],
      ['Space', 'SPACE'],
      ['ArrowUp', 'UP'],
      ['ArrowDown', 'DOWN'],
      ['ArrowLeft', 'LEFT'],
      ['ArrowRight', 'RIGHT'],
      ['Minus', 'MINUS'],
      ['Equal', 'PLUS'],
      ['NumpadAdd', 'NUMPADPLUS'],
      ['NumpadSubtract', 'NUMPADMINUS'],
      ['NumpadDecimal', 'NUMPADPERIOD'],
      ['NumpadDivide', 'NUMPADSLASH'],
      ['BracketLeft', 'LBRACKET'],
      ['BracketRight', 'RBRACKET'],
      ['Backslash', 'BACKSLASH'],
      ['CapsLock', 'CAPSLOCK'],
      ['Semicolon', 'SEMICOLON'],
      ['Quote', 'QUOTE'],
      ['Comma', 'COMMA'],
      ['Period', 'PERIOD'],
      ['Slash', 'SLASH'],
    ];
    for (const [domCode, name] of domAliases) {
      const code = this.getKeyCode(name);
      if (code >= 0) this.#domCodes.set(domCode, code);
    }
    this.addAlias('CTRL', 'CONTROL');
    this.addAlias('RETURN', 'ENTER');
  }

  handleKeyDown(event: FlxKeyboardEventLike): void {
    if (event.repeat === true) return;
    const code = this.#resolveCode(event);
    if (code >= 0) this.queueKeyCode(code, true);
  }

  handleKeyUp(event: FlxKeyboardEventLike): void {
    const code = this.#resolveCode(event);
    if (code >= 0) this.queueKeyCode(code, false);
  }

  releaseAll(): void {
    this.queueReleaseAll();
  }

  #register(name: string, legacyCode: number, domCode: string): void {
    this.addKey(name, legacyCode);
    this.#domCodes.set(domCode, legacyCode);
  }

  #resolveCode(event: FlxKeyboardEventLike): number {
    if (event.code !== undefined) {
      const code = this.#domCodes.get(event.code);
      if (code !== undefined) return code;
    }
    if (event.keyCode !== undefined && this.hasKeyCode(event.keyCode)) {
      return event.keyCode;
    }
    if (event.key !== undefined) return this.getKeyCode(event.key);
    return -1;
  }
}
