// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { FlxGame } from '../../src/core/flx-game';
import { FlxSprite } from '../../src/objects/flx-sprite';
import { FlxState } from '../../src/core/flx-state';
import { syncWorldToRenderer } from '../../src/rendering/flx-world-sync';
import { FlxCameraRenderer } from '../../src/rendering/flx-camera-renderer';
import { Container, type Renderer } from 'pixi.js';

describe('syncWorldToRenderer', () => {
  let game: FlxGame;

  const createMockRenderer = (): Renderer =>
    ({
      resolution: 1,
      render: () => {},
      destroy: () => {},
    } as unknown as Renderer);

  afterEach(() => {
    game?.destroy();
  });

  it('registers a sprite added to the state after the first sync', () => {
    game = new FlxGame(640, 480, class extends FlxState {});
    game.step(); // Swaps initial requestedState into game.state
    const renderer = new FlxCameraRenderer(createMockRenderer(), new Container(), game.context);

    // Initial sync
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(0);

    // Add sprite
    game.state!.add(new FlxSprite(0, 0));

    // Sync again
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);
  });

  it('does not duplicate handles when syncing twice unchanged', () => {
    game = new FlxGame(640, 480, class extends FlxState {});
    game.step();
    const renderer = new FlxCameraRenderer(createMockRenderer(), new Container(), game.context);

    game.state!.add(new FlxSprite(0, 0));

    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);

    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);
  });

  it('removes handles when a sprite is removed from the state', () => {
    game = new FlxGame(640, 480, class extends FlxState {});
    game.step();
    const renderer = new FlxCameraRenderer(createMockRenderer(), new Container(), game.context);

    const sprite = new FlxSprite(0, 0);
    game.state!.add(sprite);

    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(1);

    game.state!.remove(sprite);
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(0);
  });
});
