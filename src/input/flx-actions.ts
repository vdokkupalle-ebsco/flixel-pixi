import { FlxG } from '../core/flx-g';
import type { FlxGamepad } from './flx-gamepad';

/** Selects one logical gamepad, the first active pad, or every connected pad. @public */
export type FlxActionGamepadTarget = 'first' | 'all' | number;

/** Keyboard key used as a digital action source. @public */
export interface FlxActionKeyboardSource {
  readonly device: 'keyboard';
  readonly key: string;
}

/** Pointer button used as a digital action source. @public */
export interface FlxActionMouseSource {
  readonly button: number;
  readonly device: 'mouse';
}

/** Mouse-wheel direction used as a one-step digital action source. @public */
export interface FlxActionWheelSource {
  readonly device: 'wheel';
  readonly direction: -1 | 1;
}

/** Gamepad button used as a digital action source. @public */
export interface FlxActionGamepadButtonSource {
  readonly button: number;
  readonly device: 'gamepad-button';
  readonly gamepad?: FlxActionGamepadTarget;
}

/** Pair of keyboard keys exposed as a scalar analog source. @public */
export interface FlxActionKeyboardAxisSource {
  readonly device: 'keyboard-axis';
  readonly negative: string;
  readonly positive: string;
  readonly scale?: number;
}

/** One gamepad axis exposed as a scalar analog source. @public */
export interface FlxActionGamepadAxisSource {
  readonly axis: number;
  readonly deadZone?: number;
  readonly device: 'gamepad-axis';
  readonly gamepad?: FlxActionGamepadTarget;
  readonly scale?: number;
}

/** Pair of gamepad buttons exposed as a scalar analog source. @public */
export interface FlxActionGamepadButtonAxisSource {
  readonly device: 'gamepad-button-axis';
  readonly gamepad?: FlxActionGamepadTarget;
  readonly negative: number;
  readonly positive: number;
  readonly scale?: number;
}

/** One registered virtual control exposed as a digital action source. @public */
export interface FlxActionVirtualButtonSource {
  readonly device: 'virtual-button';
  readonly id: string;
}

/** Pair of virtual buttons exposed as a scalar analog source. @public */
export interface FlxActionVirtualButtonAxisSource {
  readonly device: 'virtual-button-axis';
  readonly negative: string;
  readonly positive: string;
  readonly scale?: number;
}

/** Serializable digital or scalar-analog source for one named action. @public */
export type FlxActionSource =
  | FlxActionKeyboardSource
  | FlxActionMouseSource
  | FlxActionWheelSource
  | FlxActionGamepadButtonSource
  | FlxActionKeyboardAxisSource
  | FlxActionGamepadAxisSource
  | FlxActionGamepadButtonAxisSource
  | FlxActionVirtualButtonSource
  | FlxActionVirtualButtonAxisSource;

/** Versioned binding schema returned by {@link FlxActions.save}. @public */
export interface FlxActionBindingsData {
  readonly bindings: readonly {
    readonly action: string;
    readonly sources: readonly FlxActionSource[];
  }[];
  readonly version: 1;
}

/** Controls whether a newly assigned source is removed from other actions. @public */
export interface FlxActionRebindOptions {
  readonly exclusive?: boolean;
}

/**
 * Maps logical actions to keyboard, pointer, and gamepad sources.
 *
 * The legacy `bind(action, ...keys)` helper remains a keyboard-only shorthand.
 * @public
 */
export class FlxActions {
  readonly #bindings = new Map<string, FlxActionSource[]>();

  /** Replace an action with one or more keyboard bindings. */
  bind(action: string, ...keys: string[]): void {
    this.bindSources(
      action,
      ...keys.map((key): FlxActionKeyboardSource => ({
        device: 'keyboard',
        key,
      })),
    );
  }

  /** Replace every source assigned to an action. */
  bindSources(action: string, ...sources: readonly FlxActionSource[]): void {
    const name = normalizeAction(action);
    this.#bindings.set(name, uniqueSources(sources.map(normalizeSource)));
  }

  /** Add one source without replacing the action's existing sources. */
  addSource(
    action: string,
    source: FlxActionSource,
    options: FlxActionRebindOptions = {},
  ): void {
    const name = normalizeAction(action);
    const normalized = normalizeSource(source);
    if (options.exclusive === true) this.#removeConflicts(name, normalized);
    const current = this.#bindings.get(name) ?? [];
    this.#bindings.set(name, uniqueSources([...current, normalized]));
  }

  /**
   * Replace an action with one source and, by default, remove that exact source
   * from every other action.
   */
  rebind(
    action: string,
    source: FlxActionSource,
    options: FlxActionRebindOptions = {},
  ): void {
    const name = normalizeAction(action);
    const normalized = normalizeSource(source);
    if (options.exclusive !== false) this.#removeConflicts(name, normalized);
    this.#bindings.set(name, [normalized]);
  }

