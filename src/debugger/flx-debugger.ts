import { clamp01 } from '../math/flx-math';
import type { DebugChannel } from './debug-channel';
import { FlxConsole, type FlxConsoleResult } from './flx-console';
import { FlxDiagnostics, type FlxDiagnosticSnapshot } from './flx-diagnostics';
import type { FlxLog } from './flx-log';
import type { LogEntry } from './flx-log';
import type { FlxVCR } from '../replay/flx-vcr';
import type { FlxWatch } from './flx-watch';
import type { WatchSnapshot } from './flx-watch';

// ─── Inline CSS ──────────────────────────────────────────────────────────────
const DEBUGGER_CSS = `
.flxdbg-overlay {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  height: min(260px, 50vh);
  background: rgba(10,10,20,0.93);
  backdrop-filter: blur(6px);
  border-top: 1.5px solid #334155;
  font-family: 'JetBrains Mono', 'Fira Mono', monospace;
  font-size: 12px;
  color: #e2e8f0;
  transition: transform 0.25s ease;
  user-select: none;
}
.flxdbg-overlay.hidden { transform: translateY(100%); }
.flxdbg-launcher {
  position: fixed; right: 10px; bottom: 10px; z-index: 10000;
  padding: 5px 10px; border: 1px solid #334155; border-radius: 999px;
  background: rgba(15,23,42,0.95); color: #38bdf8;
  font: 600 11px 'JetBrains Mono', 'Fira Mono', monospace;
  letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer;
  box-shadow: 0 3px 12px rgba(0,0,0,0.35);
}
.flxdbg-launcher:hover { background: #1e293b; color: #7dd3fc; }
.flxdbg-launcher:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.flxdbg-launcher[hidden] { display: none; }
.flxdbg-tabs {
  display: flex;
  align-items: center;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  gap: 0;
  padding: 0 4px;
}
.flxdbg-tab {
  padding: 4px 12px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  outline: none;
  border-bottom: 2px solid transparent;
}
.flxdbg-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: -2px; }
.flxdbg-tab.active { color: #38bdf8; border-bottom-color: #38bdf8; }
.flxdbg-tab:hover:not(.active) { color: #cbd5e1; }
.flxdbg-toggle {
  margin-left: auto;
  padding: 2px 10px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  line-height: 1;
}
.flxdbg-toggle:hover { color: #f87171; }
.flxdbg-panels { flex: 1; min-height: 0; overflow: hidden; position: relative; }
.flxdbg-panel {
  display: none;
  height: 100%;
  overflow-y: auto;
  padding: 6px 10px;
  box-sizing: border-box;
}
.flxdbg-panel.active { display: block; }
#flxdbg-panel-console { overflow: hidden; }

/* Log panel */
.flxdbg-log-entry { padding: 1px 0; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
.flxdbg-log-time { color: #475569; margin-right: 6px; }

/* Console panel */
.flxdbg-console { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 6px; }
.flxdbg-console-output {
  flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
  user-select: text; scrollbar-gutter: stable;
}
.flxdbg-console-row { padding: 1px 0; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.flxdbg-console-command { color: #38bdf8; }
.flxdbg-console-result { color: #94a3b8; }
.flxdbg-console-error { color: #f87171; }
.flxdbg-console-form { display: flex; align-items: center; gap: 6px; }
.flxdbg-console-prompt { color: #4ade80; font-weight: bold; }
.flxdbg-console-input {
  flex: 1; min-width: 0; box-sizing: border-box;
  border: 1px solid #334155; border-radius: 3px;
  background: #020617; color: #e2e8f0;
  font: inherit; padding: 4px 6px;
}
.flxdbg-console-input:focus-visible { outline: 2px solid #38bdf8; outline-offset: 1px; }

/* Watch panel */
.flxdbg-watch-table { width: 100%; border-collapse: collapse; }
.flxdbg-watch-table td { padding: 2px 8px 2px 0; }
.flxdbg-watch-name { color: #94a3b8; }
.flxdbg-watch-value { color: #4ade80; font-weight: bold; }
.flxdbg-watch-editor { display: flex; align-items: center; gap: 6px; }
.flxdbg-watch-input {
  width: min(180px, 40vw); box-sizing: border-box;
  border: 1px solid #334155; border-radius: 3px;
  background: #020617; color: #4ade80; font: inherit; padding: 2px 5px;
}
.flxdbg-watch-input[aria-invalid='true'] { border-color: #f87171; }
.flxdbg-watch-input:focus-visible { outline: 2px solid #38bdf8; outline-offset: 1px; }
.flxdbg-watch-apply {
  border: 1px solid #334155; border-radius: 3px; background: #1e293b;
  color: #cbd5e1; cursor: pointer; font: inherit; padding: 2px 7px;
}
.flxdbg-watch-apply:hover { color: #38bdf8; }
.flxdbg-watch-status { color: #94a3b8; font-weight: normal; }
.flxdbg-watch-status.error { color: #f87171; }

/* Perf panel */
.flxdbg-perf-row { display: flex; gap: 20px; align-items: center; padding: 4px 0; }
.flxdbg-perf-label { color: #94a3b8; min-width: 80px; }
.flxdbg-perf-value { color: #facc15; font-weight: bold; }
.flxdbg-perf-bar-wrap { flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; max-width: 200px; }
.flxdbg-perf-bar { height: 100%; background: #38bdf8; border-radius: 4px; transition: width 0.1s; }
.flxdbg-graphs { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 10px; margin-top: 6px; }
.flxdbg-graph { border: 1px solid #1e293b; border-radius: 4px; padding: 4px; }
.flxdbg-graph-label { display: block; color: #94a3b8; margin-bottom: 2px; }
.flxdbg-graph svg { display: block; width: 100%; height: 42px; overflow: visible; }
.flxdbg-export { margin-top: 6px; border: 1px solid #334155; border-radius: 3px; background: #1e293b; color: #cbd5e1; cursor: pointer; font: inherit; padding: 3px 8px; }
.flxdbg-export:hover { color: #38bdf8; }

/* VCR panel */
.flxdbg-vcr { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.flxdbg-vcr-status { color: #4ade80; font-weight: bold; }
.flxdbg-vcr-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.flxdbg-vcr-btn {
  padding: 4px 12px;
  border: 1px solid #334155;
  border-radius: 4px;
  background: #1e293b;
  color: #e2e8f0;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}
.flxdbg-vcr-btn:hover:not(:disabled) { background: #334155; color: #38bdf8; }
.flxdbg-vcr-btn:disabled { opacity: 0.4; cursor: default; }
.flxdbg-vcr-btn:focus-visible { outline: 2px solid #38bdf8; }

/* Vis panel */
.flxdbg-vis { display: flex; flex-direction: column; gap: 6px; padding: 6px 0; }
.flxdbg-vis-row { display: flex; align-items: center; gap: 8px; }
.flxdbg-vis-toggle {
  position: relative; width: 32px; height: 18px;
  background: #334155; border-radius: 9px;
  cursor: pointer; border: none; padding: 0;
  transition: background 0.2s;
}
.flxdbg-vis-toggle.on { background: #38bdf8; }
.flxdbg-vis-toggle::after {
  content: '';
  position: absolute;
  width: 12px; height: 12px;
  background: white; border-radius: 50%;
  top: 3px; left: 3px;
  transition: left 0.2s;
}
.flxdbg-vis-toggle.on::after { left: 17px; }
.flxdbg-vis-label { color: #cbd5e1; }
`;

