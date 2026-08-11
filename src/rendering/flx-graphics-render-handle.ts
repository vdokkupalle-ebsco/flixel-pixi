import { Container, FillGradient, Graphics } from 'pixi.js';

import type { FlxCamera } from '../core/flx-camera';
import {
  FlxGradient,
  type FlxGraphics,
  type FlxGraphicsFill,
  type FlxGraphicsStroke,
  type FlxGraphicsStyle,
} from '../objects/flx-graphics';
import { FlxFilterChain } from './flx-filter-chain';
import {
  interpolateObjectAngle,
  interpolateObjectX,
  interpolateObjectY,
} from './flx-render-interpolation';
import type { FlxRenderHandle } from './flx-render-handle';

/** Camera-local Pixi materialization of stable vector commands. @public */
export class FlxGraphicsRenderHandle implements FlxRenderHandle {
  readonly view = new Container({ label: 'FlxGraphics' });
  readonly graphics = new Graphics({ label: 'FlxGraphicsGeometry' });

  readonly #owner: FlxGraphics;
  readonly #onDestroy: () => void;
  readonly #filterChain = new FlxFilterChain();
  readonly #gradients = new Map<FlxGradient, FillGradient>();
  #graphicsRevision = -1;
  #destroyed = false;

  constructor(owner: FlxGraphics, onDestroy: () => void = () => undefined) {
    this.#owner = owner;
    this.#onDestroy = onDestroy;
    this.view.addChild(this.graphics);
    this.sync();
  }

  get destroyed(): boolean {
    return this.#destroyed;
  }

  sync(camera?: FlxCamera, interpolationAlpha = 1): void {
    void camera;
    if (this.#destroyed) return;
    const owner = this.#owner;
    if (this.#graphicsRevision !== owner.graphicsRevision) this.#rebuild();
    this.graphics.roundPixels = !owner.antialiasing;
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
    this.graphics.clear();
    this.#releaseGradients();
    this.view.destroy({ children: true });
    this.#onDestroy();
  }

  #rebuild(): void {
    this.graphics.clear();
    this.#releaseGradients();
    for (const command of this.#owner.renderCommands) {
      switch (command.kind) {
        case 'rect':
          if (command.radius > 0) {
            this.graphics.roundRect(
              command.x,
              command.y,
              command.width,
              command.height,
              command.radius,
            );
          } else {
            this.graphics.rect(
              command.x,
              command.y,
              command.width,
              command.height,
            );
          }
          this.#applyStyle(command.style);
          break;
        case 'circle':
          this.graphics.circle(command.x, command.y, command.radius);
          this.#applyStyle(command.style);
          break;
        case 'ellipse':
          this.graphics.ellipse(
            command.x,
            command.y,
            command.radiusX,
            command.radiusY,
          );
          this.#applyStyle(command.style);
          break;
        case 'polygon':
        case 'line':
          this.graphics.poly([...command.points], command.close);
          this.#applyStyle(command.style);
          break;
        case 'star':
          this.graphics.star(
            command.x,
            command.y,
            command.points,
            command.radius,
            command.innerRadius,
            command.rotation,
          );
          this.#applyStyle(command.style);
          break;
      }
    }
    this.#graphicsRevision = this.#owner.graphicsRevision;
  }

  #applyStyle(style: Readonly<FlxGraphicsStyle>): void {
    if (style.fill !== undefined) this.graphics.fill(this.#fill(style.fill));
    if (style.stroke !== undefined) {
      this.graphics.stroke(this.#stroke(style.stroke));
    }
  }

  #fill(
    fill: FlxGraphicsFill,
  ): FillGradient | { alpha: number; color: number } {
    if (fill instanceof FlxGradient) return this.#gradient(fill);
    return splitRgba(fill);
  }

  #stroke(stroke: FlxGraphicsStroke): object {
    const base = {
      alignment: stroke.alignment,
      cap: stroke.cap,
      join: stroke.join,
      width: stroke.width,
    };
    if (stroke.fill instanceof FlxGradient) {
      return { ...base, fill: this.#gradient(stroke.fill) };
    }
    return { ...base, ...splitRgba(stroke.fill) };
  }

  #gradient(descriptor: FlxGradient): FillGradient {
    let gradient = this.#gradients.get(descriptor);
    if (gradient !== undefined) return gradient;
    const colorStops = descriptor.stops.map((stop) => ({
      color: rgbaCss(stop.color),
      offset: stop.offset,
    }));
    gradient =
      descriptor.type === 'linear'
        ? new FillGradient({
            colorStops,
            end: descriptor.end,
            start: descriptor.start,
            textureSpace: 'local',
            type: 'linear',
          })
        : new FillGradient({
            center: descriptor.center,
            colorStops,
            innerRadius: descriptor.innerRadius,
            outerCenter: descriptor.outerCenter,
            outerRadius: descriptor.outerRadius,
            textureSpace: 'local',
            type: 'radial',
          });
    this.#gradients.set(descriptor, gradient);
    return gradient;
  }

  #releaseGradients(): void {
    for (const gradient of this.#gradients.values()) gradient.destroy();
    this.#gradients.clear();
  }
}

function splitRgba(rgba: number): { alpha: number; color: number } {
  return { alpha: (rgba & 0xff) / 255, color: (rgba >>> 8) & 0xffffff };
}

function rgbaCss(rgba: number): string {
  const red = (rgba >>> 24) & 0xff;
  const green = (rgba >>> 16) & 0xff;
  const blue = (rgba >>> 8) & 0xff;
  const alpha = (rgba & 0xff) / 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
