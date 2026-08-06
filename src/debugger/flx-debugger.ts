import type { DebugChannel } from './debug-channel';
import type { FlxLog } from './flx-log';
import type { FlxVCR } from '../replay/flx-vcr';
import type { FlxWatch } from './flx-watch';

// ─── Inline CSS ──────────────────────────────────────────────────────────────
const DEBUGGER_CSS = `
.flxdbg-overlay {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  max-height: 260px;
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
.flxdbg-panels { flex: 1; overflow: hidden; position: relative; }
.flxdbg-panel {
  display: none;
  height: 100%;
  overflow-y: auto;
  padding: 6px 10px;
  box-sizing: border-box;
}
.flxdbg-panel.active { display: block; }

/* Log panel */
.flxdbg-log-entry { padding: 1px 0; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }
.flxdbg-log-time { color: #475569; margin-right: 6px; }

/* Watch panel */
.flxdbg-watch-table { width: 100%; border-collapse: collapse; }
.flxdbg-watch-table td { padding: 2px 8px 2px 0; }
.flxdbg-watch-name { color: #94a3b8; }
.flxdbg-watch-value { color: #4ade80; font-weight: bold; }

/* Perf panel */
.flxdbg-perf-row { display: flex; gap: 20px; align-items: center; padding: 4px 0; }
.flxdbg-perf-label { color: #94a3b8; min-width: 80px; }
.flxdbg-perf-value { color: #facc15; font-weight: bold; }
.flxdbg-perf-bar-wrap { flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; max-width: 200px; }
.flxdbg-perf-bar { height: 100%; background: #38bdf8; border-radius: 4px; transition: width 0.1s; }

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

export interface FlxDebuggerOptions {
  /** Element to mount the overlay inside. Defaults to document.body. */
  container?: HTMLElement;
}

/** Callbacks the debugger needs to invoke VCR actions on the game. */
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
 * DOM overlay debugger with Log, Watch, Perf, VCR, and Vis panels.
 * Mounts as a fixed bottom bar. Fully keyboard/screen-reader accessible.
 * @public
 */
export class FlxDebugger {
  readonly #root: HTMLDivElement;
  readonly #panels = new Map<string, HTMLDivElement>();
  readonly #tabs = new Map<string, HTMLButtonElement>();
  #activeTab = 'log';
  #visible = true;

  // Panel-specific elements
  #logList!: HTMLDivElement;
  #watchBody!: HTMLTableSectionElement;
  #perfFps!: HTMLSpanElement;
  #perfUpdateMs!: HTMLSpanElement;
  #perfBar!: HTMLDivElement;
  #vcrStatus!: HTMLSpanElement;
  #vcrRecord!: HTMLButtonElement;
  #vcrStop!: HTMLButtonElement;
  #vcrPlay!: HTMLButtonElement;
  #vcrRewind!: HTMLButtonElement;
  #vcrStep!: HTMLButtonElement;
  #vcr: FlxDebuggerVCRCallbacks | null = null;

  // Perf state
  #frameCount = 0;
  #lastFpsTime = 0;
  #currentFps = 0;

  #destroyed = false;
  #styleEl: HTMLStyleElement | null = null;

  constructor(options: FlxDebuggerOptions = {}) {
    const { container = document.body } = options;

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

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'flxdbg-tabs';
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', 'Debugger panels');
    this.#root.appendChild(tabBar);

    const TAB_LABELS: [string, string][] = [
      ['log', 'Log'],
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
    toggleBtn.setAttribute('aria-label', 'Hide debugger');
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
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  get visible(): boolean {
    return this.#visible;
  }

  show(): void {
    this.#visible = true;
    this.#root.classList.remove('hidden');
  }

  hide(): void {
    this.#visible = false;
    this.#root.classList.add('hidden');
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
    log.setOnChange(() => {
      this.#refreshLog(log);
    });
    channel.on('step-complete', (p) => {
      this.#onStepComplete(p.updateMs, watch);
    });
    channel.on('pause-change', (p) => {
      this.#onPauseChange(p.paused);
    });
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#root.remove();
    this.#styleEl?.remove();
  }

  // ─── Panel builders ────────────────────────────────────────────────────────

  #buildPanel(id: string, el: HTMLDivElement): void {
    if (id === 'log') this.#buildLog(el);
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

  #onStepComplete(updateMs: number, watch: FlxWatch): void {
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

    // Watch
    if (this.#activeTab === 'watch') {
      this.#refreshWatch(watch.snapshot());
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

  #refreshWatch(snapshots: readonly { name: string; value: string }[]): void {
    this.#watchBody.innerHTML = '';
    for (const s of snapshots) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="flxdbg-watch-name">${this.#esc(s.name)}</td><td class="flxdbg-watch-value">${this.#esc(s.value)}</td>`;
      this.#watchBody.appendChild(tr);
    }
  }

  #refreshPerf(updateMs: number): void {
    this.#perfFps.textContent = `${this.#currentFps} FPS`;
    this.#perfUpdateMs.textContent = `${updateMs.toFixed(2)} ms`;
    this.#perfBar.style.width = `${Math.min(100, (updateMs / 16.67) * 100)}%`;
    this.#perfBar.style.background =
      updateMs > 12 ? '#f87171' : updateMs > 8 ? '#facc15' : '#38bdf8';
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