// ─── Types ───────────────────────────────────────────────────────────────────

/** @public */
export interface FlxDebuggerOptions {
  /** Headless command registry to expose in the Console panel. */
  console?: FlxConsole;
  /** Bounded metrics collector used by the Perf panel and exports. */
  diagnostics?: FlxDiagnostics;
  /** Element to mount the overlay inside. Defaults to document.body. */
  container?: HTMLElement;
  /** Whether the debugger starts expanded. Defaults to true. */
  initiallyVisible?: boolean;
  /** Show an accessible launcher while minimized. Defaults to true. */
  showLauncherWhenHidden?: boolean;
  /** KeyboardEvent.code used to toggle the debugger. Defaults to Backquote. */
  toggleKey?: string | false;
}

/** Versioned JSON-safe debugger export. @public */
export interface FlxDebuggerDiagnosticSnapshot {
  readonly capturedAt: string;
  readonly environment: {
    readonly userAgent: string | null;
    readonly viewportHeight: number | null;
    readonly viewportWidth: number | null;
  };
  readonly logs: readonly LogEntry[];
  readonly performance: FlxDiagnosticSnapshot;
  readonly schemaVersion: 1;
  readonly watches: readonly WatchSnapshot[];
}

/** Callbacks the debugger needs to invoke VCR actions on the game. @public */
export interface FlxDebuggerVCRCallbacks {
  record(): void;
  stop(): void;
  play(): void;
  rewind(): void;
  stepFrame(): void;
  getVCR(): FlxVCR;
}

// ─── FlxDebugger ─────────────────────────────────────────────────────────────

/**
 * DOM overlay debugger with Console, Log, Watch, Perf, VCR, and Vis panels.
 * Mounts as a fixed bottom bar. Fully keyboard/screen-reader accessible.
 * @public
 */
