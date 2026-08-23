import type { ParticlePresetV1 } from 'flixel-pixi';
import type {
  ParticleEffectDocumentV1,
  ParticleEmitterLayerV1,
} from './editor-store';

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
  parent: ParentNode,
  selector: string,
): T {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(
      `Required particle editor element "${selector}" was not found.`,
    );
  }
  return element;
}

function numberField(label: string, name: string, step = 'any'): string {
  return `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="number" step="${step}" required />
    </label>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

function presetColor(color: number): string {
  return `#${((color >>> 8) & 0xff_ffff).toString(16).padStart(6, '0')}`;
}

function presetCard(preset: ParticlePresetV1, index: number): string {
  const summary =
    preset.emission.mode === 'continuous'
      ? `${String(preset.emission.rate)}/sec`
      : `${String(preset.emission.count)} particle burst`;
  const colors = preset.appearance.colors ?? [];
  const firstColor = colors[0]?.color ?? 0x1de8f1ff;
  const lastColor = colors.at(-1)?.color ?? 0xff397eff;
  return `
    <button class="preset-card" type="button" data-action="load-preset" data-preset-id="${escapeHtml(preset.id)}">
      <span class="preset-art preset-art-${String(index + 1)}" style="--preset-start: ${presetColor(firstColor)}; --preset-end: ${presetColor(lastColor)}" aria-hidden="true"></span>
      <span>
        <strong>${escapeHtml(preset.name)}</strong>
        <small>${summary}</small>
      </span>
    </button>
  `;
}

export function renderEmitterLayerRow(
  layer: ParticleEmitterLayerV1,
  isSelected: boolean,
  index = 0,
  totalLayers = 1,
): string {
  const summary =
    layer.preset.emission.mode === 'continuous'
      ? `${String(layer.preset.emission.rate)}/sec`
      : `${String(layer.preset.emission.count)} particle burst`;

  const layerId = escapeHtml(layer.layerId);
  const layerName = escapeHtml(layer.name);
  const stateLabel = layer.enabled ? 'Disable' : 'Enable';
  return `
    <div class="emitter-row" role="option" aria-selected="${String(isSelected)}" data-enabled="${String(layer.enabled)}">
      <button class="emitter-select" type="button" data-action="select-emitter" data-layer-id="${layerId}" aria-label="Select ${layerName}">
        <span class="emitter-icon" aria-hidden="true">${layer.textureShape === 'square' ? '■' : '✦'}</span>
        <span class="emitter-copy">
          <strong>${layerName}</strong>
          <small>${summary}</small>
        </span>
      </button>
      <div class="emitter-actions" aria-label="${layerName} actions">
        <button class="emitter-action emitter-toggle" type="button" data-action="toggle-emitter" data-layer-id="${layerId}" aria-label="${stateLabel} ${layerName}" title="${stateLabel} emitter" aria-pressed="${String(layer.enabled)}">${layer.enabled ? '●' : '○'}</button>
        <button class="emitter-action" type="button" data-action="move-emitter-up" data-layer-id="${layerId}" aria-label="Move ${layerName} up" title="Move up"${index === 0 ? ' disabled' : ''}>↑</button>
        <button class="emitter-action" type="button" data-action="move-emitter-down" data-layer-id="${layerId}" aria-label="Move ${layerName} down" title="Move down"${index === totalLayers - 1 ? ' disabled' : ''}>↓</button>
        <button class="emitter-action" type="button" data-action="duplicate-emitter" data-layer-id="${layerId}" aria-label="Duplicate ${layerName}" title="Duplicate emitter">⧉</button>
        <button class="emitter-action emitter-delete" type="button" data-action="delete-emitter" data-layer-id="${layerId}" aria-label="Delete ${layerName}" title="Delete emitter"${totalLayers <= 1 ? ' disabled' : ''}>×</button>
      </div>
    </div>
  `;
}

export function renderEmitterLayerList(
  document: ParticleEffectDocumentV1,
  selectedEmitterId: string,
): string {
  return document.emitters
    .map((layer, index) =>
      renderEmitterLayerRow(
        layer,
        layer.layerId === selectedEmitterId,
        index,
        document.emitters.length,
      ),
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
        <nav class="project-links" aria-label="Flixel-Pixi project links">
          <a href="https://vdokkupalle-ebsco.github.io/flixel-pixi/" target="_blank" rel="noopener noreferrer" aria-label="Open the Flixel-Pixi documentation in a new tab">Docs <span aria-hidden="true">↗</span></a>
          <a href="https://github.com/vdokkupalle-ebsco/flixel-pixi" target="_blank" rel="noopener noreferrer" aria-label="Open the Flixel-Pixi GitHub repository in a new tab">GitHub <span aria-hidden="true">↗</span></a>
        </nav>
        <div class="top-actions" aria-label="Document actions">
          <div class="save-state" role="status" aria-live="polite"><span class="status-dot" aria-hidden="true"></span><span data-document-status>Saved preset</span></div>
          <button class="icon-button" data-action="undo" type="button" aria-label="Undo" title="Undo (Ctrl/⌘ Z)">↶</button>
          <button class="icon-button" data-action="redo" type="button" aria-label="Redo" title="Redo (Ctrl/⌘ Shift Z)">↷</button>
          <button class="button quiet" data-action="import" type="button">Import</button>
          <button class="button quiet" data-action="export-effect" type="button">Export JSON</button>
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
            <div><p class="eyebrow">Effect graph</p><h2>Emitter</h2></div>
            <button class="icon-button" data-action="add-emitter" type="button" aria-label="Add emitter" title="Add emitter">+</button>
          </div>
          <div class="emitter-list" data-emitter-list role="listbox" aria-label="Emitter layers"></div>
          <p class="panel-note">One focused emitter per preset keeps exported effects portable and easy to compose in a game.</p>
        </aside>

        <section class="preview-panel" aria-labelledby="preview-title">
          <div class="preview-heading">
            <div><p class="eyebrow">Live canvas</p><h2 id="preview-title">Deterministic preview</h2></div>
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
              <label class="field span-2"><span>Stable ID</span><input name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
              ${numberField('Offset X', 'offsetX', '1')}
              ${numberField('Offset Y', 'offsetY', '1')}
              ${numberField('Seed', 'seed')}
              ${numberField('Capacity', 'capacity')}
              <label class="field span-2"><span>Space</span><select name="space"><option value="world">World</option><option value="local">Local</option></select></label>
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
              <h3 class="span-2 texture-subheading">Display size &amp; origin</h3>
              ${numberField('Width', 'textureWidth', '1')}${numberField('Height', 'textureHeight', '1')}${numberField('Origin X', 'textureOriginX', '1')}${numberField('Origin Y', 'textureOriginY', '1')}
              <h3 class="span-2 texture-subheading">Grid frame</h3>
              ${numberField('Columns', 'textureColumns')}${numberField('Rows', 'textureRows')}${numberField('Frame', 'textureFrame')}
              <p class="field-help span-2">Width and Height resize the full uploaded image or selected grid frame. Origin X/Y are normalized anchors from 0 to 1; use 0.5 / 0.5 to center particles.</p>
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
