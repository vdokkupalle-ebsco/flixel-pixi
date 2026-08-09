/** Function used to transform normalized tween progress. @public */
export type FlxEaseFunction = (progress: number) => number;

const HALF_PI = Math.PI / 2;
const BOUNCE_1 = 1 / 2.75;
const BOUNCE_2 = 2 / 2.75;
const BOUNCE_3 = 1.5 / 2.75;
const BOUNCE_4 = 2.5 / 2.75;
const BOUNCE_5 = 2.25 / 2.75;
const BOUNCE_6 = 2.625 / 2.75;
const ELASTIC_PERIOD = 0.4;

/** HaxeFlixel-compatible easing functions. @public */
// A static class intentionally preserves the familiar HaxeFlixel call surface.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FlxEase {
  static linear(t: number): number {
    return t;
  }

  static quadIn(t: number): number {
    return t * t;
  }

  static quadOut(t: number): number {
    return -t * (t - 2);
  }

  static quadInOut(t: number): number {
    return t <= 0.5 ? t * t * 2 : 1 - (t - 1) * (t - 1) * 2;
  }

  static cubeIn(t: number): number {
    return t * t * t;
  }

  static cubeOut(t: number): number {
    const shifted = t - 1;
    return 1 + shifted * shifted * shifted;
  }

  static cubeInOut(t: number): number {
    if (t <= 0.5) return t * t * t * 4;
    const shifted = t - 1;
    return 1 + shifted * shifted * shifted * 4;
  }

  static quartIn(t: number): number {
    return t * t * t * t;
  }

  static quartOut(t: number): number {
    const shifted = t - 1;
    return 1 - shifted * shifted * shifted * shifted;
  }

  static quartInOut(t: number): number {
    if (t <= 0.5) return t * t * t * t * 8;
    const shifted = t * 2 - 2;
    return (1 - shifted * shifted * shifted * shifted) / 2 + 0.5;
  }

  static quintIn(t: number): number {
    return t * t * t * t * t;
  }

  static quintOut(t: number): number {
    const shifted = t - 1;
    return shifted * shifted * shifted * shifted * shifted + 1;
  }

  static quintInOut(t: number): number {
    const doubled = t * 2;
    if (doubled < 1) return doubled ** 5 / 2;
    return ((doubled - 2) ** 5 + 2) / 2;
  }

  static smoothStepIn(t: number): number {
    return 2 * FlxEase.smoothStepInOut(t / 2);
  }

  static smoothStepOut(t: number): number {
    return 2 * FlxEase.smoothStepInOut(t / 2 + 0.5) - 1;
  }

  static smoothStepInOut(t: number): number {
    return t * t * (t * -2 + 3);
  }

  static smootherStepIn(t: number): number {
    return 2 * FlxEase.smootherStepInOut(t / 2);
  }

  static smootherStepOut(t: number): number {
    return 2 * FlxEase.smootherStepInOut(t / 2 + 0.5) - 1;
  }

  static smootherStepInOut(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  static sineIn(t: number): number {
    return -Math.cos(HALF_PI * t) + 1;
  }

  static sineOut(t: number): number {
    return Math.sin(HALF_PI * t);
  }

  static sineInOut(t: number): number {
    return -Math.cos(Math.PI * t) / 2 + 0.5;
  }

  static bounceIn(t: number): number {
    return 1 - FlxEase.bounceOut(1 - t);
  }

  static bounceOut(t: number): number {
    if (t < BOUNCE_1) return 7.5625 * t * t;
    if (t < BOUNCE_2) return 7.5625 * (t - BOUNCE_3) ** 2 + 0.75;
    if (t < BOUNCE_4) return 7.5625 * (t - BOUNCE_5) ** 2 + 0.9375;
    return 7.5625 * (t - BOUNCE_6) ** 2 + 0.984375;
  }

  static bounceInOut(t: number): number {
    return t < 0.5
      ? (1 - FlxEase.bounceOut(1 - 2 * t)) / 2
      : (1 + FlxEase.bounceOut(2 * t - 1)) / 2;
  }

  static circIn(t: number): number {
    return 1 - Math.sqrt(1 - t * t);
  }

  static circOut(t: number): number {
    return Math.sqrt(1 - (t - 1) ** 2);
  }

  static circInOut(t: number): number {
    return t <= 0.5
      ? (Math.sqrt(1 - t * t * 4) - 1) / -2
      : (Math.sqrt(1 - (t * 2 - 2) ** 2) + 1) / 2;
  }

  static expoIn(t: number): number {
    return Math.pow(2, 10 * (t - 1));
  }

  static expoOut(t: number): number {
    return 1 - Math.pow(2, -10 * t);
  }

  static expoInOut(t: number): number {
    return t < 0.5
      ? Math.pow(2, 10 * (t * 2 - 1)) / 2
      : (2 - Math.pow(2, -10 * (t * 2 - 1))) / 2;
  }

  static backIn(t: number): number {
    return t * t * (2.70158 * t - 1.70158);
  }

  static backOut(t: number): number {
    const shifted = t - 1;
    return 1 - shifted * shifted * (-2.70158 * shifted - 1.70158);
  }

  static backInOut(t: number): number {
    let doubled = t * 2;
    if (doubled < 1) {
      return (doubled * doubled * (2.70158 * doubled - 1.70158)) / 2;
    }
    doubled -= 1;
    const shifted = doubled - 1;
    return (1 - shifted * shifted * (-2.70158 * shifted - 1.70158)) / 2 + 0.5;
  }

  static elasticIn(t: number): number {
    const shifted = t - 1;
    return -(
      Math.pow(2, 10 * shifted) *
      Math.sin(
        (shifted - (ELASTIC_PERIOD / (2 * Math.PI)) * Math.asin(1)) *
          ((2 * Math.PI) / ELASTIC_PERIOD),
      )
    );
  }

  static elasticOut(t: number): number {
    return (
      Math.pow(2, -10 * t) *
        Math.sin(
          (t - (ELASTIC_PERIOD / (2 * Math.PI)) * Math.asin(1)) *
            ((2 * Math.PI) / ELASTIC_PERIOD),
        ) +
      1
    );
  }

  static elasticInOut(t: number): number {
    if (t < 0.5) {
      const shifted = t - 0.5;
      return (
        -0.5 *
        Math.pow(2, 10 * shifted) *
        Math.sin(
          (shifted - ELASTIC_PERIOD / 4) * ((2 * Math.PI) / ELASTIC_PERIOD),
        )
      );
    }
    const shifted = t - 0.5;
    return (
      Math.pow(2, -10 * shifted) *
        Math.sin(
          (shifted - ELASTIC_PERIOD / 4) * ((2 * Math.PI) / ELASTIC_PERIOD),
        ) *
        0.5 +
      1
    );
  }
}
