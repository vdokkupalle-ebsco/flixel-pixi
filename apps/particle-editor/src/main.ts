import './styles.css';

import {
  serializeParticlePreset,
  type ParticleBlendMode,
  type ParticleCurve,
  type ParticlePresetV1,
  type ParticleVectorRange,
  type PixelBuffer,
} from 'flixel-pixi';

import {
  clonePreset,
  findStarterEffectDocument,
  getDefaultStarterPreset,
  starterPresets,
} from './presets';
import {
  createEffectDocument,
  createLayerId,
  MAX_EMITTERS,
  ParticleEditorStore,
  selectedEmitter,
  type EditorSnapshot,
  type EditorStoreStatus,
  type ParticleEffectDocumentV1,
  type ParticleEmitterLayerV1,
} from './editor-store';
import { renderEditorShell, renderEmitterLayerList } from './editor-shell';
import {
  AUTOSAVE_KEY,
  createEffectBundleZip,
  createMultiEmitterTypeScriptSnippet,
  parseEditorSnapshot,
  parseImportedDocument,
  serializeEditorSnapshot,
  serializeEffectDocument,
} from './io';
import { createParticlePreview } from './preview';
import {
  cloneTextureSelection,
  createPresetTexture,
  destroyTexture,
  loadTextureFile,
  selectTextureFrame,
  texturePngBlob,
  type TextureSelection,
} from './texture';

const host = document.querySelector<HTMLElement>('#app');
if (host === null) throw new Error('Particle editor host was not found.');

const defaultPreview = {
  background: '#07101c',
  pointerMode: 'auto',
  scale: 'fit',
  timeScale: 1,
} as const;

function recoverSnapshot(): EditorSnapshot {
  const saved = localStorage.getItem(AUTOSAVE_KEY);
  if (saved === null) {
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    return {
      document: doc,
      selectedEmitterId: doc.emitters[0]?.layerId ?? '',
      preview: { ...defaultPreview },
    };
  }
  try {
    return parseEditorSnapshot(saved);
  } catch {
    localStorage.removeItem(AUTOSAVE_KEY);
    const starter = getDefaultStarterPreset();
    const doc = createEffectDocument(starter, 'circle');
    return {
      document: doc,
      selectedEmitterId: doc.emitters[0]?.layerId ?? '',
      preview: { ...defaultPreview },
    };
  }
}

const shell = renderEditorShell(host, starterPresets);
const recovered = recoverSnapshot();
const store = new ParticleEditorStore(recovered);
let resetSnapshot = store.status.snapshot;

const customTextures = new Map<string, TextureSelection>();

function getLayerTextureSelection(
  layer: ParticleEmitterLayerV1,
): TextureSelection {
  const custom = customTextures.get(layer.layerId);
  if (custom !== undefined) return custom;
  return createPresetTexture(
    layer.preset.appearance.texture.assetId,
    layer.textureShape,
  );
}

function getLayerTextureBuffer(layer: ParticleEmitterLayerV1): PixelBuffer {
  return getLayerTextureSelection(layer).buffer;
}

let paused = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let renderedFingerprint = '';
let renderedBackground = '';
let renderedPointerMode = '';
let renderedTimeScale = Number.NaN;

const preview = await createParticlePreview(
  shell.canvasHost,
  recovered.document,
  getLayerTextureBuffer,
  (diagnostics) => {
    shell.activeCount.textContent = `${String(diagnostics.activeCount)} / ${String(diagnostics.capacity)}`;
    const reuse = Math.max(
      0,
      diagnostics.emittedCount - diagnostics.activeCount,
    );
    const pool = shell.root.querySelector<HTMLElement>('[data-pool-reuse]');
    if (pool !== null) pool.textContent = `${String(reuse)} reused`;
  },
);

function showToast(message: string): void {
  shell.toast.textContent = message;
  shell.toast.hidden = false;
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    shell.toast.hidden = true;
  }, 2400);
}

function showError(error: unknown): void {
  shell.error.textContent =
    error instanceof Error ? error.message : 'The change could not be applied.';
  shell.error.hidden = false;
}

function clearError(): void {
  shell.error.hidden = true;
  shell.error.textContent = '';
}

function findControl(
  name: string,
): HTMLInputElement | HTMLSelectElement | null {
  const item = shell.form.elements.namedItem(name);
  if (item instanceof HTMLInputElement || item instanceof HTMLSelectElement) {
    return item;
  }
  return null;
}

