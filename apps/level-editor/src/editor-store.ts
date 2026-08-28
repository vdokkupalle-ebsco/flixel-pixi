import {
  cloneSnapshot,
  parseLevelProject,
  type LevelEditorSnapshot,
} from './model';

export interface LevelEditorStatus {
  canRedo: boolean;
  canUndo: boolean;
  dirty: boolean;
  label: string;
  revision: number;
  snapshot: LevelEditorSnapshot;
}

type StoreListener = (status: LevelEditorStatus) => void;

function validateSnapshot(snapshot: LevelEditorSnapshot): LevelEditorSnapshot {
  const cloned = cloneSnapshot(snapshot);
  cloned.document = parseLevelProject(cloned.document);
  const entityIds = new Set(
    cloned.document.scenes.flatMap((scene) =>
      scene.entities.map((entity) => entity.id),
    ),
  );
  cloned.selectedEntityIds = [...new Set(cloned.selectedEntityIds)].filter(
    (id) => entityIds.has(id),
  );
  return cloned;
}

function fingerprint(snapshot: LevelEditorSnapshot): string {
  return JSON.stringify(snapshot.document);
}

export class LevelEditorStore {
  readonly #listeners = new Set<StoreListener>();
  readonly #undo: LevelEditorSnapshot[] = [];
  readonly #redo: LevelEditorSnapshot[] = [];
  #snapshot: LevelEditorSnapshot;
  #savedFingerprint: string;
  #label = 'Project ready';
  #revision = 0;

  constructor(initial: LevelEditorSnapshot) {
    this.#snapshot = validateSnapshot(initial);
    this.#savedFingerprint = fingerprint(this.#snapshot);
  }

  get status(): LevelEditorStatus {
    return {
      canRedo: this.#redo.length > 0,
      canUndo: this.#undo.length > 0,
      dirty: fingerprint(this.#snapshot) !== this.#savedFingerprint,
      label: this.#label,
      revision: this.#revision,
      snapshot: cloneSnapshot(this.#snapshot),
    };
  }

  subscribe(listener: StoreListener): () => void {
    this.#listeners.add(listener);
    listener(this.status);
    return () => this.#listeners.delete(listener);
  }

  update(
    label: string,
    change: (draft: LevelEditorSnapshot) => void,
    record = true,
  ): void {
    const next = cloneSnapshot(this.#snapshot);
    change(next);
    const validated = validateSnapshot(next);
    if (JSON.stringify(validated) === JSON.stringify(this.#snapshot)) return;
    if (record) {
      this.#undo.push(cloneSnapshot(this.#snapshot));
      if (this.#undo.length > 100) this.#undo.shift();
      this.#redo.length = 0;
    }
    this.#snapshot = validated;
    this.#label = label;
    this.#revision += 1;
    this.#emit();
  }

  replace(label: string, snapshot: LevelEditorSnapshot): void {
    const next = validateSnapshot(snapshot);
    this.#undo.push(cloneSnapshot(this.#snapshot));
    this.#redo.length = 0;
    this.#snapshot = next;
    this.#label = label;
    this.#revision += 1;
    this.#emit();
  }

  undo(): void {
    const previous = this.#undo.pop();
    if (previous === undefined) return;
    this.#redo.push(cloneSnapshot(this.#snapshot));
    this.#snapshot = previous;
    this.#label = 'Undid change';
    this.#revision += 1;
    this.#emit();
  }

  redo(): void {
    const next = this.#redo.pop();
    if (next === undefined) return;
    this.#undo.push(cloneSnapshot(this.#snapshot));
    this.#snapshot = next;
    this.#label = 'Redid change';
    this.#revision += 1;
    this.#emit();
  }

  markSaved(label = 'Project exported'): void {
    this.#savedFingerprint = fingerprint(this.#snapshot);
    this.#label = label;
    this.#emit();
  }

  #emit(): void {
    const status = this.status;
    this.#listeners.forEach((listener) => listener(status));
  }
}
