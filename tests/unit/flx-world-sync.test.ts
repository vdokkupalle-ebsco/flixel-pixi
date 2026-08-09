// @vitest-environment happy-dom
import { Container, type Renderer } from 'pixi.js';
import { afterEach, describe, expect, it } from 'vitest';

import { FlxGame } from '../../src/core/flx-game';
import { FlxState } from '../../src/core/flx-state';
import { FlxSubState } from '../../src/core/flx-sub-state';
import { FlxSprite } from '../../src/objects/flx-sprite';
import { FlxSpriteContainer } from '../../src/objects/flx-sprite-group';
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
  return class extends FlxState {};
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

  it('registers a sprite composite once and lets its handle own member branches', () => {
    game = new FlxGame(640, 480, emptyState());
    game.step();
    const renderer = new FlxCameraRenderer(
      fakeRenderer(),
      new Container(),
      game.context,
    );
    const state = requireState(game);
    const composite = new FlxSpriteContainer(20, 30);
    const member = composite.add(new FlxSprite(4, 5));
    state.add(composite);

    syncWorldToRenderer(game, renderer);
    expect(Array.from(renderer.registeredObjects)).toEqual([composite]);
    expect(composite.renderHandleCount).toBe(1);
    expect(member.renderHandleCount).toBe(1);

    state.remove(composite);
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(0);
    expect(composite.renderHandleCount).toBe(0);
    expect(member.renderHandleCount).toBe(0);
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

  it('clears renderablesDirty after sync and sets it on add/remove', () => {
    game = new FlxGame(640, 480, emptyState());
    game.step();
    const renderer = new FlxCameraRenderer(
      fakeRenderer(),
      new Container(),
      game.context,
    );
    const state = requireState(game);

    expect(game.context.renderablesDirty).toBe(true);
    syncWorldToRenderer(game, renderer);
    expect(game.context.renderablesDirty).toBe(false);

    const sprite = new FlxSprite(0, 0);
    state.add(sprite);
    expect(game.context.renderablesDirty).toBe(true);
    syncWorldToRenderer(game, renderer);
    expect(game.context.renderablesDirty).toBe(false);
    expect(renderer.registeredObjectCount).toBe(1);

    state.remove(sprite);
    expect(game.context.renderablesDirty).toBe(true);
    syncWorldToRenderer(game, renderer);
    expect(renderer.registeredObjectCount).toBe(0);
  });

  it('composes persistent parent and nested substate renderables', () => {
    game = new FlxGame(640, 480, emptyState());
    game.step();
    const renderer = new FlxCameraRenderer(
      fakeRenderer(),
      new Container(),
      game.context,
    );
    const state = requireState(game);
    const parentSprite = state.add(new FlxSprite(0, 0));
    const overlay = new FlxSubState();
    const overlaySprite = overlay.add(new FlxSprite(0, 0));

    state.openSubState(overlay);
    game.step();
    syncWorldToRenderer(game, renderer);
    expect(Array.from(renderer.registeredObjects)).toEqual([
      parentSprite,
      overlaySprite,
    ]);

    state.persistentDraw = false;
    game.context.markRenderablesDirty();
    syncWorldToRenderer(game, renderer);
    expect(Array.from(renderer.registeredObjects)).toEqual([overlaySprite]);

    overlay.close();
    game.step();
    syncWorldToRenderer(game, renderer);
    expect(Array.from(renderer.registeredObjects)).toEqual([parentSprite]);
  });
});
