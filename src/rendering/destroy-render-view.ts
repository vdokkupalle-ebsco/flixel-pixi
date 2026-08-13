import type { Container } from 'pixi.js';

/**
 * Destroy a renderer-owned Pixi subtree without destroying asset-owned
 * textures or texture sources.
 * @internal
 */
export function destroyRenderView(view: Container): void {
  view.destroy({ children: true, texture: false, textureSource: false });
}
