import {
  parseParticlePreset,
  serializeParticlePreset,
  type ParticlePresetV1,
} from 'flixel-pixi';
import { clonePreset } from './presets';

export interface PreviewSettings {
  background: string;
  pointerMode: 'auto' | 'burst' | 'trail';
  scale: 'compact' | 'fit' | 'large';
  textureShape: 'circle' | 'square';
  timeScale: number;
}
export interface EditorSnapshot {
  preset: ParticlePresetV1;
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

function cloneSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    preset: clonePreset(snapshot.preset),
    preview: { ...snapshot.preview },
  };
}

function fingerprint(snapshot: EditorSnapshot): string {
  return `${serializeParticlePreset(snapshot.preset)}\n${JSON.stringify(snapshot.preview)}`;
}

export class ParticleEditorStore {
  readonly #listeners = new Set<StoreListener>();
  readonly #undo: EditorSnapshot[] = [];
  readonly #redo: EditorSnapshot[] = [];
  #snapshot: EditorSnapshot;
  #savedFingerprint: string;
  #label = 'Loaded preset';

  constructor(initial: EditorSnapshot) {
    this.#snapshot = cloneSnapshot(initial);
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
    next.preset = parseParticlePreset(next.preset);
    if (fingerprint(next) === fingerprint(this.#snapshot)) return;
    this.#undo.push(cloneSnapshot(this.#snapshot));
    if (this.#undo.length > 100) this.#undo.shift();
    this.#redo.length = 0;
    this.#snapshot = next;
    this.#label = label;
    this.#emit();
  }

  replace(label: string, snapshot: EditorSnapshot): void {
    const next = cloneSnapshot(snapshot);
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
