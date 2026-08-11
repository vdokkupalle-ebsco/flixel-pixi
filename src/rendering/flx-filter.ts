/** Options for {@link FlxBlurFilter}. @public */
export interface FlxBlurFilterOptions {
  /** Number of blur passes. Defaults to 4. */
  quality?: number;
  /** Clamp samples to edge pixels instead of transparent space. */
  repeatEdgePixels?: boolean;
}

/** Renderer-neutral blur effect descriptor. @public */
export class FlxBlurFilter {
  readonly kind = 'blur';
  readonly quality: number;
  readonly repeatEdgePixels: boolean;
  readonly strength: number;

  constructor(strength = 4, options: FlxBlurFilterOptions = {}) {
    const { quality = 4, repeatEdgePixels = false } = options;
    if (!Number.isFinite(strength) || strength < 0) {
      throw new RangeError(
        'Blur strength must be a non-negative finite number.',
      );
    }
    if (!Number.isInteger(quality) || quality < 1) {
      throw new RangeError('Blur quality must be a positive integer.');
    }
    this.strength = strength;
    this.quality = quality;
    this.repeatEdgePixels = repeatEdgePixels;
    Object.freeze(this);
  }
}

/** Renderer-neutral 4×5 color-matrix effect descriptor. @public */
export class FlxColorMatrixFilter {
  readonly kind = 'color-matrix';
  readonly alpha: number;
  readonly matrix: readonly number[];

  constructor(matrix: readonly number[], alpha = 1) {
    if (
      matrix.length !== 20 ||
      matrix.some((value) => !Number.isFinite(value))
    ) {
      throw new RangeError('Color matrix must contain 20 finite numbers.');
    }
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new RangeError('Color matrix alpha must be between 0 and 1.');
    }
    this.matrix = Object.freeze([...matrix]);
    this.alpha = alpha;
    Object.freeze(this);
  }

  /** Standard luminance-preserving grayscale transform. */
  static grayscale(alpha = 1): FlxColorMatrixFilter {
    return new FlxColorMatrixFilter(
      [
        0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126,
        0.7152, 0.0722, 0, 0, 0, 0, 1, 0, 0,
      ],
      alpha,
    );
  }
}

/** Built-in renderer-neutral sprite effects. @public */
export type FlxFilter = FlxBlurFilter | FlxColorMatrixFilter;
