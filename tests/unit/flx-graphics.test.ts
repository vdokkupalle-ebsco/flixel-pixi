// @vitest-environment happy-dom
import { FillGradient } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlxBlurFilter,
  FlxContext,
  FlxG,
  FlxGradient,
  FlxGraphics,
  FlxGraphicsRenderHandle,
} from '../../src';

describe('FlxGradient and FlxGraphics', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
    const canvasGradient = { addColorStop: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createLinearGradient: () => canvasGradient,
      createRadialGradient: () => canvasGradient,
      fillRect: vi.fn(),
      fillStyle: '',
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    FlxG.clearContext();
  });

  it('clones and validates immutable local gradient descriptors', () => {
    const stops = [
      { color: 0xff0000ff, offset: 0 },
      { color: 0x0000ffff, offset: 1 },
    ];
    const gradient = FlxGradient.linear(stops, {
      end: { x: 1, y: 0 },
    });
    stops[0] = { color: 0, offset: 0.5 };

    expect(gradient.stops[0]).toEqual({ color: 0xff0000ff, offset: 0 });
    expect(gradient.end).toEqual({ x: 1, y: 0 });
    expect(Object.isFrozen(gradient)).toBe(true);
    expect(Object.isFrozen(gradient.stops)).toBe(true);
    expect(() =>
      FlxGradient.linear([
        { color: 0xffffffff, offset: 0.8 },
        { color: 0x000000ff, offset: 0.2 },
      ]),
    ).toThrow('ordered');
    expect(() =>
      FlxGradient.radial(
        [
          { color: 0xffffffff, offset: 0 },
          { color: 0x000000ff, offset: 1 },
        ],
        { innerRadius: 0.5, outerRadius: 0.5 },
      ),
    ).toThrow('exceed');
  });

  it('builds stable camera-local vector contexts and gradient resources', () => {
    const gradient = FlxGradient.linear(
      [
        { color: 0x22d3eeff, offset: 0 },
        { color: 0x2563ebff, offset: 1 },
      ],
      { end: { x: 1, y: 0 } },
    );
    const shape = new FlxGraphics(10, 20, 120, 80)
      .roundRect(0, 0, 120, 80, 12, {
        fill: gradient,
        stroke: { fill: 0xffffffff, width: 2 },
      })
      .line([10, 60, 60, 30, 110, 60], {
        cap: 'round',
        fill: 0xfacc15ff,
        join: 'round',
        width: 4,
      });
    shape.filters = [new FlxBlurFilter(1)];

    const first = shape.createRenderHandle();
    const second = shape.createRenderHandle();
    if (
      !(first instanceof FlxGraphicsRenderHandle) ||
      !(second instanceof FlxGraphicsRenderHandle)
    ) {
      throw new Error('Expected graphics handles.');
    }
    expect(first.graphics.context).not.toBe(second.graphics.context);
    expect(first.graphics.context.instructions.length).toBeGreaterThan(1);
    expect(first.view.position).toMatchObject({ x: 10, y: 20 });
    expect(first.view.filters).toHaveLength(1);

    const firstFill = first.graphics.context.instructions.find(
      (instruction) => instruction.action === 'fill',
    );
    const secondFill = second.graphics.context.instructions.find(
      (instruction) => instruction.action === 'fill',
    );
    const firstGradient = (firstFill?.data.style as { fill?: unknown }).fill;
    const secondGradient = (secondFill?.data.style as { fill?: unknown }).fill;
    expect(firstGradient).toBeInstanceOf(FillGradient);
    expect(firstGradient).not.toBe(secondGradient);
    if (!(firstGradient instanceof FillGradient)) {
      throw new Error('Expected a Pixi gradient.');
    }
    const destroyGradient = vi.spyOn(firstGradient, 'destroy');
    const clear = vi.spyOn(first.graphics, 'clear');
    first.sync();
    expect(clear).not.toHaveBeenCalled();

    shape.circle(60, 40, 10, { fill: 0xffffffff });
    first.sync();
    expect(clear).toHaveBeenCalledOnce();
    expect(destroyGradient).toHaveBeenCalledOnce();
    expect(first.graphics.context.instructions.length).toBeGreaterThan(2);

    first.destroy();
    second.destroy();
    expect(shape.renderHandleCount).toBe(0);
    shape.destroy();
  });

  it('offers reusable primitives, explicit clearing, and bounds culling', () => {
    const shape = new FlxGraphics(310, 10, 40, 80)
      .rect(0, 0, 40, 20, { fill: 0xef4444ff })
      .circle(20, 40, 10, { fill: 0x22d3eeff })
      .ellipse(20, 60, 15, 8, { fill: 0x4ade80ff })
      .polygon([0, 80, 20, 65, 40, 80], { fill: 0xfacc15ff })
      .star(20, 20, 5, 10, 4, { fill: 0xffffffff });
    expect(shape.commandCount).toBe(5);
    expect(shape.onScreen()).toBe(true);
    shape.x = 321;
    expect(shape.onScreen()).toBe(false);
    const revision = shape.graphicsRevision;
    shape.clearGraphics();
    expect(shape.commandCount).toBe(0);
    expect(shape.graphicsRevision).toBe(revision + 1);
    shape.clearGraphics();
    expect(shape.graphicsRevision).toBe(revision + 1);
    expect(() => shape.rect(0, 0, 0, 10, { fill: 0xffffffff })).toThrow(
      'positive',
    );
    expect(() => shape.circle(0, 0, 2, {})).toThrow('fill or stroke');
    expect(() => shape.line([0, 0], { fill: 0xffffffff, width: 1 })).toThrow(
      'at least 2',
    );
    shape.destroy();
  });
});