  /** Remove one exact source from an action. */
  removeSource(action: string, source: FlxActionSource): boolean {
    const name = normalizeAction(action);
    const current = this.#bindings.get(name);
    if (current === undefined) return false;
    const key = sourceKey(normalizeSource(source));
    const filtered = current.filter(
      (candidate) => sourceKey(candidate) !== key,
    );
    if (filtered.length === current.length) return false;
    if (filtered.length === 0) this.#bindings.delete(name);
    else this.#bindings.set(name, filtered);
    return true;
  }

  /** Return defensive copies of an action's sources. */
  getSources(action: string): readonly FlxActionSource[] {
    const current = this.#bindings.get(action.trim());
    return current?.map(cloneSource) ?? [];
  }

  /** Unbind an action name. */
  unbind(action: string): void {
    this.#bindings.delete(action.trim());
  }

  /** Clear all action bindings. */
  reset(): void {
    this.#bindings.clear();
  }

  /** Returns true if any digital source is currently pressed. */
  pressed(action: string): boolean {
    return this.#checkDigital(action, 'pressed');
  }

  /** Returns true if any digital source was pressed on this simulation step. */
  justPressed(action: string): boolean {
    return this.#checkDigital(action, 'justPressed');
  }

  /** Returns true if any digital source was released on this simulation step. */
  justReleased(action: string): boolean {
    return this.#checkDigital(action, 'justReleased');
  }

  /**
   * Returns the strongest scalar analog source by absolute magnitude.
   * Digital sources do not contribute to this value.
   */
  value(action: string): number {
    let result = 0;
    for (const source of this.#bindings.get(action.trim()) ?? []) {
      const candidate = this.#analogValue(source);
      if (Math.abs(candidate) > Math.abs(result)) result = candidate;
    }
    return result;
  }

  /** Export a versioned, JSON-safe binding object. */
  save(): FlxActionBindingsData {
    return {
      bindings: [...this.#bindings].map(([action, sources]) => ({
        action,
        sources: sources.map(cloneSource),
      })),
      version: 1,
    };
  }

  /** Load bindings from a versioned object or JSON string. */
  load(data: FlxActionBindingsData | string): void {
    const parsed =
      typeof data === 'string'
        ? (JSON.parse(data) as FlxActionBindingsData)
        : data;
    if (parsed.version !== 1 || !Array.isArray(parsed.bindings)) {
      throw new Error('Unsupported FlxActions binding data.');
    }
    const next = new Map<string, FlxActionSource[]>();
    for (const binding of parsed.bindings) {
      if (!binding || !Array.isArray(binding.sources)) {
        throw new TypeError('Invalid FlxActions binding entry.');
      }
      next.set(
        normalizeAction(binding.action),
        uniqueSources(binding.sources.map(normalizeSource)),
      );
    }
    this.#bindings.clear();
    for (const [action, sources] of next) this.#bindings.set(action, sources);
  }

  #checkDigital(
    action: string,
    query: 'pressed' | 'justPressed' | 'justReleased',
  ): boolean {
    for (const source of this.#bindings.get(action.trim()) ?? []) {
      switch (source.device) {
        case 'keyboard':
          if (FlxG.keys[query](source.key)) return true;
          break;
        case 'mouse':
          if (FlxG.mouse[query](source.button)) return true;
          break;
        case 'wheel':
          if (
            query !== 'justReleased' &&
            FlxG.mouse.wheel * source.direction > 0
          ) {
            return true;
          }
          break;
        case 'gamepad-button':
          for (const gamepad of gamepadsFor(source.gamepad)) {
            if (gamepad[query](source.button)) return true;
          }
          break;
        case 'virtual-button': {
          const button = FlxG.virtualInputs.getButton(source.id);
          if (button?.[query] === true) return true;
          break;
        }
        case 'keyboard-axis':
        case 'gamepad-axis':
        case 'gamepad-button-axis':
        case 'virtual-button-axis':
          break;
      }
    }
    return false;
  }

  #analogValue(source: FlxActionSource): number {
    if (source.device === 'keyboard-axis') {
      const negative = FlxG.keys.pressed(source.negative);
      const positive = FlxG.keys.pressed(source.positive);
      if (negative === positive) return 0;
      return (negative ? -1 : 1) * (source.scale ?? 1);
    }
    if (source.device === 'gamepad-axis') {
      let result = 0;
      for (const gamepad of gamepadsFor(source.gamepad)) {
        const value =
          gamepad.getAxis(source.axis, source.deadZone) * (source.scale ?? 1);
        if (Math.abs(value) > Math.abs(result)) result = value;
      }
      return result;
    }
    if (source.device === 'gamepad-button-axis') {
      let result = 0;
      for (const gamepad of gamepadsFor(source.gamepad)) {
        const negative = gamepad.pressed(source.negative);
        const positive = gamepad.pressed(source.positive);
        const value =
          negative === positive ? 0 : (negative ? -1 : 1) * (source.scale ?? 1);
        if (Math.abs(value) > Math.abs(result)) result = value;
      }
      return result;
    }
    if (source.device === 'virtual-button-axis') {
      const negative =
        FlxG.virtualInputs.getButton(source.negative)?.pressed === true;
      const positive =
        FlxG.virtualInputs.getButton(source.positive)?.pressed === true;
      if (negative === positive) return 0;
      return (negative ? -1 : 1) * (source.scale ?? 1);
    }
    return 0;
  }

  #removeConflicts(action: string, source: FlxActionSource): void {
    const key = sourceKey(source);
    for (const [candidateAction, sources] of this.#bindings) {
      if (candidateAction === action) continue;
      const filtered = sources.filter(
        (candidate) => sourceKey(candidate) !== key,
      );
      if (filtered.length === 0) this.#bindings.delete(candidateAction);
      else if (filtered.length !== sources.length) {
        this.#bindings.set(candidateAction, filtered);
      }
    }
  }
}

