import {
  parseParticlePreset,
  serializeParticlePreset,
  type ParticlePresetV1,
} from 'flixel-pixi';
import { clonePreset } from './presets';

export const MAX_EMITTERS = 8;

export interface PreviewSettings {
  background: string;
  pointerMode: 'auto' | 'burst' | 'trail';
  scale: 'compact' | 'fit' | 'large';
  timeScale: number;
}

export interface ParticleEmitterLayerV1 {
  layerId: string;
  name: string;
  enabled: boolean;
  offset: {
    x: number;
    y: number;
  };
  textureShape: 'circle' | 'square';
  preset: ParticlePresetV1;
}

export interface ParticleEffectDocumentV1 {
  kind: 'flixel-pixi-particle-effect';
  version: 1;
  id: string;
  name: string;
  emitters: ParticleEmitterLayerV1[];
}

export interface EditorSnapshot {
  document: ParticleEffectDocumentV1;
  selectedEmitterId: string;
  preview: PreviewSettings;
}

export interface EditorStoreStatus {
  canRedo: boolean;
  canUndo: boolean;
  dirty: boolean;
  label: string;
  snapshot: EditorSnapshot;
}

type StoreListener = (status: EditorStoreStatus) => void;

let layerCounter = 0;
export function createLayerId(): string {
  layerCounter += 1;
  return `layer-${Date.now().toString(36)}-${String(layerCounter)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEffectDocument(
  preset: ParticlePresetV1,
  textureShape: 'circle' | 'square' = 'circle',
  name = preset.name,
  id = preset.id,
): ParticleEffectDocumentV1 {
  const layerId = createLayerId();
  return {
    kind: 'flixel-pixi-particle-effect',
    version: 1,
    id,
    name,
    emitters: [
      {
        layerId,
        name: preset.name,
        enabled: true,
        offset: { x: 0, y: 0 },
        textureShape,
        preset: clonePreset(preset),
      },
    ],
  };
}

export function cloneEffectDocument(
  document: ParticleEffectDocumentV1,
): ParticleEffectDocumentV1 {
  return {
    kind: 'flixel-pixi-particle-effect',
    version: 1,
    id: document.id,
    name: document.name,
    emitters: document.emitters.map((emitter) => ({
      layerId: emitter.layerId,
      name: emitter.name,
      enabled: emitter.enabled,
      offset: { ...emitter.offset },
      textureShape: emitter.textureShape,
      preset: clonePreset(emitter.preset),
    })),
  };
}

export function validateEffectDocument(
  document: unknown,
): ParticleEffectDocumentV1 {
  if (typeof document !== 'object' || document === null) {
    throw new TypeError('Particle effect document must be an object.');
  }
  const record = document as Record<string, unknown>;
  if (record.kind !== 'flixel-pixi-particle-effect') {
    throw new TypeError('Invalid effect document kind.');
  }
  if (record.version !== 1) {
    throw new TypeError(
      `Unsupported effect document version: ${String(record.version)}`,
    );
  }
  if (typeof record.id !== 'string' || record.id.trim().length === 0) {
    throw new TypeError('Effect document requires a non-empty id.');
  }
  if (typeof record.name !== 'string' || record.name.trim().length === 0) {
    throw new TypeError('Effect document requires a non-empty name.');
  }
  if (!Array.isArray(record.emitters)) {
    throw new TypeError('Effect document emitters must be an array.');
  }
  if (record.emitters.length === 0) {
    throw new RangeError('Effect document must contain at least one emitter.');
  }
  if (record.emitters.length > MAX_EMITTERS) {
    throw new RangeError(
      `Effect document cannot exceed ${String(MAX_EMITTERS)} emitters.`,
    );
  }

  const seenIds = new Set<string>();
  const emitters: ParticleEmitterLayerV1[] = record.emitters.map(
    (item, index) => {
      if (typeof item !== 'object' || item === null) {
        throw new TypeError(
          `Emitter layer at index ${String(index)} must be an object.`,
        );
      }
      const layer = item as Record<string, unknown>;
      if (
        typeof layer.layerId !== 'string' ||
        layer.layerId.trim().length === 0
      ) {
        throw new TypeError(
          `Emitter layer at index ${String(index)} requires a valid layerId.`,
        );
      }
      if (seenIds.has(layer.layerId)) {
        throw new Error(`Duplicate emitter layerId: "${layer.layerId}".`);
      }
      seenIds.add(layer.layerId);

      if (typeof layer.name !== 'string' || layer.name.trim().length === 0) {
        throw new TypeError(
          `Emitter layer "${layer.layerId}" requires a non-empty name.`,
        );
      }
      if (typeof layer.enabled !== 'boolean') {
        throw new TypeError(
          `Emitter layer "${layer.layerId}" enabled property must be a boolean.`,
        );
      }
      if (
        typeof layer.offset !== 'object' ||
        layer.offset === null ||
        typeof (layer.offset as Record<string, unknown>).x !== 'number' ||
        !Number.isFinite((layer.offset as Record<string, unknown>).x) ||
        typeof (layer.offset as Record<string, unknown>).y !== 'number' ||
        !Number.isFinite((layer.offset as Record<string, unknown>).y)
      ) {
        throw new TypeError(
          `Emitter layer "${layer.layerId}" offset must contain finite x and y numbers.`,
        );
      }
      if (layer.textureShape !== 'circle' && layer.textureShape !== 'square') {
        throw new TypeError(
          `Emitter layer "${layer.layerId}" textureShape must be 'circle' or 'square'.`,
        );
      }

      return {
        layerId: layer.layerId,
        name: layer.name,
        enabled: layer.enabled,
        offset: {
          x: (layer.offset as { x: number; y: number }).x,
          y: (layer.offset as { x: number; y: number }).y,
        },
        textureShape: layer.textureShape,
        preset: parseParticlePreset(layer.preset),
      };
    },
  );

  return {
    kind: 'flixel-pixi-particle-effect',
    version: 1,
    id: record.id,
    name: record.name,
    emitters,
  };
}

export function selectedEmitter(
  snapshot: EditorSnapshot,
): ParticleEmitterLayerV1 {
  const layer = snapshot.document.emitters.find(
    (emitter) => emitter.layerId === snapshot.selectedEmitterId,
  );
  if (layer === undefined) {
    throw new Error(
      `Selected emitter "${snapshot.selectedEmitterId}" does not exist in the document.`,
    );
  }
  return layer;
}

export function cloneSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    document: cloneEffectDocument(snapshot.document),
    selectedEmitterId: snapshot.selectedEmitterId,
    preview: { ...snapshot.preview },
  };
}

export function validateSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  const document = validateEffectDocument(snapshot.document);
  if (
    !document.emitters.some(
      (emitter) => emitter.layerId === snapshot.selectedEmitterId,
    )
  ) {
    throw new Error(
      `Selected emitter "${snapshot.selectedEmitterId}" was not found in effect document.`,
    );
  }
  return {
    document,
    selectedEmitterId: snapshot.selectedEmitterId,
    preview: { ...snapshot.preview },
  };
}

function fingerprint(snapshot: EditorSnapshot): string {
  return JSON.stringify({
    document: {
      ...snapshot.document,
      emitters: snapshot.document.emitters.map((emitter) => ({
        ...emitter,
        preset: serializeParticlePreset(emitter.preset),
      })),
    },
    selectedEmitterId: snapshot.selectedEmitterId,
    preview: snapshot.preview,
  });
}

export class ParticleEditorStore {
  readonly #listeners = new Set<StoreListener>();
  readonly #undo: EditorSnapshot[] = [];
  readonly #redo: EditorSnapshot[] = [];
  #snapshot: EditorSnapshot;
  #savedFingerprint: string;
  #label = 'Loaded preset';

  constructor(initial: EditorSnapshot) {
    this.#snapshot = validateSnapshot(cloneSnapshot(initial));
    this.#savedFingerprint = fingerprint(this.#snapshot);
  }

  get status(): EditorStoreStatus {
    return {
      canRedo: this.#redo.length > 0,
      canUndo: this.#undo.length > 0,
      dirty: fingerprint(this.#snapshot) !== this.#savedFingerprint,
      label: this.#label,
      snapshot: cloneSnapshot(this.#snapshot),
    };
  }

  subscribe(listener: StoreListener): () => void {
    this.#listeners.add(listener);
    listener(this.status);
    return () => this.#listeners.delete(listener);
  }

  update(label: string, change: (draft: EditorSnapshot) => void): void {
    const next = cloneSnapshot(this.#snapshot);
    change(next);
    const validated = validateSnapshot(next);
    if (fingerprint(validated) === fingerprint(this.#snapshot)) return;
    this.#undo.push(cloneSnapshot(this.#snapshot));
    if (this.#undo.length > 100) this.#undo.shift();
    this.#redo.length = 0;
    this.#snapshot = validated;
    this.#label = label;
    this.#emit();
  }

  replace(label: string, snapshot: EditorSnapshot): void {
    const next = validateSnapshot(cloneSnapshot(snapshot));
    this.#undo.push(cloneSnapshot(this.#snapshot));
    this.#redo.length = 0;
    this.#snapshot = next;
    this.#label = label;
    this.#emit();
  }

  undo(): void {
    const previous = this.#undo.pop();
    if (previous === undefined) return;
    this.#redo.push(cloneSnapshot(this.#snapshot));
    this.#snapshot = previous;
    this.#label = 'Undid change';
    this.#emit();
  }

  redo(): void {
    const next = this.#redo.pop();
    if (next === undefined) return;
    this.#undo.push(cloneSnapshot(this.#snapshot));
    this.#snapshot = next;
    this.#label = 'Redid change';
    this.#emit();
  }

  markSaved(label = 'All changes saved'): void {
    this.#savedFingerprint = fingerprint(this.#snapshot);
    this.#label = label;
    this.#emit();
  }

  #emit(): void {
    const status = this.status;
    this.#listeners.forEach((listener) => listener(status));
  }
}
