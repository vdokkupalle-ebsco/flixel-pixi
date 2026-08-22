<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';

import type { BrowserGameApplication } from 'flixel-pixi';
import artSource from '../../../../examples/games/hero-runner/art.ts?raw';
import gameSource from '../../../../examples/games/hero-runner/game.ts?raw';
import mainSource from '../../../../examples/games/hero-runner/main.ts?raw';

type HeroRunnerModule =
  typeof import('../../../../examples/games/hero-runner/main');

const typeScriptKeywords = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'of',
  'override',
  'private',
  'protected',
  'public',
  'readonly',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'while',
]);

function escapeCode(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function highlightTypeScript(source: string): string {
  const tokens =
    source.match(
      /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\[\s\S]|[^`])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|0x[\da-f]+|\b\d+(?:\.\d+)?\b|#[A-Za-z_$][\w$]*|[A-Za-z_$][\w$]*|\s+|./gi,
    ) ?? [];

  return tokens
    .map((token) => {
      const escaped = escapeCode(token);
      if (token.startsWith('//') || token.startsWith('/*')) {
        return `<span class="code-comment">${escaped}</span>`;
      }
      if (/^['"`]/.test(token)) {
        return `<span class="code-string">${escaped}</span>`;
      }
      if (/^(?:0x[\da-f]+|\d)/i.test(token)) {
        return `<span class="code-number">${escaped}</span>`;
      }
      if (typeScriptKeywords.has(token)) {
        return `<span class="code-keyword">${escaped}</span>`;
      }
      if (/^[A-Z][\w$]*$/.test(token)) {
        return `<span class="code-type">${escaped}</span>`;
      }
      if (token.startsWith('#')) {
        return `<span class="code-private">${escaped}</span>`;
      }
      return escaped;
    })
    .join('');
}

const codeTabs = [
  {
    id: 'main',
    label: 'main.ts',
    code: highlightTypeScript(mainSource),
  },
  {
    id: 'game',
    label: 'game.ts',
    code: highlightTypeScript(gameSource),
  },
  {
    id: 'art',
    label: 'art.ts',
    code: highlightTypeScript(artSource),
  },
] as const;

type CodeTabId = (typeof codeTabs)[number]['id'];

const installCommand = 'npm install flixel-pixi@next pixi.js@^8.19.0';
const copied = ref(false);
const gameHost = ref<HTMLElement>();
const gameReady = ref(false);
const activeCodeTab = ref<CodeTabId>('game');
const startup = new AbortController();
let heroGame: BrowserGameApplication | undefined;
let heroRunnerModule: HeroRunnerModule | undefined;
let gameObserver: IntersectionObserver | undefined;
let gameStarting = false;

async function startGame() {
  const host = gameHost.value;
  if (gameStarting || !host || startup.signal.aborted) return;
  gameStarting = true;

  try {
    const runner = await import('../../../../examples/games/hero-runner/main');
    if (startup.signal.aborted) return;

    heroRunnerModule = runner;
    const game = await runner.startHeroRunner(host, startup.signal);

    if (startup.signal.aborted) {
      game.destroy();
      return;
    }

    heroGame = game;
    gameReady.value = true;
  } catch (error) {
    if (!startup.signal.aborted)
      console.error('Hero game failed to start', error);
  }
}

onMounted(() => {
  if (!gameHost.value) return;

  if (!('IntersectionObserver' in window)) {
    void startGame();
    return;
  }

  gameObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      gameObserver?.disconnect();
      gameObserver = undefined;
      void startGame();
    },
    { rootMargin: '160px' },
  );
  gameObserver.observe(gameHost.value);
});

onBeforeUnmount(() => {
  gameObserver?.disconnect();
  gameObserver = undefined;
  startup.abort();
  heroGame?.destroy();
  heroGame = undefined;
  heroRunnerModule = undefined;
});

function requestJump() {
  heroRunnerModule?.jumpHeroRunner(heroGame);
}

function selectCodeTab(tab: CodeTabId) {
  activeCodeTab.value = tab;
}

function moveCodeTab(event: KeyboardEvent, index: number) {
  const lastIndex = codeTabs.length - 1;
  let nextIndex: number | undefined;
  if (event.key === 'ArrowRight')
    nextIndex = index === lastIndex ? 0 : index + 1;
  if (event.key === 'ArrowLeft')
    nextIndex = index === 0 ? lastIndex : index - 1;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = lastIndex;
  if (nextIndex === undefined) return;

  event.preventDefault();
  const tab = codeTabs[nextIndex];
  if (!tab) return;
  activeCodeTab.value = tab.id;
  document.getElementById(`hero-code-tab-${tab.id}`)?.focus();
}

