import type { EntityDefinition } from '@flixel-pixi/schemas';

import type { LevelEditorStatus, LevelEditorStore } from './editor-store';
import {
  activeScene,
  activeSceneSettings,
  entityProperties,
  type LevelEditorSnapshot,
} from './model';
import { bodyForEntity, updateBodyShape } from './physics-authoring';

interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface PointerInteraction {
  entityId: string;
  kind: 'move' | 'rotate' | 'scale';
  original: EntityDefinition;
  pointerId: number;
  startWorldX: number;
  startWorldY: number;
}

interface EntityVisual {
  entity: EntityDefinition;
  height: number;
  width: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function numberProperty(
  properties: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = properties[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cloneEntity(entity: EntityDefinition): EntityDefinition {
  return structuredClone(entity);
}

export class SceneViewport {
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D;
  readonly #store: LevelEditorStore;
  readonly #images = new Map<string, HTMLImageElement>();
  readonly #resizeObserver: ResizeObserver;
  #status: LevelEditorStatus;
  #interaction: PointerInteraction | undefined;
  #previewEntity: EntityDefinition | undefined;
  #zoom = 1;
  #animationFrame = 0;
  #resizeFrame = 0;

  constructor(canvas: HTMLCanvasElement, store: LevelEditorStore) {
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('Canvas 2D is not available.');
    this.#canvas = canvas;
    this.#context = context;
    this.#store = store;
    this.#status = store.status;
    this.#resizeObserver = new ResizeObserver(() => this.#scheduleResize());
    this.#resizeObserver.observe(canvas);
    canvas.addEventListener('pointerdown', this.#onPointerDown);
    canvas.addEventListener('pointermove', this.#onPointerMove);
    canvas.addEventListener('pointerup', this.#onPointerUp);
    canvas.addEventListener('pointercancel', this.#cancelInteraction);
    canvas.addEventListener('dblclick', () => this.focusSelection());
    canvas.addEventListener('wheel', this.#onWheel, { passive: false });
    store.subscribe((status) => {
      this.#status = status;
      this.#queueRender();
    });
    this.#resize();
  }

  destroy(): void {
    this.#resizeObserver.disconnect();
    cancelAnimationFrame(this.#animationFrame);
    cancelAnimationFrame(this.#resizeFrame);
    this.#canvas.removeEventListener('pointerdown', this.#onPointerDown);
    this.#canvas.removeEventListener('pointermove', this.#onPointerMove);
    this.#canvas.removeEventListener('pointerup', this.#onPointerUp);
    this.#canvas.removeEventListener('pointercancel', this.#cancelInteraction);
    this.#canvas.removeEventListener('wheel', this.#onWheel);
  }

  get zoom(): number {
    return this.#zoom;
  }

  setZoom(value: number): void {
    this.#zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    this.#queueRender();
  }

  focusSelection(): void {
    this.#zoom = 1;
    this.#queueRender();
  }

  render(): void {
    const context = this.#context;
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = this.#canvas.width / dpr;
    const canvasHeight = this.#canvas.height / dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const snapshot = this.#status.snapshot;
    const settings = activeSceneSettings(snapshot);
    const transform = this.#viewTransform(snapshot);
    context.save();
    context.translate(transform.offsetX, transform.offsetY);
    context.scale(transform.scale, transform.scale);
    context.fillStyle = settings.background;
    context.fillRect(0, 0, settings.width, settings.height);
    this.#drawGrid(snapshot);

    const scene = activeScene(snapshot);
    const entities = [...scene.entities].sort(
      (a, b) =>
        numberProperty(entityProperties(a), 'zIndex', 0) -
        numberProperty(entityProperties(b), 'zIndex', 0),
    );
    for (const entity of entities) {
      this.#drawEntity(
        this.#previewEntity?.id === entity.id ? this.#previewEntity : entity,
        snapshot,
      );
    }
    this.#drawPhysics(snapshot);
    context.restore();
  }

  #resize(): void {
    const rect = this.#canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.#canvas.width !== width || this.#canvas.height !== height) {
      this.#canvas.width = width;
      this.#canvas.height = height;
    }
    this.#queueRender();
  }

  #scheduleResize(): void {
    cancelAnimationFrame(this.#resizeFrame);
    this.#resizeFrame = requestAnimationFrame(() => this.#resize());
  }

  #queueRender(): void {
    cancelAnimationFrame(this.#animationFrame);
    this.#animationFrame = requestAnimationFrame(() => this.render());
  }

  #viewTransform(snapshot: LevelEditorSnapshot): ViewTransform {
    const settings = activeSceneSettings(snapshot);
    const rect = this.#canvas.getBoundingClientRect();
    const padding = 48;
    const fit = Math.min(
      (rect.width - padding * 2) / settings.width,
      (rect.height - padding * 2) / settings.height,
    );
    const scale = Math.max(0.05, fit) * this.#zoom;
    return {
      offsetX: (rect.width - settings.width * scale) / 2,
      offsetY: (rect.height - settings.height * scale) / 2,
      scale,
    };
  }

  #drawGrid(snapshot: LevelEditorSnapshot): void {
    const settings = activeSceneSettings(snapshot);
    const context = this.#context;
    context.beginPath();
    context.strokeStyle = 'rgba(177, 189, 202, 0.12)';
    context.lineWidth = 1 / this.#viewTransform(snapshot).scale;
    for (let x = 0; x <= settings.width; x += settings.gridSize) {
      context.moveTo(x, 0);
      context.lineTo(x, settings.height);
    }
    for (let y = 0; y <= settings.height; y += settings.gridSize) {
      context.moveTo(0, y);
      context.lineTo(settings.width, y);
    }
    context.stroke();
  }

  #visual(entity: EntityDefinition): EntityVisual {
    const properties = entityProperties(entity);
    const scale = entity.scale ?? { x: 1, y: 1 };
    return {
      entity,
      height: numberProperty(properties, 'height', 64) * scale.y,
      width: numberProperty(properties, 'width', 64) * scale.x,
    };
  }

  #drawEntity(entity: EntityDefinition, snapshot: LevelEditorSnapshot): void {
    const context = this.#context;
    const properties = entityProperties(entity);
    if (properties.visible === false) return;
    const { width, height } = this.#visual(entity);
    const originX = numberProperty(properties, 'originX', 0.5);
    const originY = numberProperty(properties, 'originY', 0.5);
    const left = -width * originX;
    const top = -height * originY;
    context.save();
    context.translate(entity.position.x, entity.position.y);
    context.rotate(entity.rotation ?? 0);

    const assetId =
      typeof properties.assetId === 'string' ? properties.assetId : '';
    const asset = snapshot.document.assets.find(
      (candidate) => candidate.id === assetId,
    );
    if (entity.type === 'particle-effect') {
      const gradient = context.createRadialGradient(0, 0, 2, 0, 0, width / 2);
      gradient.addColorStop(0, 'rgba(255, 225, 120, 0.95)');
      gradient.addColorStop(0.35, 'rgba(255, 57, 126, 0.75)');
      gradient.addColorStop(1, 'rgba(255, 57, 126, 0)');
      context.fillStyle = gradient;
      context.fillRect(left, top, width, height);
    } else if (asset !== undefined) {
      const image = this.#getImage(asset.id, asset.src);
      if (image.complete && image.naturalWidth > 0) {
        const frameWidth = Math.floor(
          numberProperty(properties, 'frameWidth', 0),
        );
        const frameHeight = Math.floor(
          numberProperty(properties, 'frameHeight', 0),
        );
        if (frameWidth > 0 && frameHeight > 0) {
          const column = Math.max(
            0,
            Math.floor(numberProperty(properties, 'frameColumn', 0)),
          );
          const row = Math.max(
            0,
            Math.floor(numberProperty(properties, 'frameRow', 0)),
          );
          const sourceX = Math.min(
            Math.max(0, image.naturalWidth - frameWidth),
            column * frameWidth,
          );
          const sourceY = Math.min(
            Math.max(0, image.naturalHeight - frameHeight),
            row * frameHeight,
          );
          context.drawImage(
            image,
            sourceX,
            sourceY,
            Math.min(frameWidth, image.naturalWidth),
            Math.min(frameHeight, image.naturalHeight),
            left,
            top,
            width,
            height,
          );
        } else context.drawImage(image, left, top, width, height);
      } else {
        this.#drawPlaceholder(left, top, width, height);
      }
    } else {
      this.#drawPlaceholder(left, top, width, height);
    }

    if (snapshot.selectedEntityIds.includes(entity.id)) {
      const scale = this.#viewTransform(snapshot).scale;
      context.strokeStyle = '#1de8f1';
      context.lineWidth = 2 / scale;
      context.setLineDash([7 / scale, 4 / scale]);
      context.strokeRect(left, top, width, height);
      context.setLineDash([]);
      const handle = 8 / scale;
      context.fillStyle = '#f7f9fc';
      context.strokeStyle = '#087f8c';
      context.lineWidth = 1 / scale;
      context.fillRect(
        left + width - handle / 2,
        top + height - handle / 2,
        handle,
        handle,
      );
      context.strokeRect(
        left + width - handle / 2,
        top + height - handle / 2,
        handle,
        handle,
      );
      context.beginPath();
      context.moveTo(0, top);
      context.lineTo(0, top - 24 / scale);
      context.stroke();
      context.beginPath();
      context.arc(0, top - 28 / scale, 5 / scale, 0, Math.PI * 2);
      context.fillStyle = '#ff397e';
      context.fill();
    }
    context.restore();
  }

  #drawPlaceholder(
    left: number,
    top: number,
    width: number,
    height: number,
  ): void {
    const context = this.#context;
    context.fillStyle = '#172132';
    context.fillRect(left, top, width, height);
    context.strokeStyle = '#7f8d9d';
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left + width, top + height);
    context.moveTo(left + width, top);
    context.lineTo(left, top + height);
    context.stroke();
  }

  #drawPhysics(snapshot: LevelEditorSnapshot): void {
    const context = this.#context;
    const scene = activeScene(snapshot);
    const world = activeSceneSettings(snapshot).physics;
    const entityByBodyId = new Map(
      world.bodies.map((body) => [
        body.id,
        scene.entities.find((entity) => entity.id === body.entityId),
      ]),
    );
    const lineWidth = 1.5 / this.#viewTransform(snapshot).scale;
    context.save();
    context.strokeStyle = 'rgba(255, 57, 126, 0.9)';
    context.fillStyle = 'rgba(255, 57, 126, 0.12)';
    context.lineWidth = lineWidth;
    context.setLineDash([
      5 / this.#viewTransform(snapshot).scale,
      3 / this.#viewTransform(snapshot).scale,
    ]);
    for (const body of world.bodies) {
      const entity = scene.entities.find(
        (candidate) => candidate.id === body.entityId,
      );
      if (
        entity === undefined ||
        !snapshot.selectedEntityIds.includes(entity.id)
      )
        continue;
      context.save();
      context.translate(entity.position.x, entity.position.y);
      context.rotate(entity.rotation ?? 0);
      for (const shape of body.shapes) {
        const offset = shape.offset ?? { x: 0, y: 0 };
        if (shape.kind === 'box') {
          context.fillRect(
            offset.x - shape.width / 2,
            offset.y - shape.height / 2,
            shape.width,
            shape.height,
          );
          context.strokeRect(
            offset.x - shape.width / 2,
            offset.y - shape.height / 2,
            shape.width,
            shape.height,
          );
        } else if (shape.kind === 'circle') {
          context.beginPath();
          context.arc(offset.x, offset.y, shape.radius, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        } else if (shape.kind === 'capsule') {
          const width = shape.axis === 'y' ? shape.radius * 2 : shape.length;
          const height = shape.axis === 'y' ? shape.length : shape.radius * 2;
          context.roundRect(
            offset.x - width / 2,
            offset.y - height / 2,
            width,
            height,
            shape.radius,
          );
          context.fill();
          context.stroke();
        }
      }
      context.restore();
    }
    context.setLineDash([]);
    context.strokeStyle = '#a78bfa';
    context.fillStyle = '#a78bfa';
    for (const joint of world.joints ?? []) {
      const entityA = entityByBodyId.get(joint.bodyA);
      const entityB = entityByBodyId.get(joint.bodyB);
      if (entityA === undefined || entityB === undefined) continue;
      context.beginPath();
      context.moveTo(entityA.position.x, entityA.position.y);
      context.lineTo(entityB.position.x, entityB.position.y);
      context.stroke();
      const anchor =
        joint.type === 'distance'
          ? {
              x: (joint.anchorA.x + joint.anchorB.x) / 2,
              y: (joint.anchorA.y + joint.anchorB.y) / 2,
            }
          : joint.anchor;
      context.beginPath();
      context.arc(
        anchor.x,
        anchor.y,
        4 / this.#viewTransform(snapshot).scale,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.restore();
  }

  #getImage(assetId: string, src: string): HTMLImageElement {
    const cached = this.#images.get(assetId);
    if (cached !== undefined && cached.src === src) return cached;
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => this.#queueRender(), { once: true });
    image.src = src;
    this.#images.set(assetId, image);
    return image;
  }

  #worldPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.#canvas.getBoundingClientRect();
    const transform = this.#viewTransform(this.#status.snapshot);
    return {
      x: (event.clientX - rect.left - transform.offsetX) / transform.scale,
      y: (event.clientY - rect.top - transform.offsetY) / transform.scale,
    };
  }

  #hitTest(x: number, y: number): EntityDefinition | undefined {
    const scene = activeScene(this.#status.snapshot);
    return [...scene.entities]
      .sort(
        (a, b) =>
          numberProperty(entityProperties(b), 'zIndex', 0) -
          numberProperty(entityProperties(a), 'zIndex', 0),
      )
      .find((entity) => {
        const properties = entityProperties(entity);
        if (properties.visible === false || properties.locked === true)
          return false;
        const { width, height } = this.#visual(entity);
        const dx = x - entity.position.x;
        const dy = y - entity.position.y;
        const angle = -(entity.rotation ?? 0);
        const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
        const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
        const originX = numberProperty(properties, 'originX', 0.5);
        const originY = numberProperty(properties, 'originY', 0.5);
        return (
          localX >= -width * originX &&
          localX <= width * (1 - originX) &&
          localY >= -height * originY &&
          localY <= height * (1 - originY)
        );
      });
  }

  #interactionKind(
    entity: EntityDefinition,
    x: number,
    y: number,
  ): PointerInteraction['kind'] {
    const tool = this.#status.snapshot.tool;
    if (tool === 'rotate') return 'rotate';
    if (tool === 'scale') return 'scale';
    const visual = this.#visual(entity);
    const distanceFromCorner = Math.hypot(
      x - (entity.position.x + visual.width / 2),
      y - (entity.position.y + visual.height / 2),
    );
    if (
      distanceFromCorner <
      18 / this.#viewTransform(this.#status.snapshot).scale
    )
      return 'scale';
    return 'move';
  }

