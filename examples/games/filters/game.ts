import {
  FlxBlurFilter,
  FlxColorMatrixFilter,
  FlxG,
  FlxSprite,
  FlxSpriteContainer,
  FlxState,
  FlxText,
} from '../../../src';

export interface FilterShowcaseSnapshot {
  blurEnabled: boolean;
  compositeFilters: number;
  grayscaleFilters: number;
}

function label(state: FlxState, x: number, text: string): void {
  state.add(
    new FlxText(x - 20, 226, 130, text).setFormat(
      undefined,
      11,
      0xffe2e8f0,
      'center',
    ),
  );
}

/** Public-API showcase for renderer-neutral sprite and composite filters. */
export class FilterShowcaseState extends FlxState {
  readonly grayscale = new FlxSprite(220, 116);
  readonly blurred = new FlxSprite(360, 116);
  readonly composite = new FlxSpriteContainer(490, 116);
  blurEnabled = true;

  override create(): void {
    super.create();
    FlxG.camera.bgColor = 0xff07111f;
    this.add(
      new FlxText(24, 20, 592, 'FILTERS + COLOR MATRIX').setFormat(
        undefined,
        17,
        0xfff8fafc,
        'left',
      ),
    );
    this.add(
      new FlxText(
        24,
        49,
        592,
        'Immutable Flixel descriptors · camera-local Pixi resources · composite pass',
      ).setFormat(undefined, 10, 0xff38bdf8, 'left'),
    );

    this.add(new FlxSprite(70, 116).makeGraphic(80, 80, 0xef4444ff));
    label(this, 70, 'Original');

    this.grayscale.makeGraphic(80, 80, 0xef4444ff);
    this.grayscale.filters = [FlxColorMatrixFilter.grayscale()];
    this.add(this.grayscale);
    label(this, 220, 'Grayscale');

    this.blurred.makeGraphic(80, 80, 0x22d3eeff);
    this.#syncBlur();
    this.add(this.blurred);
    label(this, 360, 'Blur');

    this.composite.add(new FlxSprite(0, 0).makeGraphic(56, 80, 0xfacc15ff));
    this.composite.add(new FlxSprite(34, 20).makeGraphic(56, 60, 0xf472b6ff));
    this.composite.filters = [FlxColorMatrixFilter.grayscale(0.65)];
    this.add(this.composite);
    label(this, 490, 'Composite');

    this.add(
      new FlxText(
        24,
        286,
        592,
        'The composite applies one filter pass to both children. Gameplay bounds and collision stay unchanged.',
      ).setFormat(undefined, 10, 0xff94a3b8, 'left'),
    );
  }

  setBlurEnabled(enabled: boolean): void {
    this.blurEnabled = enabled;
    this.#syncBlur();
  }

  snapshot(): FilterShowcaseSnapshot {
    return {
      blurEnabled: this.blurEnabled,
      compositeFilters: this.composite.filters.length,
      grayscaleFilters: this.grayscale.filters.length,
    };
  }

  #syncBlur(): void {
    this.blurred.filters = this.blurEnabled
      ? [new FlxBlurFilter(7, { quality: 3 })]
      : [];
  }
}
