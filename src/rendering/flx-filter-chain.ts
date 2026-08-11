import {
  BlurFilter,
  ColorMatrixFilter,
  type ColorMatrix,
  type Container,
  type Filter,
} from 'pixi.js';

import {
  FlxBlurFilter,
  FlxColorMatrixFilter,
  type FlxFilter,
} from './flx-filter';

/** @internal Adapter-owned materialization of renderer-neutral filters. */
export class FlxFilterChain {
  #source: readonly FlxFilter[] | null = null;
  #filters: Filter[] = [];

  sync(view: Container, source: readonly FlxFilter[]): void {
    if (source === this.#source) return;
    this.#release(view);
    this.#source = source;
    this.#filters = source.map(materializeFilter);
    view.filters = this.#filters.length > 0 ? this.#filters : null;
  }

  destroy(view: Container): void {
    this.#release(view);
    this.#source = null;
  }

  #release(view: Container): void {
    view.filters = null;
    for (const filter of this.#filters) filter.destroy();
    this.#filters = [];
  }
}

function materializeFilter(filter: FlxFilter): Filter {
  if (filter instanceof FlxBlurFilter) {
    const pixiFilter = new BlurFilter({
      quality: filter.quality,
      strength: filter.strength,
    });
    pixiFilter.repeatEdgePixels = filter.repeatEdgePixels;
    return pixiFilter;
  }
  if (filter instanceof FlxColorMatrixFilter) {
    const pixiFilter = new ColorMatrixFilter();
    pixiFilter.matrix = [...filter.matrix] as unknown as ColorMatrix;
    pixiFilter.alpha = filter.alpha;
    return pixiFilter;
  }
  throw new TypeError('Unsupported FlxFilter descriptor.');
}