function control(name: string): HTMLInputElement | HTMLSelectElement {
  const item = findControl(name);
  if (item === null) {
    throw new Error(`Missing editor control ${name}.`);
  }
  return item;
}

function setValue(name: string, value: string | number): void {
  const item = findControl(name);
  if (item !== null) {
    item.value = String(value);
  }
}

function firstCurveValue(
  curve: ParticleCurve | undefined,
  fallback: number,
): number {
  return curve?.stops[0]?.value ?? fallback;
}

function lastCurveValue(
  curve: ParticleCurve | undefined,
  fallback: number,
): number {
  return curve?.stops.at(-1)?.value ?? fallback;
}

function colorToHex(color: number): string {
  return `#${(color >>> 8).toString(16).padStart(6, '0')}`;
}

function hexToColor(hex: string): number {
  return ((Number.parseInt(hex.slice(1), 16) << 8) | 0xff) >>> 0;
}

function vectorRange(
  preset: ParticlePresetV1,
  name: 'acceleration' | 'drag' | 'velocity',
): ParticleVectorRange {
  const existing = preset.motion[name];
  if (existing !== undefined) return existing;
  const created = { x: { max: 0, min: 0 }, y: { max: 0, min: 0 } };
  preset.motion[name] = created;
  return created;
}

function syncForm(status: EditorStoreStatus): void {
  const layer = selectedEmitter(status.snapshot);
  const { preset } = layer;
  const { preview: settings } = status.snapshot;
  const activeTexture = getLayerTextureSelection(layer);

  setValue('name', preset.name);
  setValue('id', preset.id);
  setValue('offsetX', layer.offset.x);
  setValue('offsetY', layer.offset.y);
  setValue('seed', preset.seed);
  setValue('capacity', preset.capacity);
  setValue('space', preset.space);
  setValue('emissionMode', preset.emission.mode);
  setValue(
    'emissionRate',
    preset.emission.mode === 'continuous' ? preset.emission.rate : 48,
  );
  setValue(
    'emissionCount',
    preset.emission.mode === 'burst' ? preset.emission.count : 32,
  );
  control('emissionRate').disabled = preset.emission.mode !== 'continuous';
  control('emissionCount').disabled = preset.emission.mode !== 'burst';
  setValue('lifeMin', preset.lifespan.min);
  setValue('lifeMax', preset.lifespan.max);
  setValue('spawnShape', preset.spawn.shape);
  setValue(
    'spawnWidth',
    preset.spawn.shape === 'rectangle' ? preset.spawn.width : 0,
  );
  setValue(
    'spawnHeight',
    preset.spawn.shape === 'rectangle' ? preset.spawn.height : 0,
  );
  setValue(
    'spawnRadius',
    preset.spawn.shape === 'circle' ? preset.spawn.radius : 0,
  );
  control('spawnWidth').disabled = preset.spawn.shape !== 'rectangle';
  control('spawnHeight').disabled = preset.spawn.shape !== 'rectangle';
  control('spawnRadius').disabled = preset.spawn.shape !== 'circle';
  for (const [prefix, range] of [
    ['velocity', vectorRange(preset, 'velocity')],
    ['acceleration', vectorRange(preset, 'acceleration')],
    ['drag', vectorRange(preset, 'drag')],
  ] as const) {
    setValue(`${prefix}XMin`, range.x.min);
    setValue(`${prefix}XMax`, range.x.max);
    setValue(`${prefix}YMin`, range.y.min);
    setValue(`${prefix}YMax`, range.y.max);
  }
  const colors = preset.appearance.colors ?? [];
  setValue('blendMode', preset.appearance.blendMode ?? 'normal');
  setValue('startColor', colorToHex(colors[0]?.color ?? 0x1de8f1ff));
  setValue('endColor', colorToHex(colors.at(-1)?.color ?? 0xff397eff));
  setValue('alphaStart', firstCurveValue(preset.appearance.alpha, 1));
  setValue('alphaEnd', lastCurveValue(preset.appearance.alpha, 0));
  setValue('scaleStart', firstCurveValue(preset.appearance.scale, 1));
  setValue('scaleEnd', lastCurveValue(preset.appearance.scale, 0));
  setValue('angleMin', preset.appearance.rotation?.initial.min ?? 0);
  setValue('angleMax', preset.appearance.rotation?.initial.max ?? 0);
  setValue('spinMin', preset.appearance.rotation?.velocity.min ?? 0);
  setValue('spinMax', preset.appearance.rotation?.velocity.max ?? 0);
  setValue('textureShape', layer.textureShape);
  setValue('textureColumns', activeTexture.columns);
  setValue('textureRows', activeTexture.rows);
  setValue('textureFrame', activeTexture.frame);
  control('textureColumns').disabled = activeTexture.kind === 'generated';
  control('textureRows').disabled = activeTexture.kind === 'generated';
  control('textureFrame').disabled = activeTexture.kind === 'generated';
  const textureLabel = shell.root.querySelector<HTMLElement>(
    '[data-texture-label]',
  );
  if (textureLabel !== null) textureLabel.textContent = activeTexture.label;

  const seed = shell.root.querySelector<HTMLElement>('[data-seed]');
  const documentStatus = shell.root.querySelector<HTMLElement>(
    '[data-document-status]',
  );
  const undo = shell.root.querySelector<HTMLButtonElement>(
    '[data-action="undo"]',
  );
  const redo = shell.root.querySelector<HTMLButtonElement>(
    '[data-action="redo"]',
  );
  if (seed !== null) seed.textContent = String(preset.seed);
  if (documentStatus !== null) {
    documentStatus.textContent = status.dirty ? 'Saving…' : status.label;
  }
  if (undo !== null) undo.disabled = !status.canUndo;
  if (redo !== null) redo.disabled = !status.canRedo;

  // Update Emitter List
  shell.emitterList.innerHTML = renderEmitterLayerList(
    status.snapshot.document,
    status.snapshot.selectedEmitterId,
  );
  shell.addEmitterButton.disabled =
    status.snapshot.document.emitters.length >= MAX_EMITTERS;

  // Combined capacity warning
  const totalCapacity = status.snapshot.document.emitters
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.preset.capacity, 0);
  const capacityWarning = shell.root.querySelector<HTMLElement>(
    '[data-capacity-warning]',
  );
  if (capacityWarning !== null) {
    capacityWarning.hidden = totalCapacity <= 2000;
  }

  const background = shell.root.querySelector<HTMLInputElement>(
    '[data-preview-background]',
  );
  const scale = shell.root.querySelector<HTMLSelectElement>(
    '[data-preview-scale]',
  );
  const pointerMode = shell.root.querySelector<HTMLSelectElement>(
    '[data-pointer-mode]',
  );
  const speed =
    shell.root.querySelector<HTMLSelectElement>('[data-time-scale]');
  const canvasFrame = shell.root.querySelector<HTMLElement>(
    '[data-canvas-frame]',
  );
  if (background !== null) background.value = settings.background;
  if (pointerMode !== null) pointerMode.value = settings.pointerMode;
  if (scale !== null) scale.value = settings.scale;
  if (speed !== null) speed.value = String(settings.timeScale);
  if (canvasFrame !== null) {
    canvasFrame.dataset.scale = settings.scale;
    canvasFrame.style.setProperty('--preview-background', settings.background);
  }
}

