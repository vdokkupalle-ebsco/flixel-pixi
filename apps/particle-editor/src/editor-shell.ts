export interface EditorShellElements {
  activeCount: HTMLElement;
  canvasHost: HTMLElement;
  pauseButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  root: HTMLElement;
  status: HTMLElement;
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Editor shell is missing ${selector}.`);
  return element;
}

export function renderEditorShell(host: HTMLElement): EditorShellElements {
  host.innerHTML = `
    <main class="editor" aria-labelledby="editor-title">
      <header class="topbar">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true">FP</span>
          <div>
            <p class="eyebrow">Flixel-Pixi</p>
            <h1 id="editor-title">Particle Lab</h1>
          </div>
        </div>
        <div class="document-state" role="status" aria-live="polite">
          <span class="status-dot" aria-hidden="true"></span>
          Starter preset
        </div>
      </header>

      <section class="workspace" aria-label="Particle editor workspace">
        <aside class="panel hierarchy-panel" aria-labelledby="hierarchy-title">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Effect graph</p>
              <h2 id="hierarchy-title">Emitters</h2>
            </div>
            <button class="icon-button" type="button" aria-label="Add emitter" disabled>+</button>
          </div>
          <button class="emitter-row" type="button" aria-current="true">
            <span class="emitter-icon" aria-hidden="true">✦</span>
            <span>
              <strong>Spark fountain</strong>
              <small>Continuous · 48/s</small>
            </span>
          </button>
          <p class="panel-note">More emitters and hierarchy editing arrive in the next slice.</p>
        </aside>

        <section class="preview-panel" aria-labelledby="preview-title">
          <div class="preview-heading">
            <div>
              <p class="eyebrow">Live canvas</p>
              <h2 id="preview-title">Preview</h2>
            </div>
            <dl class="metrics" aria-label="Preview diagnostics">
              <div><dt>Particles</dt><dd data-active-count>0 / 160</dd></div>
              <div><dt>Seed</dt><dd>20260823</dd></div>
            </dl>
          </div>
          <div class="canvas-frame">
            <div class="canvas-grid" aria-hidden="true"></div>
            <div class="canvas-host" data-canvas-host aria-label="Particle preview canvas"></div>
            <p class="preview-status" data-preview-status role="status" aria-live="polite">Loading preview…</p>
          </div>
          <div class="transport" aria-label="Preview controls">
            <button class="button secondary" data-pause type="button" aria-pressed="false">Pause</button>
            <button class="button primary" data-restart type="button">Restart effect</button>
          </div>
        </section>

        <aside class="panel inspector-panel" aria-labelledby="inspector-title">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Selection</p>
              <h2 id="inspector-title">Properties</h2>
            </div>
          </div>
          <fieldset>
            <legend>Emission</legend>
            <label>Rate <output>48 / sec</output><input type="range" min="1" max="120" value="48" disabled /></label>
            <label>Capacity <output>160</output><input type="range" min="16" max="512" value="160" disabled /></label>
          </fieldset>
          <fieldset>
            <legend>Lifetime</legend>
            <div class="field-pair"><label>Minimum<input value="0.8 s" readonly /></label><label>Maximum<input value="1.7 s" readonly /></label></div>
          </fieldset>
          <p class="panel-note">Controls are intentionally read-only in this shell milestone.</p>
        </aside>
      </section>
    </main>`;

  return {
    activeCount: requireElement(host, '[data-active-count]'),
    canvasHost: requireElement(host, '[data-canvas-host]'),
    pauseButton: requireElement(host, '[data-pause]'),
    restartButton: requireElement(host, '[data-restart]'),
    root: requireElement(host, '.editor'),
    status: requireElement(host, '[data-preview-status]'),
  };
}
