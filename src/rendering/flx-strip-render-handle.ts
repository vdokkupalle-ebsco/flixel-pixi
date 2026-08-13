import { Container, Mesh, MeshGeometry } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import type { FlxStrip } from '../objects/flx-strip';
import { destroyRenderView } from './destroy-render-view';
import { FlxFilterChain } from './flx-filter-chain';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';
import type { FlxRenderHandle } from './flx-render-handle';

/** Camera-local Pixi materialization of renderer-neutral strip geometry. @public */
export class FlxStripRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxStrip' });
  readonly mesh: Mesh<MeshGeometry>;

  readonly #owner: FlxStrip;
  readonly #onDestroy: () => void;
  readonly #filterChain = new FlxFilterChain();
  #geometry: MeshGeometry;
  #geometryRevision = -1;
  #destroyed = false;

  constructor(owner: FlxStrip, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.#geometry = createGeometry(owner);
    this.#geometryRevision = owner.geometryRevision;
    this.mesh = new Mesh({
      geometry: this.#geometry,
      texture: owner.renderTexture,
    });
    this.view.addChild(this.mesh);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    if (this.#geometryRevision !== owner.geometryRevision) {
      if (this.#geometry.topology !== owner.topology) {
        const previous = this.#geometry;
        this.#geometry = createGeometry(owner);
        this.mesh.geometry = this.#geometry;
        previous.destroy();
      } else {
        this.#geometry.positions = Float32Array.from(owner.vertices);
        this.#geometry.uvs = Float32Array.from(owner.uvs);
        this.#geometry.indices = Uint32Array.from(owner.indices);
        this.#geometry.getBuffer('aPosition').update();
        this.#geometry.getBuffer('aUV').update();
        this.#geometry.indexBuffer.update();
      }
      this.#geometryRevision = owner.geometryRevision;
    }

    this.mesh.texture = owner.renderTexture;
    this.mesh.roundPixels = !owner.antialiasing;
    this.mesh.scale.set(
      owner.renderFlipped ? -1 : 1,
      owner.renderFlippedY ? -1 : 1,
    );
    this.mesh.position.set(
      owner.renderFlipped ? owner.frameWidth : 0,
      owner.renderFlippedY ? owner.frameHeight : 0,
    );
    this.view.position.set(
      interpolateObjectX(owner, interpolationAlpha) - owner.offset.x,
      interpolateObjectY(owner, interpolationAlpha) - owner.offset.y,
    );
    this.view.origin.set(owner.origin.x, owner.origin.y);
    this.view.scale.set(owner.scale.x, owner.scale.y);
    this.view.angle = interpolateObjectAngle(owner, interpolationAlpha);
    this.view.alpha = owner.alpha;
    this.view.tint = owner.color;
    this.view.blendMode = owner.blend ?? 'normal';
    this.view.visible = owner.exists && owner.visible && owner.alpha > 0;
    this.#filterChain.sync(this.view, owner.filters, owner.filterArea);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#filterChain.destroy(this.view);
    destroyRenderView(this.view);
    this.#geometry.destroy();
    this.#onDestroy();
  }
}

function createGeometry(owner: FlxStrip): MeshGeometry {
  return new MeshGeometry({
    indices: Uint32Array.from(owner.indices),
    positions: Float32Array.from(owner.vertices),
    topology: owner.topology,
    uvs: Float32Array.from(owner.uvs),
  });
}
