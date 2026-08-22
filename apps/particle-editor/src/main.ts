import './styles.css';

import {
  serializeParticlePreset,
  type ParticleCurve,
  type ParticlePresetV1,
  type ParticleVectorRange,
} from 'flixel-pixi';

import {
  ParticleEditorStore,
  type EditorSnapshot,
  type EditorStoreStatus,
} from './editor-store';
import { renderEditorShell } from './editor-shell';
import {
  AUTOSAVE_KEY,
  createTypeScriptSnippet,
  parseEditorSnapshot,
  parseImportedPreset,
  serializeEditorSnapshot,
} from './io';
import {
  clonePreset,
  findStarterPreset,
  getDefaultStarterPreset,
  starterPresets,
} from './presets';
import { createParticlePreview } from './preview';
import {
  createDefaultTexture,
  destroyTexture,
  loadTextureFile,
  selectTextureFrame,
  type TextureSelection,
} from './texture';

const host = document.querySelector<HTMLElement>('#app');
if (host === null) throw new Error('Particle editor host was not found.');

const defaultPreview = {
  background: '#07101c',
  scale: 'fit',
  timeScale: 1,
} as const;

function recoverSnapshot(): EditorSnapshot {
  const saved = localStorage.getItem(AUTOSAVE_KEY);
  if (saved === null) {
    return {
      preset: getDefaultStarterPreset(),
      preview: { ...defaultPreview },
    };
  }
  try {
    return parseEditorSnapshot(saved);
  } catch {
    localStorage.removeItem(AUTOSAVE_KEY);
    return {
      preset: getDefaultStarterPreset(),
      preview: { ...defaultPreview },
    };
  }
}

const shell = renderEditorShell(host, starterPresets);
const recovered = recoverSnapshot();
const store = new ParticleEditorStore(recovered);
let resetSnapshot = store.status.snapshot;
let texture: TextureSelection = createDefaultTexture();
let paused = false;
let timelineStartedAt = performance.now();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let renderedPreset = serializeParticlePreset(recovered.preset);
let renderedBackground = '';
let renderedTimeScale = Number.NaN;

