import {
  MAX_PARTICLE_EFFECT_EMITTERS,
  parseParticleEffect,
  serializeParticlePreset,
  type ParticleEffectDocumentV1,
  type ParticleEmitterLayerV1,
  type ParticlePresetV1,
} from 'flixel-pixi';
import { clonePreset } from './presets';

export const MAX_EMITTERS = MAX_PARTICLE_EFFECT_EMITTERS;
export type { ParticleEffectDocumentV1, ParticleEmitterLayerV1 };

export interface PreviewSettings {
  background: string;
  pointerMode: 'auto' | 'burst' | 'trail';
  scale: 'compact' | 'fit' | 'large';
  timeScale: number;
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
  return parseParticleEffect(document);
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