async function copyInstall() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(installCommand);
  } else {
    const field = document.createElement('textarea');
    field.value = installCommand;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
  copied.value = true;
  window.setTimeout(() => (copied.value = false), 1800);
}
</script>

<template>
  <section class="home-hero" aria-labelledby="home-title">
    <div class="hero-grid">
      <div class="hero-copy">
        <h1 id="home-title">
          Make the game<br /><span>you keep thinking about.</span>
        </h1>
        <p class="hero-intro">
          Flixel-Pixi handles the game loop, rendering, input, collisions,
          sound, and all the fiddly browser work. You get to spend that time
          making the game feel good.
        </p>
        <div class="hero-actions">
          <a :href="withBase('/guide/getting-started')" class="primary-action">
            Make your first scene
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" />
            </svg>
          </a>
          <a :href="withBase('/examples/')" class="secondary-action">
            Play with the examples
          </a>
        </div>
        <div class="install-command" aria-label="Install Flixel-Pixi">
          <span aria-hidden="true">$</span>
          <code>{{ installCommand }}</code>
          <button
            type="button"
            :class="{ copied }"
            :aria-label="
              copied ? 'Install command copied' : 'Copy install command'
            "
            @click="copyInstall"
          >
            <svg v-if="!copied" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="7" y="7" width="9" height="9" rx="2" />
              <path
                d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
              />
            </svg>
            <svg v-else viewBox="0 0 20 20" aria-hidden="true">
              <path d="m4 10 4 4 8-9" />
            </svg>
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <div class="hero-features" aria-label="What Flixel-Pixi includes">
          <p>The core is just <strong>137 kB gzipped.</strong></p>
          <ul>
            <li>Move sprites and animate them</li>
            <li>Handle collisions and physics</li>
            <li>Use keyboard, touch, pointer, or gamepad</li>
            <li>Add cameras, sound, particles, and effects</li>
            <li>Build tilemaps and preload assets</li>
            <li>Save progress, record replays, and debug</li>
          </ul>
        </div>
      </div>

      <div class="hero-visual" aria-label="Flixel-Pixi TypeScript example">
        <div class="hero-game-card">
          <div
            ref="gameHost"
            class="game-canvas-host"
            tabindex="0"
            role="application"
            aria-label="Playable Flixel-Pixi gem runner. Tap, click, or press Enter to jump and collect gems."
            @pointerdown="requestJump"
            @keydown.enter.prevent="requestJump"
          ></div>
          <span class="game-status">
            <i aria-hidden="true"></i>
            {{ gameReady ? 'Running on Flixel-Pixi' : 'Starting game' }}
          </span>
          <span class="game-hint">Tap / Enter</span>
        </div>
        <div class="code-window">
          <div class="code-titlebar">
            <div class="window-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </div>
            <div
              class="code-tabs"
              role="tablist"
              aria-label="Runner game files"
            >
              <button
                v-for="(tab, index) in codeTabs"
                :id="`hero-code-tab-${tab.id}`"
                :key="tab.id"
                type="button"
                role="tab"
                :aria-selected="activeCodeTab === tab.id"
                :aria-controls="`hero-code-panel-${tab.id}`"
                :tabindex="activeCodeTab === tab.id ? 0 : -1"
                @click="selectCodeTab(tab.id)"
                @keydown="moveCodeTab($event, index)"
              >
                {{ tab.label }}
              </button>
            </div>
            <span class="file-type">TS</span>
          </div>
          <template v-for="tab in codeTabs" :key="tab.id">
            <pre
              v-show="activeCodeTab === tab.id"
              :id="`hero-code-panel-${tab.id}`"
              role="tabpanel"
              :aria-labelledby="`hero-code-tab-${tab.id}`"
              tabindex="0"
            ><code v-html="tab.code"></code></pre>
          </template>
          <div class="code-statusbar">
            <span><i aria-hidden="true"></i> Engine ready</span
            ><span>TypeScript</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--vp-c-divider);
  background:
    radial-gradient(
      circle at 82% 38%,
      var(--vp-c-brand-soft-strong),
      transparent 28%
    ),
    linear-gradient(180deg, var(--vp-c-bg) 0%, var(--vp-c-bg-alt) 100%);
}
.home-hero::before {
  position: absolute;
  inset: 0;
  opacity: 0.38;
  background-image:
    linear-gradient(var(--vp-c-divider) 1px, transparent 1px),
    linear-gradient(90deg, var(--vp-c-divider) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(90deg, transparent, #000 58%, transparent);
  content: '';
  pointer-events: none;
}
.hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(500px, 1.06fr);
  gap: clamp(48px, 7vw, 108px);
  align-items: center;
  width: min(1320px, calc(100% - 56px));
  min-height: 720px;
  margin: 0 auto;
  padding: 104px 0 96px;
}
h1 {
  max-width: 720px;
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(54px, 6.3vw, 92px);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.065em;
  text-wrap: balance;
}
h1 span {
  color: transparent;
  background: linear-gradient(
    90deg,
    var(--vp-c-brand-1),
    var(--vp-c-accent-rose)
  );
  background-clip: text;
  -webkit-background-clip: text;
}
.hero-intro {
  max-width: 650px;
  margin: 28px 0 0;
  color: var(--vp-c-text-2);
  font-size: 17px;
  line-height: 1.72;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}
.hero-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 21px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
}
.hero-actions svg {
  width: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}
