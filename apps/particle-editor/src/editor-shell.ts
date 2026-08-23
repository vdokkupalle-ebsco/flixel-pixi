import type {
  ParticleEffectDocumentV1,
  ParticleEmitterLayerV1,
} from './editor-store';
import type { ParticlePresetV1 } from 'flixel-pixi';

export interface EditorShellElements {
  activeCount: HTMLElement;
  addEmitterButton: HTMLButtonElement;
  canvasHost: HTMLElement;
  emitterList: HTMLElement;
  error: HTMLElement;
  form: HTMLFormElement;
  importInput: HTMLInputElement;
  pauseButton: HTMLButtonElement;
  presetList: HTMLElement;
  root: HTMLElement;
  status: HTMLElement;
  toast: HTMLElement;
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Editor shell is missing ${selector}.`);
  return element;
}

function presetCard(preset: ParticlePresetV1, index: number): string {
  const colors = preset.appearance.colors ?? [];
  const start = colors[0]?.color ?? 0x1de8f1ff;
  const end = colors.at(-1)?.color ?? 0xff397eff;
  const cssColor = (color: number) =>
    `#${(color >>> 8).toString(16).padStart(6, '0')}`;
  return `<button class="preset-card" type="button" data-preset-id="${preset.id}" aria-label="Load ${preset.name}">
    <span class="preset-art preset-art-${String(index + 1)}" style="--preset-start:${cssColor(start)};--preset-end:${cssColor(end)}" aria-hidden="true"></span>
    <span><strong>${preset.name}</strong><small>${preset.emission.mode === 'continuous' ? `${String(preset.emission.rate)}/sec` : `${String(preset.emission.count)} particle burst`}</small></span>
  </button>`;
}

function numberField(label: string, name: string, step = '1'): string {
  return `<label class="field"><span>${label}</span><input name="${name}" type="number" step="${step}" required /></label>`;
}

export function renderEmitterLayerRow(
  layer: ParticleEmitterLayerV1,
  isSelected: boolean,
): string {
  const summary =
    layer.preset.emission.mode === 'continuous'
      ? `${String(layer.preset.emission.rate)}/sec`
      : `${String(layer.preset.emission.count)} burst`;
  return `
    <div class="emitter-row-container ${isSelected ? 'is-selected' : ''} ${!layer.enabled ? 'is-disabled' : ''}" data-layer-id="${layer.layerId}">
      <button class="emitter-toggle-button" type="button" data-action="toggle-emitter" data-layer-id="${layer.layerId}" aria-label="${layer.enabled ? 'Disable' : 'Enable'} ${layer.name}" title="${layer.enabled ? 'Disable layer' : 'Enable layer'}">
        <span class="toggle-dot ${layer.enabled ? 'enabled' : 'disabled'}" aria-hidden="true"></span>
      </button>
      <button class="emitter-row" type="button" data-action="select-emitter" data-layer-id="${layer.layerId}" aria-current="${isSelected ? 'true' : 'false'}">
        <span class="emitter-icon" aria-hidden="true">${layer.textureShape === 'square' ? '■' : '✦'}</span>
        <span class="emitter-details">
          <strong class="emitter-name">${layer.name}</strong>
          <small class="emitter-summary">${summary}</small>
        </span>
      </button>
    </div>
  `;
}

export function renderEmitterLayerList(
  document: ParticleEffectDocumentV1,
  selectedEmitterId: string,
): string {
  return document.emitters
    .map((layer) =>
      renderEmitterLayerRow(layer, layer.layerId === selectedEmitterId),
    )
    .join('');
}

