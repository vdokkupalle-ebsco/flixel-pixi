// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlxBlurFilter,
  FlxContext,
  FlxG,
  FlxStrip,
  FlxStripRenderHandle,
} from '../../src';

describe('FlxStrip', () => {
  beforeEach(() => {
    FlxG.installContext(new FlxContext(320, 180, 0.5));
  });

  afterEach(() => {
    FlxG.clearContext();
  });

  it('clones validated triangle geometry and materializes it per camera', () => {
    const vertices = [0, 0, 32, 0, 28, 24, 4, 24];
    const strip = new FlxStrip(10, 20).setGeometry({
      indices: [0, 1, 2, 0, 2, 3],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      vertices,
    });
    vertices[0] = 99;

    const first = strip.createRenderHandle();
    const second = strip.createRenderHandle();
    if (
      !(first instanceof FlxStripRenderHandle) ||
      !(second instanceof FlxStripRenderHandle)
    ) {
      throw new Error('Expected strip handles.');
    }

    expect(strip.vertices[0]).toBe(0);
    expect(Array.from(first.mesh.geometry.positions)).toEqual([
      0, 0, 32, 0, 28, 24, 4, 24,
    ]);
    expect(first.mesh.geometry).not.toBe(second.mesh.geometry);
    expect(first.mesh.texture).toBe(strip.renderTexture);
    expect(first.view.position).toMatchObject({ x: 10, y: 20 });

    const firstGeometry = first.mesh.geometry;
    strip.setVertex(2, 24, 30).setUv(2, 0.75, 1);
    first.sync();
    second.sync();
    expect(first.mesh.geometry).toBe(firstGeometry);
    expect(first.mesh.geometry.positions[4]).toBe(24);
    expect(first.mesh.geometry.positions[5]).toBe(30);
    expect(second.mesh.geometry.uvs[4]).toBe(0.75);

    strip.vertices[1] = 3;
    first.sync();
    expect(first.mesh.geometry.positions[1]).toBe(0);
    strip.invalidateGeometry();
    first.sync();
    expect(first.mesh.geometry.positions[1]).toBe(3);

    strip.filters = [new FlxBlurFilter(2)];
    first.sync();
    expect(first.view.filters).toHaveLength(1);

    first.destroy();
    second.destroy();
    expect(strip.renderHandleCount).toBe(0);
    strip.destroy();
  });

  it('replaces camera geometry when topology changes', () => {
    const strip = new FlxStrip();
    const handle = strip.createRenderHandle();
    if (!(handle instanceof FlxStripRenderHandle)) {
      throw new Error('Expected strip handle.');
    }
    const previous = handle.mesh.geometry;
    const destroyPrevious = vi.spyOn(previous, 'destroy');

    strip.setGeometry({
      indices: [0, 1, 2, 3],
      topology: 'triangle-strip',
      uvs: [0, 0, 1, 0, 0, 1, 1, 1],
      vertices: [0, 0, 8, 0, 0, 8, 8, 8],
    });
    handle.sync();

    expect(handle.mesh.geometry).not.toBe(previous);
    expect(handle.mesh.geometry.topology).toBe('triangle-strip');
    expect(destroyPrevious).toHaveBeenCalledOnce();
    handle.destroy();
    strip.destroy();
  });

  it('rejects malformed vertices, uvs, and indices', () => {
    const strip = new FlxStrip();
    expect(() =>
      strip.setGeometry({ vertices: [0, 0, 1, 1], uvs: [0, 0, 1, 1] }),
    ).toThrow('at least three');
    expect(() =>
      strip.setGeometry({
        vertices: [0, 0, 1, 0, 0, 1],
        uvs: [0, 0],
      }),
    ).toThrow('match');
    expect(() =>
      strip.setGeometry({
        indices: [0, 1, 3],
        vertices: [0, 0, 1, 0, 0, 1],
        uvs: [0, 0, 1, 0, 0, 1],
      }),
    ).toThrow('outside');
    expect(() =>
      strip.setGeometry({
        indices: [0, 1, 2, 0],
        vertices: [0, 0, 1, 0, 0, 1],
        uvs: [0, 0, 1, 0, 0, 1],
      }),
    ).toThrow('complete triangles');
    expect(() => strip.setVertex(99, 0, 0)).toThrow('out of range');
    expect(() => strip.setUv(0, Number.NaN, 0)).toThrow('finite');
    expect(() =>
      strip.setGeometry({
        topology: 'line-list' as 'triangle-list',
        vertices: [0, 0, 1, 0, 0, 1],
        uvs: [0, 0, 1, 0, 0, 1],
      }),
    ).toThrow('Unsupported');
    strip.destroy();
  });

  it('culls against transformed visual geometry instead of texture bounds', () => {
    const strip = new FlxStrip(330, 20).setGeometry({
      indices: [0, 1, 2],
      uvs: [0, 0, 1, 0, 0, 1],
      vertices: [-20, 0, 0, 0, -20, 20],
    });
    expect(strip.onScreen()).toBe(true);
    strip.x = 341;
    expect(strip.onScreen()).toBe(false);
    strip.destroy();
  });
});
