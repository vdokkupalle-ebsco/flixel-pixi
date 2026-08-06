/* eslint-disable @typescript-eslint/no-extraneous-class -- AS3 utility-class compatibility. */
import { FlxG } from '../core/flx-g';
import { FlxPoint, type PointLike } from './flx-point';
import { nextFlixelSeed } from './flx-random';

/** Math, color, formatting, and motion helpers from the AS3 `FlxU` surface. @public */
export class FlxU {
  static abs(value: number): number {
    return value > 0 ? value : -value;
  }

  static floor(value: number): number {
    const number = Math.trunc(value);
    return value > 0 ? number : number === value ? number : number - 1;
  }

  static ceil(value: number): number {
    const number = Math.trunc(value);
    return value > 0 && number !== value ? number + 1 : number;
  }

  static round(value: number): number {
    const number = Math.trunc(value + (value > 0 ? 0.5 : -0.5));
    return value > 0 ? number : number === value ? number : number - 1;
  }

  static min(first: number, second: number): number {
    return first <= second ? first : second;
  }

  static max(first: number, second: number): number {
    return first >= second ? first : second;
  }

  static bound(value: number, minimum: number, maximum: number): number {
    const lowerBound = value < minimum ? minimum : value;
    return lowerBound > maximum ? maximum : lowerBound;
  }

  static srand(seed: number): number {
    return nextFlixelSeed(seed);
  }

  static getTicks(): number {
    return globalThis.performance?.now() ?? Date.now();
  }

  static formatTicks(startTicks: number, endTicks: number): string {
    return `${(endTicks - startTicks) / 1_000}s`;
  }

  static formatTime(seconds: number, showMilliseconds = false): string {
    const minutes = Math.trunc(seconds / 60);
    const wholeSeconds = Math.trunc(seconds) % 60;
    let output = `${minutes}:${wholeSeconds < 10 ? '0' : ''}${wholeSeconds}`;

    if (showMilliseconds) {
      const hundredths = Math.trunc((seconds - Math.trunc(seconds)) * 100);
      output += `.${hundredths < 10 ? '0' : ''}${hundredths}`;
    }

    return output;
  }

  static formatMoney(
    amount: number,
    showDecimal = true,
    englishStyle = true,
  ): string {
    const integer = Math.trunc(amount);
    const separator = englishStyle ? ',' : '.';
    let output = Math.abs(integer)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    if (integer < 0) output = `-${output}`;

    if (showDecimal) {
      const decimal = Math.abs(Math.trunc(amount * 100) - integer * 100);
      output += `${englishStyle ? '.' : ','}${decimal.toString().padStart(2, '0')}`;
    }

    return output;
  }

  static formatArray(values: readonly unknown[] | null): string {
    return values?.map(String).join(', ') ?? '';
  }

  static getRandom<T>(
    objects: readonly T[] | null,
    startIndex = 0,
    length = 0,
    random: () => number = Math.random,
  ): T | null {
    if (objects === null || startIndex < 0 || startIndex >= objects.length) {
      return null;
    }

    const available = objects.length - startIndex;
    const selectionLength =
      length === 0 || length > available ? available : length;
    if (selectionLength <= 0) return null;
    return objects[startIndex + Math.floor(random() * selectionLength)] ?? null;
  }

  static shuffle<T>(
    objects: T[],
    howManyTimes: number,
    random: () => number = Math.random,
  ): T[] {
    for (let index = 0; index < howManyTimes; index += 1) {
      const first = Math.floor(random() * objects.length);
      const second = Math.floor(random() * objects.length);
      [objects[first], objects[second]] = [
        objects[second] as T,
        objects[first] as T,
      ];
    }
    return objects;
  }

