import { Container, Sprite, Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { destroyRenderView } from '../../src/rendering/destroy-render-view';

describe('destroyRenderView', () => {
  it('destroys and detaches the renderer subtree without destroying textures', () => {
    const parent = new Container();
    const view = new Container();
    const sprite = new Sprite(Texture.WHITE);
    parent.addChild(view);
    view.addChild(sprite);

    destroyRenderView(view);

    expect(view.destroyed).toBe(true);
    expect(sprite.destroyed).toBe(true);
    expect(parent.children).not.toContain(view);
    expect(Texture.WHITE.source.destroyed).toBe(false);
    parent.destroy();
  });
});