export class FlxDebugger {
  readonly console: FlxConsole;
  readonly diagnostics: FlxDiagnostics;
  readonly #root: HTMLDivElement;
  readonly #launcher: HTMLButtonElement | null;
  readonly #panels = new Map<string, HTMLDivElement>();
  readonly #tabs = new Map<string, HTMLButtonElement>();
  readonly #toggleKey: string | false;
  #activeTab = 'log';
  #visible = true;
  #restoreFocus: HTMLElement | null = null;

  // Panel-specific elements
  #logList!: HTMLDivElement;
  #consoleInput!: HTMLInputElement;
  #consoleOutput!: HTMLDivElement;
  #consoleHistoryIndex = 0;
  #watchBody!: HTMLTableSectionElement;
  readonly #watchRows = new Map<
    string,
    {
      input: HTMLInputElement | null;
      name: HTMLTableCellElement;
      row: HTMLTableRowElement;
      status: HTMLSpanElement | null;
      value: HTMLSpanElement | null;
    }
  >();
  #perfFps!: HTMLSpanElement;
  #perfUpdateMs!: HTMLSpanElement;
  #perfBar!: HTMLDivElement;
  #perfUpdateLine!: SVGPolylineElement;
  #perfMemoryLine!: SVGPolylineElement;
  #perfMemoryLabel!: HTMLSpanElement;
  #vcrStatus!: HTMLSpanElement;
  #vcrRecord!: HTMLButtonElement;
  #vcrStop!: HTMLButtonElement;
  #vcrPlay!: HTMLButtonElement;
  #vcrRewind!: HTMLButtonElement;
  #vcrStep!: HTMLButtonElement;
  #vcr: FlxDebuggerVCRCallbacks | null = null;
  #log: FlxLog | null = null;
  #watch: FlxWatch | null = null;

  // Perf state
  #frameCount = 0;
  #lastFpsTime = 0;
  #currentFps = 0;

  #destroyed = false;
  #styleEl: HTMLStyleElement | null = null;

  constructor(options: FlxDebuggerOptions = {}) {
    const {
      container = document.body,
      initiallyVisible = true,
      showLauncherWhenHidden = true,
      toggleKey = 'Backquote',
    } = options;
    if (toggleKey !== false && toggleKey.trim().length === 0) {
      throw new Error('toggleKey must be a KeyboardEvent.code or false.');
    }
    this.console = options.console ?? new FlxConsole();
    this.diagnostics = options.diagnostics ?? new FlxDiagnostics();
    this.#consoleHistoryIndex = this.console.history.length;
    this.#toggleKey = toggleKey;
    this.#visible = initiallyVisible;

    // Inject CSS once
    if (!document.getElementById('flxdbg-style')) {
      this.#styleEl = document.createElement('style');
      this.#styleEl.id = 'flxdbg-style';
      this.#styleEl.textContent = DEBUGGER_CSS;
      document.head.appendChild(this.#styleEl);
    }

    // Root overlay
    this.#root = document.createElement('div');
    this.#root.className = 'flxdbg-overlay';
    this.#root.setAttribute('role', 'complementary');
    this.#root.setAttribute('aria-label', 'Flixel debugger');
    this.#root.setAttribute('data-testid', 'flx-debugger');
    this.#root.classList.toggle('hidden', !initiallyVisible);

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'flxdbg-tabs';
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', 'Debugger panels');
    this.#root.appendChild(tabBar);

    const TAB_LABELS: [string, string][] = [
      ['log', 'Log'],
      ['console', 'Console'],
      ['watch', 'Watch'],
      ['perf', 'Perf'],
      ['vcr', 'VCR'],
      ['vis', 'Vis'],
    ];

    for (const [id, label] of TAB_LABELS) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'flxdbg-tab' + (id === this.#activeTab ? ' active' : '');
      tab.textContent = label;
      tab.setAttribute('role', 'tab');
      tab.setAttribute(
        'aria-selected',
        id === this.#activeTab ? 'true' : 'false',
      );
      tab.setAttribute('aria-controls', `flxdbg-panel-${id}`);
      tab.setAttribute('data-testid', `flxdbg-tab-${id}`);
      tab.addEventListener('click', () => {
        this.#switchTab(id);
      });
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const keys = [...this.#tabs.keys()];
          const idx = keys.indexOf(id);
          const nextKey = (
            e.key === 'ArrowRight'
              ? keys[(idx + 1) % keys.length]
              : keys[(idx - 1 + keys.length) % keys.length]
          ) as string;
          this.#tabs.get(nextKey)?.focus();
          this.#switchTab(nextKey);
        }
      });
      this.#tabs.set(id, tab);
      tabBar.appendChild(tab);
    }

    // Hide/show toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'flxdbg-toggle';
    toggleBtn.textContent = '✕';
    toggleBtn.setAttribute('aria-label', 'Minimize debugger');
    toggleBtn.title = 'Minimize debugger';
    toggleBtn.setAttribute('data-testid', 'flxdbg-close');
    toggleBtn.addEventListener('click', () => {
      this.hide();
    });
    tabBar.appendChild(toggleBtn);