const preview = await createParticlePreview(
  shell.canvasHost,
  recovered.preset,
  texture.buffer,
  (diagnostics) => {
    shell.activeCount.textContent = `${String(diagnostics.activeCount)} / ${String(diagnostics.capacity)}`;
    const reuse = Math.max(
      0,
      diagnostics.emittedCount - diagnostics.activeCount,
    );
    const pool = shell.root.querySelector<HTMLElement>('[data-pool-reuse]');
    if (pool !== null) pool.textContent = `${String(reuse)} reused`;
    updateTimeline(store.status.snapshot.preset);
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

function control(name: string): HTMLInputElement | HTMLSelectElement {
  const item = shell.form.elements.namedItem(name);
  if (!(
    item instanceof HTMLInputElement || item instanceof HTMLSelectElement
  )) {
    throw new Error(`Missing editor control ${name}.`);
  }
  return item;
}

function setValue(name: string, value: string | number): void {
  control(name).value = String(value);
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
  const { preset, preview: settings } = status.snapshot;
  setValue('name', preset.name);
  setValue('id', preset.id);
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
  setValue('textureColumns', texture.columns);
  setValue('textureRows', texture.rows);
  setValue('textureFrame', texture.frame);

  const name = shell.root.querySelector<HTMLElement>('[data-emitter-name]');
  const summary = shell.root.querySelector<HTMLElement>(
    '[data-emitter-summary]',
  );
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
  if (name !== null) name.textContent = preset.name;
  if (summary !== null) {
    summary.textContent =
      preset.emission.mode === 'continuous'
        ? `Continuous · ${String(preset.emission.rate)}/s`
        : `Burst · ${String(preset.emission.count)}`;
  }
  if (seed !== null) seed.textContent = String(preset.seed);
  if (documentStatus !== null) {
    documentStatus.textContent = status.dirty ? 'Saving…' : status.label;
  }
  if (undo !== null) undo.disabled = !status.canUndo;
  if (redo !== null) redo.disabled = !status.canRedo;

  const background = shell.root.querySelector<HTMLInputElement>(
    '[data-preview-background]',
  );
  const scale = shell.root.querySelector<HTMLSelectElement>(
    '[data-preview-scale]',
  );
  const speed =
    shell.root.querySelector<HTMLSelectElement>('[data-time-scale]');
  const canvasFrame = shell.root.querySelector<HTMLElement>(
    '[data-canvas-frame]',
  );
  if (background !== null) background.value = settings.background;
  if (scale !== null) scale.value = settings.scale;
  if (speed !== null) speed.value = String(settings.timeScale);
  if (canvasFrame !== null) canvasFrame.dataset.scale = settings.scale;

  shell.timeline.max = String(Math.max(100, preset.lifespan.max * 1000));
  const duration = shell.root.querySelector<HTMLElement>('[data-duration]');
  if (duration !== null)
    duration.textContent = `${preset.lifespan.max.toFixed(1)}s`;
}

function updateTimeline(preset: ParticlePresetV1): void {
  if (paused) return;
  const duration = Math.max(0.1, preset.lifespan.max) * 1000;
  const elapsed =
    (performance.now() - timelineStartedAt) *
    store.status.snapshot.preview.timeScale;
  shell.timeline.value = String(Math.min(duration, elapsed % duration));
}

function numberValue(element: HTMLInputElement | HTMLSelectElement): number {
  const value = Number(element.value);
  if (!Number.isFinite(value)) throw new TypeError('Enter a finite number.');
  return value;
}

function applyControlChange(
  element: HTMLInputElement | HTMLSelectElement,
): void {
  const name = element.name;
  const value = element.value;
  store.update(`Changed ${name}`, ({ preset }) => {
    const number = () => numberValue(element);
    switch (name) {
      case 'name':
        preset.name = value;
        break;
      case 'id':
        preset.id = value;
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

function setTheme(theme: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('flixel-pixi:particle-editor:theme', theme);
}

setTheme(
  localStorage.getItem('flixel-pixi:particle-editor:theme') === 'light'
    ? 'light'
    : 'dark',
);

store.subscribe((status) => {
  clearError();
  syncForm(status);
  const nextPreset = serializeParticlePreset(status.snapshot.preset);
  if (nextPreset !== renderedPreset) {
    preview.load(status.snapshot.preset, texture.buffer);
    if (paused) preview.pause();
    renderedPreset = nextPreset;
    timelineStartedAt = performance.now();
  }
  if (status.snapshot.preview.background !== renderedBackground) {
    preview.setBackground(status.snapshot.preview.background);
    renderedBackground = status.snapshot.preview.background;
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
  if (
    ['textureColumns', 'textureRows', 'textureFrame'].includes(element.name)
  ) {
    try {
      texture = selectTextureFrame(
        texture,
        numberValue(control('textureColumns')),
        numberValue(control('textureRows')),
        numberValue(control('textureFrame')),
      );
      preview.load(store.status.snapshot.preset, texture.buffer);
      if (paused) preview.pause();
      syncForm(store.status);
    } catch (error) {
      showError(error);
    }
    return;
  }
  try {
    applyControlChange(element);
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
    const next = await loadTextureFile(file);
    destroyTexture(texture);
    texture = next;
    const label = shell.root.querySelector<HTMLElement>('[data-texture-label]');
    if (label !== null) label.textContent = next.label;
    store.update('Changed texture', ({ preset }) => {
      preset.appearance.texture = {
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
  const preset = findStarterPreset(card.dataset.presetId ?? '');
  if (preset === undefined) return;
  resetSnapshot = {
    preset: clonePreset(preset),
    preview: { ...store.status.snapshot.preview },
  };
  store.replace(`Loaded ${preset.name}`, resetSnapshot);
  showToast(`${preset.name} loaded`);
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
  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  if (action === undefined) return;
  switch (action) {
    case 'undo':
      store.undo();
      break;
    case 'redo':
      store.redo();
      break;
    case 'reset':
      store.replace('Reset preset', resetSnapshot);
      showToast('Preset reset');
      break;
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
      timelineStartedAt = performance.now();
      shell.status.textContent = 'Effect restarted';
      break;
    case 'burst':
      preview.burst();
      timelineStartedAt = performance.now();
      shell.status.textContent = 'Single burst fired';
      break;
    case 'import':
      shell.importInput.click();
      break;
    case 'export':
      downloadPreset(store.status.snapshot.preset);
      showToast('Preset exported');
      break;
    case 'copy-code':
      try {
        await navigator.clipboard.writeText(
          createTypeScriptSnippet(store.status.snapshot.preset),
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
    const preset = parseImportedPreset(await file.text());
    resetSnapshot = {
      preset: clonePreset(preset),
      preview: { ...store.status.snapshot.preview },
    };
    store.replace(`Imported ${preset.name}`, resetSnapshot);
    showToast('Preset imported and validated');
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
    downloadPreset(store.status.snapshot.preset);
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
    destroyTexture(texture);
    preview.destroy();
  },
  { once: true },
);