function gamepadsFor(
  target: FlxActionGamepadTarget = 'first',
): readonly FlxGamepad[] {
  if (target === 'all') return FlxG.gamepads.connected;
  const gamepad =
    target === 'first'
      ? FlxG.gamepads.firstActive
      : FlxG.gamepads.getByID(target);
  return gamepad === null ? [] : [gamepad];
}

function normalizeAction(action: string): string {
  const name = action.trim();
  if (name.length === 0) throw new RangeError('Action name cannot be empty.');
  return name;
}

function normalizeSource(source: FlxActionSource): FlxActionSource {
  if (!source || typeof source !== 'object') {
    throw new TypeError('Action source must be an object.');
  }
  switch (source.device) {
    case 'keyboard':
      return { device: 'keyboard', key: normalizeKey(source.key) };
    case 'mouse':
      return {
        button: nonNegativeInteger(source.button, 'Mouse button'),
        device: 'mouse',
      };
    case 'wheel':
      if (source.direction !== -1 && source.direction !== 1) {
        throw new RangeError('Wheel direction must be -1 or 1.');
      }
      return { device: 'wheel', direction: source.direction };
    case 'gamepad-button':
      return {
        button: nonNegativeInteger(source.button, 'Gamepad button'),
        device: 'gamepad-button',
        gamepad: normalizeTarget(source.gamepad),
      };
    case 'keyboard-axis':
      return {
        device: 'keyboard-axis',
        negative: normalizeKey(source.negative),
        positive: normalizeKey(source.positive),
        scale: finite(source.scale ?? 1, 'Keyboard axis scale'),
      };
    case 'gamepad-axis': {
      const deadZone = source.deadZone ?? 0.15;
      if (!Number.isFinite(deadZone) || deadZone < 0 || deadZone >= 1) {
        throw new RangeError('Gamepad axis dead zone must be in [0, 1).');
      }
      return {
        axis: nonNegativeInteger(source.axis, 'Gamepad axis'),
        deadZone,
        device: 'gamepad-axis',
        gamepad: normalizeTarget(source.gamepad),
        scale: finite(source.scale ?? 1, 'Gamepad axis scale'),
      };
    }
    case 'gamepad-button-axis':
      return {
        device: 'gamepad-button-axis',
        gamepad: normalizeTarget(source.gamepad),
        negative: nonNegativeInteger(
          source.negative,
          'Negative gamepad button',
        ),
        positive: nonNegativeInteger(
          source.positive,
          'Positive gamepad button',
        ),
        scale: finite(source.scale ?? 1, 'Gamepad button axis scale'),
      };
    case 'virtual-button':
      return {
        device: 'virtual-button',
        id: normalizeVirtualId(source.id),
      };
    case 'virtual-button-axis':
      return {
        device: 'virtual-button-axis',
        negative: normalizeVirtualId(source.negative),
        positive: normalizeVirtualId(source.positive),
        scale: finite(source.scale ?? 1, 'Virtual button axis scale'),
      };
    default:
      throw new TypeError('Unknown action source device.');
  }
}

function normalizeVirtualId(id: string): string {
  const value = String(id).trim();
  if (value.length === 0) {
    throw new RangeError('Virtual button id cannot be empty.');
  }
  return value;
}

function normalizeTarget(
  target: FlxActionGamepadTarget | undefined,
): FlxActionGamepadTarget {
  if (target === undefined || target === 'first' || target === 'all') {
    return target ?? 'first';
  }
  return nonNegativeInteger(target, 'Gamepad UID');
}

function normalizeKey(key: string): string {
  const value = String(key).trim().toUpperCase();
  if (value.length === 0) throw new RangeError('Keyboard key cannot be empty.');
  return value;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
  return value;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  return value;
}

function uniqueSources(sources: readonly FlxActionSource[]): FlxActionSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = sourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sourceKey(source: FlxActionSource): string {
  return JSON.stringify(source);
}

function cloneSource(source: FlxActionSource): FlxActionSource {
  return { ...source };
}
