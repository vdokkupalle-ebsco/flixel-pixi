// @vitest-environment happy-dom
import { Container, type Renderer } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';

import { FlxGame } from '../../src/core/flx-game';
import { FlxState } from '../../src/core/flx-state';
import { FlxSprite } from '../../src/objects/flx-sprite';
import { FlxCameraRenderer } from '../../src/rendering/flx-camera-renderer';
import { syncWorldToRenderer } from '../../src/rendering/flx-world-sync';

function fakeRenderer(): Renderer {
  return {
    resolution: 1,
    render(): void {
      /* no-op for unit tests */
    },
    destroy(): void {
      /* no-op for unit tests */
    },
  } as unknown as Renderer;
}

function emptyState(): typeof FlxState {
  return class extends FlxState { };
}

function requireState(game: FlxGame): FlxState {
  const state = game.state;
  expect(state).not.toBeNull();
  if (state === null) throw new Error('expected active state');
  return state;
}

describe('syncWorldToRenderer', () => {
  let game: FlxGame | undefined;

  afterEach(() => {
    game?.destroy();
    game = undefined;
  });

  it('registers a sprite added to the state after the first sync', () => {
    game = new FlxGame(640, 480, emptyState());
    game.step();
    const renderer = new FlxCameraRenderer(
      fakeRenderer(),
      new Container(),
      game.context,
    );
    const state = requireState(game);

    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(0);

    state.add(new FlxSprite(0, 0));
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);
  });

  it('does not duplicate handles when syncing twice unchanged', () => {
    game = new FlxGame(640, 480, emptyState());
    game.step();
    const renderer = new FlxCameraRenderer(
      fakeRenderer(),
      new Container(),
      game.context,
    );
    const state = requireState(game);

    state.add(new FlxSprite(0, 0));
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);

    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);
  });

  it('removes handles when a sprite is removed from the state', () => {
    game = new FlxGame(640, 480, emptyState());
    game.step();
    const renderer = new FlxCameraRenderer(
      fakeRenderer(),
      new Container(),
      game.context,
    );
    const state = requireState(game);

    const sprite = new FlxSprite(0, 0);
    state.add(sprite);
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);

    state.remove(sprite);
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(0);
  });
});