function numberValue(element: HTMLInputElement | HTMLSelectElement): number {
  const value = Number(element.value);
  if (!Number.isFinite(value)) throw new TypeError('Enter a finite number.');
  return value;
}

function particleBlendMode(value: string): ParticleBlendMode {
  if (value === 'add' || value === 'multiply' || value === 'screen') {
    return value;
  }
  return 'normal';
}

function isDarkBackground(color: string): boolean {
  const value = Number.parseInt(color.slice(1), 16);
  const red = (value >>> 16) & 0xff;
  const green = (value >>> 8) & 0xff;
  const blue = value & 0xff;
  return (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255 < 0.45;
}

function applyControlChange(
  element: HTMLInputElement | HTMLSelectElement,
): void {
  const name = element.name;
  const value = element.value;
  store.update(`Changed ${name}`, (draft) => {
    const layer = selectedEmitter(draft);
    const { preset } = layer;
    const number = () => numberValue(element);
    switch (name) {
      case 'name':
        preset.name = value;
        layer.name = value;
        break;
      case 'id':
        preset.id = value;
        break;
      case 'offsetX':
        layer.offset.x = number();
        break;
      case 'offsetY':
        layer.offset.y = number();
        break;
      case 'seed':
        preset.seed = number();
        break;
      case 'capacity':
        preset.capacity = number();
        break;
      case 'space':
        preset.space = value === 'local' ? 'local' : 'world';
        break;
      case 'blendMode':
        preset.appearance.blendMode = particleBlendMode(value);
        if (
          value === 'multiply' &&
          isDarkBackground(draft.preview.background)
        ) {
          draft.preview.background = '#e8edf2';
        }
        break;
      case 'emissionMode':
        preset.emission =
          value === 'burst'
            ? { count: 32, mode: 'burst' }
            : { mode: 'continuous', rate: 48 };
        break;
      case 'emissionRate':
        preset.emission = { mode: 'continuous', rate: number() };
        break;
      case 'emissionCount':
        preset.emission = { count: number(), mode: 'burst' };
        break;
      case 'lifeMin':
        preset.lifespan.min = number();
        break;
      case 'lifeMax':
        preset.lifespan.max = number();
        break;
      case 'spawnShape':
        preset.spawn =
          value === 'rectangle'
            ? { height: 16, shape: 'rectangle', width: 32 }
            : value === 'circle'
              ? { radius: 16, shape: 'circle' }
              : { shape: 'point' };
        break;
      case 'spawnWidth':
        if (preset.spawn.shape === 'rectangle') preset.spawn.width = number();
        break;
      case 'spawnHeight':
        if (preset.spawn.shape === 'rectangle') preset.spawn.height = number();
        break;
      case 'spawnRadius':
        if (preset.spawn.shape === 'circle') preset.spawn.radius = number();
        break;
      case 'velocityXMin':
        vectorRange(preset, 'velocity').x.min = number();
        break;
      case 'velocityXMax':
        vectorRange(preset, 'velocity').x.max = number();
        break;
      case 'velocityYMin':
        vectorRange(preset, 'velocity').y.min = number();
        break;
      case 'velocityYMax':
        vectorRange(preset, 'velocity').y.max = number();
        break;
      case 'accelerationXMin':
        vectorRange(preset, 'acceleration').x.min = number();
        break;
      case 'accelerationXMax':
        vectorRange(preset, 'acceleration').x.max = number();
        break;
      case 'accelerationYMin':
        vectorRange(preset, 'acceleration').y.min = number();
        break;
      case 'accelerationYMax':
        vectorRange(preset, 'acceleration').y.max = number();
        break;
      case 'dragXMin':
        vectorRange(preset, 'drag').x.min = number();
        break;
      case 'dragXMax':
        vectorRange(preset, 'drag').x.max = number();
        break;
      case 'dragYMin':
        vectorRange(preset, 'drag').y.min = number();
        break;
      case 'dragYMax':
        vectorRange(preset, 'drag').y.max = number();
        break;
      case 'startColor':
        preset.appearance.colors = [
          { color: hexToColor(value), time: 0 },
          {
            color: preset.appearance.colors?.at(-1)?.color ?? 0xff397eff,
            time: 1,
          },
        ];
        break;
      case 'endColor':
        preset.appearance.colors = [
          {
            color: preset.appearance.colors?.[0]?.color ?? 0x1de8f1ff,
            time: 0,
          },
          { color: hexToColor(value), time: 1 },
        ];
        break;
      case 'alphaStart':
        preset.appearance.alpha = {
          stops: [
            { time: 0, value: number() },
            { time: 1, value: lastCurveValue(preset.appearance.alpha, 0) },
          ],
        };
        break;
      case 'alphaEnd':
        preset.appearance.alpha = {
          stops: [
            { time: 0, value: firstCurveValue(preset.appearance.alpha, 1) },
            { time: 1, value: number() },
          ],
        };
        break;
      case 'scaleStart':
        preset.appearance.scale = {
          stops: [
            { time: 0, value: number() },
            { time: 1, value: lastCurveValue(preset.appearance.scale, 0) },
          ],
        };
        break;
      case 'scaleEnd':
        preset.appearance.scale = {
          stops: [
            { time: 0, value: firstCurveValue(preset.appearance.scale, 1) },
            { time: 1, value: number() },
          ],
        };
        break;
      case 'angleMin':
        preset.appearance.rotation = {
          initial: {
            max: preset.appearance.rotation?.initial.max ?? 0,
            min: number(),
          },
          velocity: preset.appearance.rotation?.velocity ?? { max: 0, min: 0 },
        };
        break;
      case 'angleMax':
        preset.appearance.rotation = {
          initial: {
            max: number(),
            min: preset.appearance.rotation?.initial.min ?? 0,
          },
          velocity: preset.appearance.rotation?.velocity ?? { max: 0, min: 0 },
        };
        break;
      case 'spinMin':
        preset.appearance.rotation = {
          initial: preset.appearance.rotation?.initial ?? { max: 0, min: 0 },
          velocity: {
            max: preset.appearance.rotation?.velocity.max ?? 0,
            min: number(),
          },
        };
        break;
      case 'spinMax':
        preset.appearance.rotation = {
          initial: preset.appearance.rotation?.initial ?? { max: 0, min: 0 },
          velocity: {
            max: number(),
            min: preset.appearance.rotation?.velocity.min ?? 0,
          },
        };
        break;
      default:
        break;
    }
  });
}

function downloadEffect(effectDoc: ParticleEffectDocumentV1): void {
  const blob = new Blob([serializeEffectDocument(effectDoc)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${effectDoc.id}.effect.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadPreset(preset: ParticlePresetV1): void {
  const blob = new Blob([serializeParticlePreset(preset, { space: 2 })], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${preset.id}.particle.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadTexture(): Promise<void> {
  const currentLayer = selectedEmitter(store.status.snapshot);
  const currentTexture = getLayerTextureSelection(currentLayer);
  const blob = await texturePngBlob(currentTexture.buffer);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${currentLayer.preset.appearance.texture.assetId}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function setTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('flixel-pixi:particle-editor:theme', theme);
}

setTheme(
  localStorage.getItem('flixel-pixi:particle-editor:theme') === 'light'
    ? 'light'
    : 'dark',
);

function documentFingerprint(snapshot: EditorSnapshot): string {
  return JSON.stringify({
    emitters: snapshot.document.emitters.map((e) => ({
      enabled: e.enabled,
      layerId: e.layerId,
      offset: e.offset,
      preset: serializeParticlePreset(e.preset),
      textureShape: e.textureShape,
    })),
  });
}

store.subscribe((status) => {
  clearError();
  syncForm(status);

  const nextFingerprint = documentFingerprint(status.snapshot);
  if (nextFingerprint !== renderedFingerprint) {
    preview.load(status.snapshot.document, getLayerTextureBuffer);
    if (paused) preview.pause();
    renderedFingerprint = nextFingerprint;
  }
  if (status.snapshot.preview.background !== renderedBackground) {
    preview.setBackground(status.snapshot.preview.background);
    renderedBackground = status.snapshot.preview.background;
  }
  if (status.snapshot.preview.pointerMode !== renderedPointerMode) {
    preview.setPointerMode(status.snapshot.preview.pointerMode);
    renderedPointerMode = status.snapshot.preview.pointerMode;
  }
  if (status.snapshot.preview.timeScale !== renderedTimeScale) {
    preview.setTimeScale(status.snapshot.preview.timeScale);
    renderedTimeScale = status.snapshot.preview.timeScale;
  }
  if (status.dirty) {
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(
        AUTOSAVE_KEY,
        serializeEditorSnapshot(store.status.snapshot),
      );
      store.markSaved();
    }, 350);
  }
});

shell.form.addEventListener('change', (event) => {
  const element = event.target;
  if (!(
    element instanceof HTMLInputElement || element instanceof HTMLSelectElement
  ))
    return;
  if (element.matches('[data-texture-input]')) return;
  if (element.name === 'textureShape') {
    const shape = element.value === 'square' ? 'square' : 'circle';
    const currentLayer = selectedEmitter(store.status.snapshot);
    const custom = customTextures.get(currentLayer.layerId);
    if (custom !== undefined) {
      destroyTexture(custom);
      customTextures.delete(currentLayer.layerId);
    }
    store.update('Changed drawing shape', (draft) => {
      selectedEmitter(draft).textureShape = shape;
    });
    showToast(`${shape === 'circle' ? 'Circle' : 'Square'} drawing selected`);
    return;
  }
  if (
    ['textureColumns', 'textureRows', 'textureFrame'].includes(element.name)
  ) {
    try {
      const currentLayer = selectedEmitter(store.status.snapshot);
      const existing = getLayerTextureSelection(currentLayer);
      const next = selectTextureFrame(
        existing,
        numberValue(control('textureColumns')),
        numberValue(control('textureRows')),
        numberValue(control('textureFrame')),
      );
      customTextures.set(currentLayer.layerId, next);
      preview.load(store.status.snapshot.document, getLayerTextureBuffer);
      if (paused) preview.pause();
      syncForm(store.status);
    } catch (error) {
      showError(error);
    }
    return;
  }
  try {
    const revealsMultiply =
      element.name === 'blendMode' &&
      element.value === 'multiply' &&
      isDarkBackground(store.status.snapshot.preview.background);
    applyControlChange(element);
    if (revealsMultiply) {
      showToast('Light preview selected so Multiply remains visible');
    }
  } catch (error) {
    showError(error);
  }
});

const textureInput = shell.form.querySelector<HTMLInputElement>(
  '[data-texture-input]',
);
textureInput?.addEventListener('change', async () => {
  const file = textureInput.files?.[0];
  if (file === undefined) return;
  try {
    const currentLayer = selectedEmitter(store.status.snapshot);
    const existing = customTextures.get(currentLayer.layerId);
    if (existing !== undefined) destroyTexture(existing);
    const next = await loadTextureFile(file);
    customTextures.set(currentLayer.layerId, next);
    const label = shell.root.querySelector<HTMLElement>('[data-texture-label]');
    if (label !== null) label.textContent = next.label;
    store.update('Changed texture', (draft) => {
      selectedEmitter(draft).preset.appearance.texture = {
        assetId: file.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      };
    });
    showToast('Texture loaded');
  } catch (error) {
    showError(error);
  }
});

shell.presetList.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const card = target.closest<HTMLElement>('[data-preset-id]');
  if (card === null) return;
  const presetId = card.dataset.presetId ?? '';
  const starterEffect = findStarterEffectDocument(presetId);
  if (starterEffect === undefined) return;

  for (const texture of customTextures.values()) {
    destroyTexture(texture);
  }
  customTextures.clear();
  resetSnapshot = {
    document: starterEffect,
    selectedEmitterId: starterEffect.emitters[0]?.layerId ?? '',
    preview: { ...store.status.snapshot.preview },
  };
  store.replace(`Loaded ${starterEffect.name}`, resetSnapshot);
  showToast(`${starterEffect.name} loaded`);
});

shell.root.addEventListener('input', (event) => {
  const element = event.target;
  if (
    element instanceof HTMLInputElement &&
    element.matches('[data-preview-background]')
  ) {
    preview.setBackground(element.value);
    renderedBackground = element.value;
    const canvasFrame = shell.root.querySelector<HTMLElement>(
      '[data-canvas-frame]',
    );
    canvasFrame?.style.setProperty('--preview-background', element.value);
  }
});

shell.root.addEventListener('change', (event) => {
  const element = event.target;
  if (
    element instanceof HTMLInputElement &&
    element.matches('[data-preview-background]')
  ) {
    store.update('Changed preview background', (draft) => {
      draft.preview.background = element.value;
    });
  } else if (
    element instanceof HTMLSelectElement &&
    element.matches('[data-pointer-mode]')
  ) {
    store.update('Changed pointer interaction', (draft) => {
      draft.preview.pointerMode =
        element.value === 'burst' || element.value === 'trail'
          ? element.value
          : 'auto';
    });
  } else if (
    element instanceof HTMLSelectElement &&
    element.matches('[data-preview-scale]')
  ) {
    store.update('Changed canvas size', (draft) => {
      draft.preview.scale =
        element.value === 'compact' || element.value === 'large'
          ? element.value
          : 'fit';
    });
  } else if (
    element instanceof HTMLSelectElement &&
    element.matches('[data-time-scale]')
  ) {
    store.update('Changed preview speed', (draft) => {
      draft.preview.timeScale = Number(element.value);
    });
  }
});

shell.root.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const actionElement = target.closest<HTMLElement>('[data-action]');
  if (actionElement === null) return;
  const action = actionElement.dataset.action;
  if (action === undefined) return;

  switch (action) {
    case 'add-emitter': {
      if (store.status.snapshot.document.emitters.length >= MAX_EMITTERS)
        return;
      const count = store.status.snapshot.document.emitters.length + 1;
      const layerId = createLayerId();
      const basePreset = clonePreset(
        starterPresets[0] ?? getDefaultStarterPreset(),
      );
      basePreset.id = `emitter-${String(count)}`;
      basePreset.name = `Emitter ${String(count)}`;
      store.update(`Added Emitter ${String(count)}`, (draft) => {
        draft.document.emitters.push({
          layerId,
          name: `Emitter ${String(count)}`,
          enabled: true,
          offset: { x: 0, y: 0 },
          textureShape: 'circle',
          preset: basePreset,
        });
        draft.selectedEmitterId = layerId;
      });
      showToast(`Emitter ${String(count)} added`);
      break;
    }
    case 'select-emitter': {
      const layerId = actionElement.dataset.layerId;
      if (
        layerId !== undefined &&
        layerId !== store.status.snapshot.selectedEmitterId
      ) {
        store.update('Selected emitter', (draft) => {
          draft.selectedEmitterId = layerId;
        });
      }
      break;
    }
    case 'toggle-emitter': {
      const layerId = actionElement.dataset.layerId;
      if (layerId !== undefined) {
        store.update('Toggled emitter layer', (draft) => {
          const layer = draft.document.emitters.find(
            (e) => e.layerId === layerId,
          );
          if (layer !== undefined) {
            layer.enabled = !layer.enabled;
          }
        });
      }
      break;
    }
    case 'move-emitter-up': {
      const layerId =
        actionElement.dataset.layerId ??
        store.status.snapshot.selectedEmitterId;
      const doc = store.status.snapshot.document;
      const index = doc.emitters.findIndex((e) => e.layerId === layerId);
      if (index > 0) {
        store.update('Moved emitter up', (draft) => {
          const temp = draft.document.emitters[index];
          const prev = draft.document.emitters[index - 1];
          if (temp && prev) {
            draft.document.emitters[index] = prev;
            draft.document.emitters[index - 1] = temp;
          }
        });
        showToast('Layer moved up');
      }
      break;
    }
    case 'move-emitter-down': {
      const layerId =
        actionElement.dataset.layerId ??
        store.status.snapshot.selectedEmitterId;
      const doc = store.status.snapshot.document;
      const index = doc.emitters.findIndex((e) => e.layerId === layerId);
      if (index >= 0 && index < doc.emitters.length - 1) {
        store.update('Moved emitter down', (draft) => {
          const temp = draft.document.emitters[index];
          const next = draft.document.emitters[index + 1];
          if (temp && next) {
            draft.document.emitters[index] = next;
            draft.document.emitters[index + 1] = temp;
          }
        });
        showToast('Layer moved down');
      }
      break;
    }
    case 'duplicate-emitter': {
      if (store.status.snapshot.document.emitters.length >= MAX_EMITTERS)
        return;
      const layerId =
        actionElement.dataset.layerId ??
        store.status.snapshot.selectedEmitterId;
      const current =
        store.status.snapshot.document.emitters.find(
          (e) => e.layerId === layerId,
        ) ?? selectedEmitter(store.status.snapshot);
      const newLayerId = createLayerId();
      const currentTexture = customTextures.get(current.layerId);
      const duplicateTexture =
        currentTexture === undefined
          ? undefined
          : await cloneTextureSelection(currentTexture);
      const duplicatePreset = clonePreset(current.preset);
      duplicatePreset.id = `${current.preset.id}-copy-${String(Date.now()).slice(-4)}`;
      duplicatePreset.name = `${current.name} copy`;
      store.update(`Duplicated ${current.name}`, (draft) => {
        const index = draft.document.emitters.findIndex(
          (e) => e.layerId === current.layerId,
        );
        const newLayer: ParticleEmitterLayerV1 = {
          layerId: newLayerId,
          name: `${current.name} copy`,
          enabled: true,
          offset: { ...current.offset },
          textureShape: current.textureShape,
          preset: duplicatePreset,
        };
        draft.document.emitters.splice(index + 1, 0, newLayer);
        draft.selectedEmitterId = newLayerId;
      });
      if (duplicateTexture !== undefined) {
        customTextures.set(newLayerId, duplicateTexture);
      }
      showToast(`${current.name} duplicated`);
      break;
    }
    case 'delete-emitter': {
      if (store.status.snapshot.document.emitters.length <= 1) return;
      const layerId =
        actionElement.dataset.layerId ??
        store.status.snapshot.selectedEmitterId;
      const current =
        store.status.snapshot.document.emitters.find(
          (e) => e.layerId === layerId,
        ) ?? selectedEmitter(store.status.snapshot);
      const doc = store.status.snapshot.document;
      const index = doc.emitters.findIndex(
        (e) => e.layerId === current.layerId,
      );
      const nextSelected =
        doc.emitters[index === 0 ? 1 : index - 1]?.layerId ?? '';
      store.update(`Deleted ${current.name}`, (draft) => {
        draft.document.emitters = draft.document.emitters.filter(
          (e) => e.layerId !== current.layerId,
        );
        if (draft.selectedEmitterId === current.layerId) {
          draft.selectedEmitterId = nextSelected;
        }
      });
      const custom = customTextures.get(current.layerId);
      if (custom !== undefined) {
        destroyTexture(custom);
        customTextures.delete(current.layerId);
      }
      showToast(`${current.name} deleted`);
      break;
    }
    case 'undo':
      store.undo();
      break;
    case 'redo':
      store.redo();
      break;
    case 'reset': {
      for (const texture of customTextures.values()) {
        destroyTexture(texture);
      }
      customTextures.clear();
      store.replace('Reset preset', resetSnapshot);
      showToast('Preset reset');
      break;
    }
    case 'pause':
      paused = !paused;
      shell.pauseButton.textContent = paused ? 'Resume' : 'Pause';
      shell.pauseButton.setAttribute('aria-pressed', String(paused));
      if (paused) preview.pause();
      else preview.resume();
      shell.status.textContent = paused ? 'Preview paused' : 'Preview running';
      break;
    case 'restart':
      preview.restart();
      shell.status.textContent = 'Effect restarted';
      break;
    case 'burst':
      preview.burst();
      shell.status.textContent = 'Single burst fired';
      break;
    case 'generated-texture': {
      const layer = selectedEmitter(store.status.snapshot);
      const custom = customTextures.get(layer.layerId);
      if (custom !== undefined) {
        destroyTexture(custom);
        customTextures.delete(layer.layerId);
      }
      preview.load(store.status.snapshot.document, getLayerTextureBuffer);
      syncForm(store.status);
      showToast('Generated effect texture restored');
      break;
    }
    case 'download-texture':
      try {
        await downloadTexture();
        showToast('Texture PNG downloaded');
      } catch (error) {
        showError(error);
      }
      break;
    case 'import':
      shell.importInput.click();
      break;
    case 'export-effect':
      downloadEffect(store.status.snapshot.document);
      showToast('Effect document exported');
      break;
    case 'export-emitter':
    case 'export':
      downloadPreset(selectedEmitter(store.status.snapshot).preset);
      showToast('Emitter preset exported');
      break;
    case 'export-bundle':
      try {
        const zipBlob = await createEffectBundleZip(
          store.status.snapshot.document,
          async (layer) => {
            const sel = getLayerTextureSelection(layer);
            return texturePngBlob(sel.buffer);
          },
        );
        const url = URL.createObjectURL(zipBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${store.status.snapshot.document.id}.bundle.zip`;
        anchor.click();
        URL.revokeObjectURL(url);
        showToast('Effect bundle ZIP downloaded');
      } catch (error) {
        showError(error);
      }
      break;
    case 'copy-code':
      try {
        await navigator.clipboard.writeText(
          createMultiEmitterTypeScriptSnippet(store.status.snapshot.document),
        );
        showToast('TypeScript copied');
      } catch (error) {
        showError(error);
      }
      break;
    case 'theme':
      setTheme(
        document.documentElement.dataset.theme === 'light' ? 'dark' : 'light',
      );
      break;
    default:
      break;
  }
});

shell.importInput.addEventListener('change', async () => {
  const file = shell.importInput.files?.[0];
  if (file === undefined) return;
  try {
    const document = parseImportedDocument(await file.text());
    for (const texture of customTextures.values()) {
      destroyTexture(texture);
    }
    customTextures.clear();
    resetSnapshot = {
      document,
      selectedEmitterId: document.emitters[0]?.layerId ?? '',
      preview: { ...store.status.snapshot.preview },
    };
    store.replace(`Imported ${document.name}`, resetSnapshot);
    showToast(`Imported ${document.name}`);
  } catch (error) {
    showError(error);
  }
  shell.importInput.value = '';
});

window.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) store.redo();
    else store.undo();
  }
  if (event.key.toLowerCase() === 's') {
    event.preventDefault();
    downloadEffect(store.status.snapshot.document);
  }
});

shell.status.textContent = 'Preview running';
window.addEventListener(
  'beforeunload',
  () => {
    if (saveTimer !== undefined) clearTimeout(saveTimer);
    localStorage.setItem(
      AUTOSAVE_KEY,
      serializeEditorSnapshot(store.status.snapshot),
    );
    for (const texture of customTextures.values()) {
      destroyTexture(texture);
    }
    customTextures.clear();
    preview.destroy();
  },
  { once: true },
);