    // Panels container
    const panelsWrap = document.createElement('div');
    panelsWrap.className = 'flxdbg-panels';
    this.#root.appendChild(panelsWrap);

    for (const [id] of TAB_LABELS) {
      const panel = document.createElement('div');
      panel.className =
        'flxdbg-panel' + (id === this.#activeTab ? ' active' : '');
      panel.id = `flxdbg-panel-${id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('data-testid', `flxdbg-panel-${id}`);
      this.#panels.set(id, panel);
      panelsWrap.appendChild(panel);
      this.#buildPanel(id, panel);
    }

    container.appendChild(this.#root);

    if (showLauncherWhenHidden) {
      this.#launcher = document.createElement('button');
      this.#launcher.type = 'button';
      this.#launcher.className = 'flxdbg-launcher';
      this.#launcher.textContent = 'Debug';
      this.#launcher.hidden = initiallyVisible;
      this.#launcher.setAttribute('aria-label', 'Show debugger');
      this.#launcher.setAttribute('data-testid', 'flxdbg-launcher');
      this.#launcher.addEventListener('click', this.#onLauncherClick);
      container.appendChild(this.#launcher);
    } else {
      this.#launcher = null;
    }

    if (this.#toggleKey !== false) {
      window.addEventListener('keydown', this.#onWindowKeyDown, true);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  get visible(): boolean {
    return this.#visible;
  }

  show(): void {
    if (this.#destroyed || this.#visible) return;
    this.#visible = true;
    this.#root.classList.remove('hidden');
    if (this.#launcher) this.#launcher.hidden = true;
  }

  hide(): void {
    if (this.#destroyed || !this.#visible) return;
    const activeElement = document.activeElement;
    this.#restoreFocus =
      activeElement instanceof HTMLElement && this.#root.contains(activeElement)
        ? activeElement
        : null;
    this.#visible = false;
    this.#root.classList.add('hidden');
    if (this.#launcher) {
      this.#launcher.hidden = false;
      if (this.#restoreFocus !== null) this.#launcher.focus();
    }
  }

  toggle(): void {
    if (this.#visible) this.hide();
    else this.show();
  }

  /** Wire up VCR panel callbacks. */
  setVCRCallbacks(callbacks: FlxDebuggerVCRCallbacks): void {
    this.#vcr = callbacks;
  }

  /**
   * Subscribe to a DebugChannel to receive step-complete, log, and watch events.
   */
  subscribeToChannel(
    channel: DebugChannel,
    log: FlxLog,
    watch: FlxWatch,
  ): void {
    this.#log = log;
    this.#watch = watch;
    log.setOnChange(() => {
      this.#refreshLog(log);
    });
    channel.on('step-complete', (p) => {
      this.#onStepComplete(p.frame, p.updateMs, watch);
    });
    channel.on('pause-change', (p) => {
      this.#onPauseChange(p.paused);
    });
  }

  captureDiagnostics(): FlxDebuggerDiagnosticSnapshot {
    const performanceSnapshot = this.diagnostics.capture();
    return {
      capturedAt: performanceSnapshot.capturedAt,
      environment: {
        userAgent:
          typeof navigator === 'undefined' ? null : navigator.userAgent,
        viewportHeight:
          typeof window === 'undefined' ? null : window.innerHeight,
        viewportWidth: typeof window === 'undefined' ? null : window.innerWidth,
      },
      logs: this.#log?.entries.map((entry) => ({ ...entry })) ?? [],
      performance: performanceSnapshot,
      schemaVersion: 1,
      watches: this.#watch?.snapshot() ?? [],
    };
  }

  exportDiagnostics(pretty = true): string {
    return JSON.stringify(this.captureDiagnostics(), null, pretty ? 2 : 0);
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (this.#toggleKey !== false) {
      window.removeEventListener('keydown', this.#onWindowKeyDown, true);
    }
    this.#launcher?.removeEventListener('click', this.#onLauncherClick);
    this.#launcher?.remove();
    this.#root.remove();
    this.#styleEl?.remove();
  }

  // ─── Panel builders ────────────────────────────────────────────────────────

  #buildPanel(id: string, el: HTMLDivElement): void {
    if (id === 'log') this.#buildLog(el);
    else if (id === 'console') this.#buildConsole(el);
    else if (id === 'watch') this.#buildWatch(el);
    else if (id === 'perf') this.#buildPerf(el);
    else if (id === 'vcr') this.#buildVCR(el);
    else if (id === 'vis') this.#buildVis(el);
  }

  #buildLog(el: HTMLDivElement): void {
    const toolbar = document.createElement('div');
    toolbar.style.cssText =
      'display:flex;justify-content:flex-end;margin-bottom:4px';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText =
      'font:inherit;font-size:11px;background:transparent;border:1px solid #334155;color:#94a3b8;padding:1px 8px;cursor:pointer;border-radius:3px';
    clearBtn.setAttribute('aria-label', 'Clear log');
    clearBtn.setAttribute('data-testid', 'flxdbg-log-clear');
    clearBtn.addEventListener('click', () => {
      this.#logList.innerHTML = '';
    });
    toolbar.appendChild(clearBtn);
    el.appendChild(toolbar);
    this.#logList = document.createElement('div');
    this.#logList.setAttribute('aria-live', 'polite');
    this.#logList.setAttribute('aria-label', 'Log messages');
    this.#logList.setAttribute('data-testid', 'flxdbg-log-list');
    el.appendChild(this.#logList);
  }

  #buildConsole(el: HTMLDivElement): void {
    const wrap = document.createElement('div');
    wrap.className = 'flxdbg-console';

    this.#consoleOutput = document.createElement('div');
    this.#consoleOutput.className = 'flxdbg-console-output';
    this.#consoleOutput.setAttribute('role', 'log');
    this.#consoleOutput.setAttribute('aria-live', 'polite');
    this.#consoleOutput.setAttribute('aria-label', 'Console output');
    this.#consoleOutput.setAttribute('data-testid', 'flxdbg-console-output');

    const form = document.createElement('form');
    form.className = 'flxdbg-console-form';
    const prompt = document.createElement('span');
    prompt.className = 'flxdbg-console-prompt';
    prompt.textContent = '>';
    prompt.setAttribute('aria-hidden', 'true');
    this.#consoleInput = document.createElement('input');
    this.#consoleInput.className = 'flxdbg-console-input';
    this.#consoleInput.type = 'text';
    this.#consoleInput.autocomplete = 'off';
    this.#consoleInput.spellcheck = false;
    this.#consoleInput.setAttribute('aria-label', 'Debugger command');
    this.#consoleInput.setAttribute('data-testid', 'flxdbg-console-input');
    form.append(prompt, this.#consoleInput);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.#executeConsoleInput();
    });
    this.#consoleInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.#navigateConsoleHistory(event.key === 'ArrowUp' ? -1 : 1);
      } else if (event.key === 'Tab') {
        const completions = this.console.complete(this.#consoleInput.value);
        if (completions.length === 1) {
          event.preventDefault();
          this.#consoleInput.value = `${completions[0]} `;
        }
      }
    });

    wrap.append(this.#consoleOutput, form);
    el.appendChild(wrap);
  }

  #buildWatch(el: HTMLDivElement): void {
    const table = document.createElement('table');
    table.className = 'flxdbg-watch-table';
    table.setAttribute('aria-label', 'Watched values');
    table.setAttribute('data-testid', 'flxdbg-watch-table');
    const thead = document.createElement('thead');
    thead.innerHTML =
      '<tr><th style="text-align:left;color:#475569;font-weight:normal;padding:2px 8px 2px 0">Name</th><th style="text-align:left;color:#475569;font-weight:normal">Value</th></tr>';
    table.appendChild(thead);
    this.#watchBody = document.createElement('tbody');
    this.#watchBody.setAttribute('data-testid', 'flxdbg-watch-body');
    table.appendChild(this.#watchBody);
    el.appendChild(table);
  }

  #buildPerf(el: HTMLDivElement): void {
    const mkRow = (
      label: string,
      testId: string,
    ): [HTMLSpanElement, HTMLDivElement] => {
      const row = document.createElement('div');
      row.className = 'flxdbg-perf-row';
      const lbl = document.createElement('span');
      lbl.className = 'flxdbg-perf-label';
      lbl.textContent = label;
      const val = document.createElement('span');
      val.className = 'flxdbg-perf-value';
      val.textContent = '—';
      val.setAttribute('data-testid', testId);
      const barWrap = document.createElement('div');
      barWrap.className = 'flxdbg-perf-bar-wrap';
      const bar = document.createElement('div');
      bar.className = 'flxdbg-perf-bar';
      bar.style.width = '0%';
      barWrap.appendChild(bar);
      row.append(lbl, val, barWrap);
      el.appendChild(row);
      return [val, bar];
    };

    [this.#perfFps] = mkRow('FPS', 'flxdbg-perf-fps');
    [this.#perfUpdateMs, this.#perfBar] = mkRow(
      'Update ms',
      'flxdbg-perf-updatems',
    );
    const graphs = document.createElement('div');
    graphs.className = 'flxdbg-graphs';
    [this.#perfUpdateLine] = this.#buildGraph(
      graphs,
      'Update history',
      '#38bdf8',
    );
    [this.#perfMemoryLine, this.#perfMemoryLabel] = this.#buildGraph(
      graphs,
      'Memory unavailable',
      '#a78bfa',
    );
    el.appendChild(graphs);
    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.className = 'flxdbg-export';
    exportButton.textContent = 'Export diagnostics JSON';
    exportButton.setAttribute('data-testid', 'flxdbg-export-diagnostics');
    exportButton.addEventListener('click', () => this.#downloadDiagnostics());
    el.appendChild(exportButton);
  }

  #buildVCR(el: HTMLDivElement): void {
    const wrap = document.createElement('div');
    wrap.className = 'flxdbg-vcr';

    this.#vcrStatus = document.createElement('span');
    this.#vcrStatus.className = 'flxdbg-vcr-status';
    this.#vcrStatus.textContent = 'IDLE';
    this.#vcrStatus.setAttribute('data-testid', 'flxdbg-vcr-status');
    wrap.appendChild(this.#vcrStatus);

    const btns = document.createElement('div');
    btns.className = 'flxdbg-vcr-btns';

    const mk = (
      label: string,
      testId: string,
      onClick: () => void,
    ): HTMLButtonElement => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'flxdbg-vcr-btn';
      b.textContent = label;
      b.setAttribute('data-testid', testId);
      b.addEventListener('click', onClick);
      btns.appendChild(b);
      return b;
    };

    this.#vcrRecord = mk('● Record', 'flxdbg-vcr-record', () => {
      this.#vcr?.record();
      this.#refreshVCRStatus();
    });
    this.#vcrStop = mk('■ Stop', 'flxdbg-vcr-stop', () => {
      this.#vcr?.stop();
      this.#refreshVCRStatus();
    });
    this.#vcrRewind = mk('≪ Rewind', 'flxdbg-vcr-rewind', () => {
      this.#vcr?.rewind();
      this.#refreshVCRStatus();
    });
    this.#vcrStep = mk('❚ Step', 'flxdbg-vcr-step', () => {
      this.#vcr?.stepFrame();
      this.#refreshVCRStatus();
    });
    this.#vcrPlay = mk('▶ Play', 'flxdbg-vcr-play', () => {
      this.#vcr?.play();
      this.#refreshVCRStatus();
    });

    wrap.appendChild(btns);
    el.appendChild(wrap);
  }

  #buildVis(el: HTMLDivElement): void {
    const wrap = document.createElement('div');
    wrap.className = 'flxdbg-vis';

    const mkToggle = (
      label: string,
      testId: string,
      onChange: (on: boolean) => void,
    ): void => {
      const row = document.createElement('div');
      row.className = 'flxdbg-vis-row';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flxdbg-vis-toggle';
      btn.setAttribute('role', 'switch');
      btn.setAttribute('aria-checked', 'false');
      btn.setAttribute('aria-label', label);
      btn.setAttribute('data-testid', testId);
      let on = false;
      btn.addEventListener('click', () => {
        on = !on;
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-checked', String(on));
        onChange(on);
      });
      const lbl = document.createElement('span');
      lbl.className = 'flxdbg-vis-label';
      lbl.textContent = label;
      row.append(btn, lbl);
      wrap.appendChild(row);
    };

    mkToggle('Visual debug (bounds/paths)', 'flxdbg-vis-debug', (on) => {
      // This will be wired to FlxG.visualDebug by the consumer
      this.#root.dispatchEvent(
        new CustomEvent('flxdbg:vis-debug', { detail: { on }, bubbles: true }),
      );
    });

    el.appendChild(wrap);
  }

  // ─── Internal update handlers ──────────────────────────────────────────────

  #onStepComplete(frame: number, updateMs: number, watch: FlxWatch): void {
    // Perf
    this.#frameCount++;
    const now = performance.now();
    if (now - this.#lastFpsTime >= 500) {
      this.#currentFps = Math.round(
        (this.#frameCount * 1000) / (now - this.#lastFpsTime || 1),
      );
      this.#frameCount = 0;
      this.#lastFpsTime = now;
      if (this.#activeTab === 'perf') this.#refreshPerf(updateMs);
    }
    this.diagnostics.record(frame, updateMs, this.#currentFps, now);
    if (this.#activeTab === 'perf') this.#refreshDiagnosticGraphs();

    // Watch
    if (this.#activeTab === 'watch') {
      this.#refreshWatch(watch);
    }

    // VCR status
    if (this.#activeTab === 'vcr') {
      this.#refreshVCRStatus();
    }
  }

  #onPauseChange(_paused: boolean): void {
    void _paused;
    if (this.#activeTab === 'vcr') this.#refreshVCRStatus();
  }

  #refreshLog(log: FlxLog): void {
    if (!this.#visible || this.#activeTab !== 'log') return;
    const entries = log.entries;
    const existing = this.#logList.children.length;
    for (let i = existing; i < entries.length; i++) {
      const e = entries[i];
      if (e === undefined) continue;
      const row = document.createElement('div');
      row.className = 'flxdbg-log-entry';
      const time = new Date(e.timestamp).toISOString().slice(11, 23);
      const colorHex = `#${(e.color & 0xffffff).toString(16).padStart(6, '0')}`;
      row.innerHTML = `<span class="flxdbg-log-time">${time}</span><span style="color:${colorHex}">${this.#esc(e.message)}</span>`;
      this.#logList.appendChild(row);
    }
    // auto-scroll
    this.#logList.scrollTop = this.#logList.scrollHeight;
  }