  #onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const point = this.#worldPoint(event);
    const entity = this.#hitTest(point.x, point.y);
    if (entity === undefined) {
      this.#store.update(
        'Cleared selection',
        (draft) => {
          draft.selectedEntityIds = [];
        },
        false,
      );
      return;
    }
    const additive = event.shiftKey;
    this.#store.update(
      'Selected entity',
      (draft) => {
        draft.selectedEntityIds = additive
          ? [...new Set([...draft.selectedEntityIds, entity.id])]
          : [entity.id];
      },
      false,
    );
    this.#interaction = {
      entityId: entity.id,
      kind: this.#interactionKind(entity, point.x, point.y),
      original: cloneEntity(entity),
      pointerId: event.pointerId,
      startWorldX: point.x,
      startWorldY: point.y,
    };
    this.#previewEntity = cloneEntity(entity);
    this.#canvas.setPointerCapture(event.pointerId);
  };

  #onPointerMove = (event: PointerEvent): void => {
    const interaction = this.#interaction;
    if (interaction === undefined || interaction.pointerId !== event.pointerId)
      return;
    const point = this.#worldPoint(event);
    const preview = cloneEntity(interaction.original);
    const dx = point.x - interaction.startWorldX;
    const dy = point.y - interaction.startWorldY;
    if (interaction.kind === 'move') {
      preview.position.x += dx;
      preview.position.y += dy;
      if (this.#status.snapshot.snapToGrid && !event.altKey) {
        const grid = activeSceneSettings(this.#status.snapshot).gridSize;
        preview.position.x = Math.round(preview.position.x / grid) * grid;
        preview.position.y = Math.round(preview.position.y / grid) * grid;
      }
    } else if (interaction.kind === 'rotate') {
      const startAngle = Math.atan2(
        interaction.startWorldY - preview.position.y,
        interaction.startWorldX - preview.position.x,
      );
      const currentAngle = Math.atan2(
        point.y - preview.position.y,
        point.x - preview.position.x,
      );
      preview.rotation =
        (interaction.original.rotation ?? 0) + currentAngle - startAngle;
      if (event.shiftKey)
        preview.rotation =
          Math.round(preview.rotation / (Math.PI / 12)) * (Math.PI / 12);
    } else {
      const startDistance = Math.max(
        1,
        Math.hypot(
          interaction.startWorldX - preview.position.x,
          interaction.startWorldY - preview.position.y,
        ),
      );
      const scale = Math.max(
        0.05,
        Math.hypot(point.x - preview.position.x, point.y - preview.position.y) /
          startDistance,
      );
      preview.scale = {
        x:
          interaction.original.scale?.x === undefined
            ? scale
            : interaction.original.scale.x * scale,
        y:
          interaction.original.scale?.y === undefined
            ? scale
            : interaction.original.scale.y * scale,
      };
    }
    this.#previewEntity = preview;
    this.#queueRender();
  };

  #onPointerUp = (event: PointerEvent): void => {
    const interaction = this.#interaction;
    const preview = this.#previewEntity;
    if (
      interaction === undefined ||
      preview === undefined ||
      interaction.pointerId !== event.pointerId
    )
      return;
    this.#store.update(`Changed ${interaction.kind}`, (draft) => {
      const entity = activeScene(draft).entities.find(
        (candidate) => candidate.id === interaction.entityId,
      );
      if (entity === undefined) return;
      entity.position = { ...preview.position };
      if (preview.rotation === undefined) delete entity.rotation;
      else entity.rotation = preview.rotation;
      if (preview.scale === undefined) delete entity.scale;
      else entity.scale = { ...preview.scale };
      const body = bodyForEntity(activeSceneSettings(draft).physics, entity.id);
      const shape = body?.shapes[0];
      if (
        body !== undefined &&
        shape !== undefined &&
        (shape.kind === 'box' ||
          shape.kind === 'circle' ||
          shape.kind === 'capsule')
      ) {
        const properties = entityProperties(entity);
        updateBodyShape(
          body,
          shape.kind,
          numberProperty(properties, 'width', 64) * (entity.scale?.x ?? 1),
          numberProperty(properties, 'height', 64) * (entity.scale?.y ?? 1),
        );
      }
    });
    this.#canvas.releasePointerCapture(event.pointerId);
    this.#interaction = undefined;
    this.#previewEntity = undefined;
    this.#queueRender();
  };

  #cancelInteraction = (): void => {
    this.#interaction = undefined;
    this.#previewEntity = undefined;
    this.#queueRender();
  };

  #onWheel = (event: WheelEvent): void => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    this.setZoom(this.#zoom * (event.deltaY < 0 ? 1.1 : 0.9));
  };
}