.primary-action {
  color: #090d16;
  background: var(--vp-c-logo-pink);
  box-shadow: 0 10px 30px
    color-mix(in srgb, var(--vp-c-logo-pink) 28%, transparent);
}
.primary-action:hover {
  background: color-mix(in srgb, var(--vp-c-logo-pink) 88%, white);
  transform: translateY(-2px);
}
.secondary-action {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  border-color: var(--vp-c-border) !important;
}
.secondary-action:hover {
  border-color: var(--vp-c-brand-1) !important;
  transform: translateY(-2px);
}
.install-command {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 610px;
  min-height: 54px;
  margin-top: 26px;
  padding: 7px 7px 7px 15px;
  border: 1px solid var(--vp-c-border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 88%, transparent);
  box-shadow: var(--vp-shadow-sm);
}
.install-command > span {
  color: var(--vp-c-accent-coral);
  font-family: var(--vp-font-family-mono);
  font-weight: 800;
}
.install-command code {
  overflow-x: auto;
  color: var(--vp-c-text-1);
  font: 500 11px/1.5 var(--vp-font-family-mono);
  white-space: nowrap;
  scrollbar-width: none;
}
.install-command code::-webkit-scrollbar {
  display: none;
}
.install-command button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 76px;
  min-height: 38px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font: 700 10px var(--vp-font-family-mono);
  cursor: pointer;
}
.install-command button:hover,
.install-command button.copied {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
.install-command button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
}
.hero-features {
  max-width: 610px;
  margin: 28px 0 0;
  padding: 17px 19px 18px;
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 74%, transparent);
  box-shadow: var(--vp-shadow-sm);
}
.hero-features p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.5;
}
.hero-features strong {
  color: var(--vp-c-text-1);
  font-weight: 700;
}
.hero-features ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 24px;
  margin: 14px 0 0;
  padding: 14px 0 0;
  border-top: 1px solid var(--vp-c-divider);
  list-style: none;
}
.hero-features li {
  position: relative;
  padding-left: 15px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.45;
}
.hero-features li::before {
  position: absolute;
  top: 0.55em;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--vp-c-logo-cyan);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--vp-c-logo-cyan) 12%, transparent);
  content: '';
}
.hero-visual {
  position: relative;
  min-height: 530px;
}
.code-window {
  position: absolute;
  z-index: 1;
  inset: 20px 0 auto 0;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  background: #0b1114;
  box-shadow: var(--vp-shadow-lg);
  transform: rotate(1.2deg);
}
.code-titlebar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 44px;
  padding: 0 14px;
  border-bottom: 1px solid rgb(255 255 255/8%);
  color: #839494;
  background: #10181b;
  font: 600 10px var(--vp-font-family-mono);
}
.code-tabs {
  display: flex;
  align-self: stretch;
  gap: 2px;
}
.code-tabs button {
  position: relative;
  min-width: 64px;
  padding: 0 10px;
  color: #839494;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.code-tabs button::after {
  position: absolute;
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: transparent;
  content: '';
}
.code-tabs button:hover,
.code-tabs button[aria-selected='true'] {
  color: #f7f9fc;
  background: rgb(255 255 255/4%);
}
.code-tabs button[aria-selected='true']::after {
  background: var(--vp-c-logo-pink);
}
.code-tabs button:focus-visible {
  outline: 2px solid var(--vp-c-logo-cyan);
  outline-offset: -3px;
}
.window-dots {
  display: flex;
  gap: 6px;
}
.window-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-logo-pink);
}
.window-dots i:nth-child(2) {
  background: var(--vp-c-logo-cyan);
}
.window-dots i:nth-child(3) {
  background: #f7f9fc;
}
.file-type {
  justify-self: end;
  color: var(--vp-c-logo-cyan);
}
.code-window pre {
  height: 378px;
  margin: 0;
  padding: 28px 27px;
  overflow: auto;
  color: #d5e3e1;
  font: 500 12px/1.85 var(--vp-font-family-mono);
  tab-size: 2;
}
.code-window code {
  font: inherit;
}
.code-window :deep(.code-muted) {
  color: #819391;
}
.code-window :deep(.code-keyword) {
  color: #ff5b93;
}
.code-window :deep(.code-string) {
  color: #72edf3;
}
.code-window :deep(.code-type) {
  color: #22dce7;
}
.code-window :deep(.code-fn) {
  color: #f7f9fc;
}
.code-window :deep(.code-number) {
  color: #ff79a7;
}
.code-window :deep(.code-comment) {
  color: #728481;
  font-style: italic;
}
.code-window :deep(.code-private) {
  color: #e4b8ff;
}
.code-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 9px 14px;
  color: #8ea09e;
  border-top: 1px solid rgb(255 255 255/8%);
  background: #10181b;
  font: 600 9px var(--vp-font-family-mono);
}
.code-statusbar span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--vp-c-logo-cyan);
}
.code-statusbar i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-logo-cyan);
}
.hero-game-card {
  position: absolute;
  z-index: 2;
  right: -34px;
  bottom: -2px;
  width: 260px;
  aspect-ratio: 16/9;
  overflow: hidden;
  border: 5px solid var(--vp-c-bg-elv);
  border-radius: 10px;
  background: #090d16;
  box-shadow: var(--vp-shadow-lg);
  transform: rotate(-3deg);
}
.game-canvas-host {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  cursor: pointer;
  touch-action: manipulation;
}
.game-canvas-host:focus-visible {
  box-shadow: inset 0 0 0 3px var(--vp-c-logo-pink);
}
.game-canvas-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
}
.game-status {
  position: absolute;
  top: 9px;
  right: 9px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  color: #d8fff0;
  border-radius: 4px;
  background: rgb(7 23 25/72%);
  font: 700 8px var(--vp-font-family-mono);
  pointer-events: none;
}
.game-status i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vp-c-logo-cyan);
}
.game-hint {
  position: absolute;
  right: 9px;
  bottom: 7px;
  color: rgb(255 255 255/72%);
  font: 700 8px var(--vp-font-family-mono);
  text-transform: uppercase;
  pointer-events: none;
}
@media (max-width: 1050px) {
  .hero-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 54px;
    padding-bottom: 84px;
  }
  .hero-copy {
    min-width: 0;
    max-width: 780px;
  }
  .hero-visual {
    min-width: 0;
    min-height: 500px;
    width: min(680px, 100%);
  }
}
@media (max-width: 640px) {
  .hero-grid {
    width: min(100% - 40px, 1320px);
    min-height: auto;
    padding: 76px 0 70px;
  }
  h1 {
    font-size: clamp(48px, 15vw, 70px);
  }
  .hero-intro {
    font-size: 16px;
  }
  .hero-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
  .install-command code {
    overflow-wrap: anywhere;
    white-space: normal;
  }
  .hero-features ul {
    grid-template-columns: 1fr;
  }
  .hero-visual {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
    min-height: 0;
  }
  .code-window {
    position: relative;
    inset: auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    transform: none;
  }
  .code-titlebar {
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding-inline: 10px;
  }
  .code-tabs {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .code-tabs::-webkit-scrollbar {
    display: none;
  }
  .code-tabs button {
    flex: 0 0 auto;
  }
  .code-window pre {
    padding: 22px 18px;
    font-size: 10px;
  }
  .hero-game-card {
    position: relative;
    inset: auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    border-width: 4px;
    transform: none;
  }
}
</style>