  #refreshWatch(watch: FlxWatch): void {
    const snapshots = watch.snapshot();
    const activeIds = new Set<string>();
    for (const snapshot of snapshots) {
      activeIds.add(snapshot.id);
      let elements = this.#watchRows.get(snapshot.id);
      if (elements === undefined) {
        elements = this.#createWatchRow(snapshot, watch);
        this.#watchRows.set(snapshot.id, elements);
        this.#watchBody.appendChild(elements.row);
      }
      elements.name.textContent = snapshot.name;
      if (elements.input && document.activeElement !== elements.input) {
        elements.input.value = snapshot.value;
      } else if (elements.value) {
        elements.value.textContent = snapshot.value;
      }
    }
    for (const [id, elements] of this.#watchRows) {
      if (activeIds.has(id)) continue;
      elements.row.remove();
      this.#watchRows.delete(id);
    }
  }

  #createWatchRow(
    snapshot: WatchSnapshot,
    watch: FlxWatch,
  ): {
    input: HTMLInputElement | null;
    name: HTMLTableCellElement;
    row: HTMLTableRowElement;
    status: HTMLSpanElement | null;
    value: HTMLSpanElement | null;
  } {
    const row = document.createElement('tr');
    row.setAttribute('data-watch-id', snapshot.id);
    const name = document.createElement('td');
    name.className = 'flxdbg-watch-name';
    const valueCell = document.createElement('td');
    valueCell.className = 'flxdbg-watch-value';
    row.append(name, valueCell);

    if (!snapshot.editable) {
      const value = document.createElement('span');
      value.textContent = snapshot.value;
      valueCell.appendChild(value);
      return { input: null, name, row, status: null, value };
    }

    const editor = document.createElement('div');
    editor.className = 'flxdbg-watch-editor';
    const input = document.createElement('input');
    input.className = 'flxdbg-watch-input';
    input.type = 'text';
    input.value = snapshot.value;
    input.setAttribute('aria-label', `Edit ${snapshot.name}`);
    input.setAttribute('data-watch-input', snapshot.id);
    const apply = document.createElement('button');
    apply.className = 'flxdbg-watch-apply';
    apply.type = 'button';
    apply.textContent = 'Apply';
    apply.setAttribute('aria-label', `Apply ${snapshot.name}`);
    const status = document.createElement('span');
    status.className = 'flxdbg-watch-status';
    status.setAttribute('role', 'status');

    const applyEdit = (): void => {
      const result = watch.edit(snapshot.id, input.value);
      input.setAttribute('aria-invalid', String(!result.ok));
      status.classList.toggle('error', !result.ok);
      if (result.ok) {
        input.value = result.snapshot?.value ?? input.value;
        status.textContent = 'Updated';
      } else {
        status.textContent = result.error ?? 'Update rejected';
      }
    };
    apply.addEventListener('click', applyEdit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        const current = watch
          .snapshot()
          .find((candidate) => candidate.id === snapshot.id);
        if (current) input.value = current.value;
        input.setAttribute('aria-invalid', 'false');
        status.textContent = '';
      }
    });
    editor.append(input, apply, status);
    valueCell.appendChild(editor);
    return { input, name, row, status, value: null };
  }

  #refreshPerf(updateMs: number): void {
    this.#perfFps.textContent = `${this.#currentFps} FPS`;
    this.#perfUpdateMs.textContent = `${updateMs.toFixed(2)} ms`;
    this.#perfBar.style.width = `${Math.min(100, (updateMs / 16.67) * 100)}%`;
    this.#perfBar.style.background =
      updateMs > 12 ? '#f87171' : updateMs > 8 ? '#facc15' : '#38bdf8';
  }

  #buildGraph(
    parent: HTMLElement,
    labelText: string,
    color: string,
  ): [SVGPolylineElement, HTMLSpanElement] {
    const wrap = document.createElement('div');
    wrap.className = 'flxdbg-graph';
    const label = document.createElement('span');
    label.className = 'flxdbg-graph-label';
    label.textContent = labelText;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 180 42');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', labelText);
    const line = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polyline',
    );
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(line);
    wrap.append(label, svg);
    parent.appendChild(wrap);
    return [line, label];
  }

  #refreshDiagnosticGraphs(): void {
    const samples = this.diagnostics.samples;
    this.#perfUpdateLine.setAttribute(
      'points',
      graphPoints(
        samples.map((sample) => sample.updateMs),
        180,
        42,
        16.67,
      ),
    );
    const memory = samples.map((sample) => sample.memoryBytes);
    const memoryValues = memory.filter(
      (value): value is number => value !== null,
    );
    this.#perfMemoryLine.setAttribute(
      'points',
      graphPoints(memoryValues, 180, 42),
    );
    this.#perfMemoryLabel.textContent =
      memoryValues.length === 0
        ? 'Memory unavailable'
        : `Heap ${(memoryValues.at(-1) ?? 0) / 1_048_576 < 0.1 ? '<0.1' : ((memoryValues.at(-1) ?? 0) / 1_048_576).toFixed(1)} MiB`;
  }

  #downloadDiagnostics(): void {
    const blob = new Blob([this.exportDiagnostics()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `flixel-pixi-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  #refreshVCRStatus(): void {
    const vcr = this.#vcr?.getVCR();
    if (!vcr) return;
    if (vcr.recording) {
      this.#vcrStatus.textContent = 'RECORDING ●';
      this.#vcrStatus.style.color = '#f87171';
    } else if (vcr.replaying) {
      this.#vcrStatus.textContent = 'REPLAYING ▶';
      this.#vcrStatus.style.color = '#4ade80';
    } else {
      this.#vcrStatus.textContent = vcr.replay
        ? `IDLE — ${vcr.replay.frameCount} frames ready`
        : 'IDLE';
      this.#vcrStatus.style.color = '#4ade80';
    }
    this.#vcrRecord.disabled = vcr.recording;
    this.#vcrStop.disabled = !vcr.recording;
    this.#vcrPlay.disabled = vcr.replay === null || vcr.recording;
    this.#vcrRewind.disabled = vcr.replay === null || vcr.recording;
    this.#vcrStep.disabled = vcr.replay === null || vcr.recording;
  }

  async #executeConsoleInput(): Promise<void> {
    const input = this.#consoleInput.value;
    if (input.trim().length === 0) return;
    this.#consoleInput.value = '';
    this.#appendConsoleRow(`> ${input}`, 'flxdbg-console-command');
    const result = await this.console.execute(input);
    this.#appendConsoleResult(result);
    this.#consoleHistoryIndex = this.console.history.length;
  }

  #appendConsoleResult(result: FlxConsoleResult): void {
    if (result.output.length === 0) return;
    this.#appendConsoleRow(
      result.output,
      result.ok ? 'flxdbg-console-result' : 'flxdbg-console-error',
    );
  }

  #appendConsoleRow(text: string, className: string): void {
    const row = document.createElement('div');
    row.className = `flxdbg-console-row ${className}`;
    row.textContent = text;
    this.#consoleOutput.appendChild(row);
    this.#consoleOutput.scrollTop = this.#consoleOutput.scrollHeight;
  }

  #navigateConsoleHistory(direction: -1 | 1): void {
    const history = this.console.history;
    this.#consoleHistoryIndex = Math.max(
      0,
      Math.min(history.length, this.#consoleHistoryIndex + direction),
    );
    this.#consoleInput.value = history[this.#consoleHistoryIndex] ?? '';
  }

  readonly #onLauncherClick = (): void => {
    this.show();
    this.#focusDebugger();
  };

  readonly #onWindowKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === 'Escape' &&
      this.#visible &&
      document.activeElement instanceof HTMLElement &&
      this.#root.contains(document.activeElement)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.hide();
      return;
    }
    if (
      event.repeat ||
      event.code !== this.#toggleKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.#visible) this.hide();
    else {
      this.show();
      this.#focusDebugger();
    }
  };

  #focusDebugger(): void {
    const target =
      this.#restoreFocus?.isConnected === true
        ? this.#restoreFocus
        : this.#tabs.get(this.#activeTab);
    this.#restoreFocus = null;
    target?.focus();
  }

  // ─── Tab switching ─────────────────────────────────────────────────────────

  #switchTab(id: string): void {
    this.#activeTab = id;
    for (const [key, tab] of this.#tabs) {
      const active = key === id;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    }
    for (const [key, panel] of this.#panels) {
      panel.classList.toggle('active', key === id);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  #esc(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function graphPoints(
  values: readonly number[],
  width: number,
  height: number,
  maximum = Math.max(...values, Number.EPSILON),
): string {
  if (values.length === 0) return '';
  const safeMaximum = Math.max(maximum, Number.EPSILON);
  const divisor = Math.max(1, values.length - 1);
  return values
    .map((value, index) => {
      const x = (index / divisor) * width;
      const y = height - clamp01(value / safeMaximum) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