export function renderEditorShell(
  host: HTMLElement,
  presets: readonly ParticlePresetV1[],
): EditorShellElements {
  host.innerHTML = `
    <main class="editor" aria-labelledby="editor-title">
      <header class="topbar">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true"><i></i><b></b></span>
          <div><p class="eyebrow">Flixel-Pixi</p><h1 id="editor-title">Particle Editor</h1></div>
          <span class="beta-badge">Beta</span>
        </div>
        <div class="top-actions" aria-label="Document actions">
          <div class="save-state" role="status" aria-live="polite"><span class="status-dot" aria-hidden="true"></span><span data-document-status>Ready</span></div>
          <button class="icon-button" data-action="undo" type="button" aria-label="Undo" title="Undo (Ctrl/⌘ Z)">↶</button>
          <button class="icon-button" data-action="redo" type="button" aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)">↷</button>
          <button class="button quiet" data-action="import" type="button">Import</button>
          <button class="button quiet" data-action="export" type="button">Export JSON</button>
          <button class="button brand" data-action="copy-code" type="button">Copy TypeScript</button>
          <button class="icon-button theme-button" data-action="theme" type="button" aria-label="Switch color theme" title="Switch color theme">◐</button>
          <input data-import-input type="file" accept="application/json,.json" hidden />
        </div>
      </header>

      <section class="workspace" aria-label="Particle editor workspace">
        <aside class="library-panel" aria-labelledby="library-title">
          <div class="panel-heading"><div><p class="eyebrow">Effect library</p><h2 id="library-title">Starter effects</h2></div></div>
          <div class="preset-list" data-preset-list>${presets.map(presetCard).join('')}</div>
          <div class="section-divider"></div>
          <div class="panel-heading compact">
            <div><p class="eyebrow">Effect graph</p><h2>Emitters</h2></div>
            <button class="icon-button" data-action="add-emitter" type="button" aria-label="Add emitter" title="Add emitter">+</button>
          </div>
          <div class="emitter-list" data-emitter-list role="listbox" aria-label="Emitter layers"></div>
          <div class="emitter-actions">
            <button class="button secondary compact-button" data-action="duplicate-emitter" type="button" title="Duplicate selected emitter">Duplicate</button>
            <button class="button secondary compact-button" data-action="delete-emitter" type="button" title="Delete selected emitter">Delete</button>
          </div>
          <p class="panel-note">Layer multiple emitters together to create rich multi-layered effects. Each layer remains a standard ParticlePresetV1.</p>
        </aside>

        <section class="preview-panel" aria-labelledby="preview-title">
          <div class="preview-heading">
            <div>
              <p class="eyebrow">Live canvas</p>
              <h2 id="preview-title">Deterministic preview</h2>
              <p class="capacity-warning" data-capacity-warning hidden role="alert">⚠️ Combined capacity exceeds 2,000 particles</p>
            </div>
            <dl class="metrics" aria-label="Preview diagnostics">
              <div><dt>Particles</dt><dd data-active-count>0 / 0</dd></div>
              <div><dt>Pool</dt><dd data-pool-reuse>0 reused</dd></div>
              <div><dt>Seed</dt><dd data-seed>0</dd></div>
            </dl>
          </div>
          <div class="preview-tools" aria-label="Preview display options">
            <label>Background <input data-preview-background type="color" value="#07101c" /></label>
            <label>Pointer <select data-pointer-mode aria-label="Pointer interaction"><option value="auto" selected>Auto preview</option><option value="burst">Burst on click</option><option value="trail">Trail while dragging</option></select></label>
            <label>Canvas size <select data-preview-scale><option value="compact">Compact</option><option value="fit" selected>Fit</option><option value="large">Large</option></select></label>
            <label>Speed <select data-time-scale><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
          </div>
          <div class="canvas-frame" data-canvas-frame data-scale="fit">
            <div class="canvas-grid" aria-hidden="true"></div>
            <div class="canvas-host" data-canvas-host aria-label="Particle preview canvas"></div>
            <p class="preview-status" data-preview-status role="status" aria-live="polite">Loading preview…</p>
          </div>
          <div class="transport" aria-label="Preview controls">
            <button class="button secondary" data-action="pause" type="button" aria-pressed="false">Pause</button>
            <button class="button secondary" data-action="burst" type="button">Single burst</button>
            <button class="button brand" data-action="restart" type="button">Restart effect</button>
          </div>
        </section>

        <aside class="inspector-panel" aria-labelledby="inspector-title">
          <div class="panel-heading inspector-heading"><div><p class="eyebrow">Selection</p><h2 id="inspector-title">Emitter properties</h2></div><button class="button text-button" data-action="reset" type="button">Reset preset</button></div>
          <p class="form-error" data-error role="alert" hidden></p>
          <form data-inspector novalidate>
            <details open><summary>Identity</summary><div class="property-grid">
              <label class="field span-2"><span>Name</span><input name="name" required /></label>
              <label class="field span-2"><span>Stable ID</span><input name="id" required pattern="[a-z0-9][a-z0-9-]*" /></label>
              ${numberField('Seed', 'seed')}
              ${numberField('Capacity', 'capacity')}
              <label class="field"><span>Space</span><select name="space"><option value="world">World</option><option value="local">Local</option></select></label>
            </div></details>

            <details open><summary>Emission</summary><div class="property-grid">
              <label class="field"><span>Mode</span><select name="emissionMode"><option value="continuous">Continuous</option><option value="burst">Burst</option></select></label>
              ${numberField('Rate / sec', 'emissionRate', '1')}
              ${numberField('Burst count', 'emissionCount', '1')}
              ${numberField('Life min', 'lifeMin', '0.05')}
              ${numberField('Life max', 'lifeMax', '0.05')}
            </div></details>

            <details><summary>Spawn region</summary><div class="property-grid">
              <label class="field"><span>Shape</span><select name="spawnShape"><option value="point">Point</option><option value="rectangle">Rectangle</option><option value="circle">Circle</option></select></label>
              ${numberField('Width', 'spawnWidth', '1')}${numberField('Height', 'spawnHeight', '1')}${numberField('Radius', 'spawnRadius', '1')}
            </div></details>

            <details open><summary>Motion</summary><div class="property-grid range-grid">
              <h3>Velocity</h3>${numberField('X min', 'velocityXMin', '1')}${numberField('X max', 'velocityXMax', '1')}${numberField('Y min', 'velocityYMin', '1')}${numberField('Y max', 'velocityYMax', '1')}
              <h3>Acceleration</h3>${numberField('X min', 'accelerationXMin', '1')}${numberField('X max', 'accelerationXMax', '1')}${numberField('Y min', 'accelerationYMin', '1')}${numberField('Y max', 'accelerationYMax', '1')}
              <h3>Drag</h3>${numberField('X min', 'dragXMin', '1')}${numberField('X max', 'dragXMax', '1')}${numberField('Y min', 'dragYMin', '1')}${numberField('Y max', 'dragYMax', '1')}
            </div></details>

            <details open><summary>Appearance</summary><div class="property-grid">
              <label class="field span-2"><span>Blend mode</span><select name="blendMode"><option value="normal">Normal</option><option value="add">Additive glow</option><option value="screen">Screen</option><option value="multiply">Multiply</option></select></label>
              <label class="field"><span>Start color</span><input name="startColor" type="color" /></label><label class="field"><span>End color</span><input name="endColor" type="color" /></label>
              ${numberField('Alpha start', 'alphaStart', '0.05')}${numberField('Alpha end', 'alphaEnd', '0.05')}${numberField('Scale start', 'scaleStart', '0.05')}${numberField('Scale end', 'scaleEnd', '0.05')}
              ${numberField('Angle min', 'angleMin', '1')}${numberField('Angle max', 'angleMax', '1')}${numberField('Spin min', 'spinMin', '1')}${numberField('Spin max', 'spinMax', '1')}
            </div></details>

            <details><summary>Texture & atlas frame</summary><div class="property-grid">
              <label class="field"><span>Drawing shape</span><select name="textureShape"><option value="circle">Circle</option><option value="square">Square</option></select></label>
              <div class="field"><span>Generated texture</span><span class="texture-actions"><button class="button secondary compact-button" data-action="generated-texture" type="button">Use effect texture</button><button class="button secondary compact-button" data-action="download-texture" type="button">Download PNG</button></span></div>
              <label class="field span-2"><span>Texture</span><span class="file-control"><input data-texture-input type="file" accept="image/*" /><span data-texture-label>Flixel spark</span></span></label>
              ${numberField('Columns', 'textureColumns')}${numberField('Rows', 'textureRows')}${numberField('Frame', 'textureFrame')}
              <p class="field-help span-2">Generated textures can use a circle or square mask. Uploaded spritesheets keep their alpha and support grid-based frame selection.</p>
            </div></details>
          </form>
        </aside>
      </section>
      <div class="toast" data-toast role="status" aria-live="polite" hidden></div>
    </main>`;

  return {
    activeCount: requireElement(host, '[data-active-count]'),
    addEmitterButton: requireElement(host, '[data-action="add-emitter"]'),
    canvasHost: requireElement(host, '[data-canvas-host]'),
    emitterList: requireElement(host, '[data-emitter-list]'),
    error: requireElement(host, '[data-error]'),
    form: requireElement(host, '[data-inspector]'),
    importInput: requireElement(host, '[data-import-input]'),
    pauseButton: requireElement(host, '[data-action="pause"]'),
    presetList: requireElement(host, '[data-preset-list]'),
    root: requireElement(host, '.editor'),
    status: requireElement(host, '[data-preview-status]'),
    toast: requireElement(host, '[data-toast]'),
  };
}