  static getDistance(first: PointLike, second: PointLike): number {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  static getAngle(first: PointLike, second: PointLike): number {
    const x = second.x - first.x;
    const y = second.y - first.y;
    if (x === 0 && y === 0) return 0;

    const firstOctant = Math.PI * 0.25;
    const thirdOctant = 3 * firstOctant;
    const absoluteY = Math.abs(y);
    let angle =
      x >= 0
        ? firstOctant - firstOctant * ((x - absoluteY) / (x + absoluteY))
        : thirdOctant - firstOctant * ((x + absoluteY) / (absoluteY - x));
    angle = (y < 0 ? -angle : angle) * (180 / Math.PI);
    return angle > 90 ? angle - 270 : angle + 90;
  }

  static rotatePoint(
    x: number,
    y: number,
    pivotX: number,
    pivotY: number,
    angle: number,
    point: FlxPoint = new FlxPoint(),
  ): FlxPoint {
    const radians = angle * (-Math.PI / 180);
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    const deltaX = x - pivotX;
    const deltaY = pivotY + y;
    point.x = pivotX + cosine * deltaX - sine * deltaY;
    point.y = pivotY - sine * deltaX - cosine * deltaY;
    return point;
  }

  /** Splits an AS3-style `0xAARRGGBB` color into RGBA components. */
  static getRGBA(color: number, results: number[] = []): number[] {
    const packed = color >>> 0;
    results[0] = (packed >>> 16) & 0xff;
    results[1] = (packed >>> 8) & 0xff;
    results[2] = packed & 0xff;
    results[3] = ((packed >>> 24) & 0xff) / 255;
    return results;
  }

  static getHSB(color: number, results: number[] = []): number[] {
    const packed = color >>> 0;
    const red = ((packed >>> 16) & 0xff) / 255;
    const green = ((packed >>> 8) & 0xff) / 255;
    const blue = (packed & 0xff) / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const range = maximum - minimum;
    let hue = 0;
    const saturation = maximum === 0 ? 0 : range / maximum;

    if (saturation !== 0) {
      if (red === maximum) hue = (green - blue) / range;
      else if (green === maximum) hue = 2 + (blue - red) / range;
      else hue = 4 + (red - green) / range;
      hue *= 60;
      if (hue < 0) hue += 360;
    }

    results[0] = hue;
    results[1] = saturation;
    results[2] = maximum;
    results[3] = ((packed >>> 24) & 0xff) / 255;
    return results;
  }

  static makeColor(
    red: number,
    green: number,
    blue: number,
    alpha = 1,
  ): number {
    const alphaByte = (alpha > 1 ? alpha : alpha * 255) & 0xff;
    return (
      ((alphaByte << 24) |
        ((red & 0xff) << 16) |
        ((green & 0xff) << 8) |
        (blue & 0xff)) >>>
      0
    );
  }

  static makeColorFromHSB(
    hue: number,
    saturation: number,
    brightness: number,
    alpha = 1,
  ): number {
    const normalizedHue = hue === 360 ? 0 : hue;
    const chroma = brightness * saturation;
    const segment = normalizedHue / 60;
    const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
    const offset = brightness - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (saturation === 0) red = green = blue = 0;
    else if (segment < 1) [red, green] = [chroma, secondary];
    else if (segment < 2) [red, green] = [secondary, chroma];
    else if (segment < 3) [green, blue] = [chroma, secondary];
    else if (segment < 4) [green, blue] = [secondary, chroma];
    else if (segment < 5) [red, blue] = [secondary, chroma];
    else [red, blue] = [chroma, secondary];

    return FlxU.makeColor(
      Math.trunc((red + offset) * 255),
      Math.trunc((green + offset) * 255),
      Math.trunc((blue + offset) * 255),
      alpha,
    );
  }

  static computeVelocity(
    velocity: number,
    acceleration = 0,
    drag = 0,
    maximum = 10_000,
    elapsed?: number,
  ): number {
    const step =
      acceleration === 0 && drag === 0 ? 0 : (elapsed ?? FlxG.elapsed);
    if (acceleration !== 0) velocity += acceleration * step;
    else if (drag !== 0) {
      const dragAmount = drag * step;
      if (velocity - dragAmount > 0) velocity -= dragAmount;
      else if (velocity + dragAmount < 0) velocity += dragAmount;
      else velocity = 0;
    }

    if (velocity !== 0 && maximum !== 10_000) {
      velocity = FlxU.bound(velocity, -maximum, maximum);
    }
    return velocity;
  }

  static getClassName(value: object, simple = false): string {
    const name = value.constructor.name || 'Object';
    return simple ? name : name;
  }

  static compareClassNames(first: object, second: object): boolean {
    return FlxU.getClassName(first) === FlxU.getClassName(second);
  }
}
