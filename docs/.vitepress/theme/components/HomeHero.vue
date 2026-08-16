<script setup lang="ts">
import { computed, ref } from 'vue';

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const selectedPM = ref<PackageManager>('npm');
const copied = ref(false);

const installCommands: Record<PackageManager, string> = {
  npm: 'npm install flixel-pixi@next pixi.js@^8.19.0',
  pnpm: 'pnpm add flixel-pixi@next pixi.js@^8.19.0',
  yarn: 'yarn add flixel-pixi@next pixi.js@^8.19.0',
  bun: 'bun add flixel-pixi@next pixi.js@^8.19.0',
};

const currentCmd = computed(() => installCommands[selectedPM.value]);

function copyInstall() {
  navigator.clipboard?.writeText(currentCmd.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <section class="hero-wrapper">
    <div class="hero-inner">
      <!-- Logo Brand Emblem -->
      <div class="hero-logo-frame">
        <img
          src="/logo.png"
          alt="Flixel-Pixi Logo"
          class="hero-logo-img"
          width="130"
          height="130"
        />
      </div>

      <!-- Engine Version and Target Line -->
      <div class="hero-badge-group">
        <span class="badge-pill active-tag">v0.1.0-rc.5 Prerelease</span>
        <span class="badge-pill">PixiJS v8 Engine</span>
        <span class="badge-pill">TypeScript 5.9</span>
        <span class="badge-pill">MIT Licensed</span>
      </div>

      <!-- Main Headline -->
      <h1 class="hero-headline">
        The Classic Flixel Engine,
        <br />
        <span class="accent-text"
          >Engineered for Modern Web &amp; PixiJS v8</span
        >
      </h1>

      <!-- Subtitle Description -->
      <p class="hero-lead">
        A browser-native TypeScript game engine uniting AdamAtomic's
        battle-tested fixed-step game loop and state architecture with PixiJS
        v8's multi-backend WebGL / WebGPU rendering pipeline.
      </p>

      <!-- Multi-Package Manager Install Terminal -->
      <div class="terminal-card">
        <div class="terminal-header">
          <div class="pm-tabs">
            <button
              v-for="pm in ['npm', 'pnpm', 'yarn', 'bun'] as const"
              :key="pm"
              class="pm-tab"
              :class="{ active: selectedPM === pm }"
              @click="selectedPM = pm"
            >
              {{ pm }}
            </button>
          </div>
          <button
            class="copy-action-btn"
            @click="copyInstall"
            :title="copied ? 'Copied to clipboard' : 'Copy command'"
          >
            <span v-if="!copied" class="copy-label">
              <svg
                class="copy-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                ></path>
              </svg>
              Copy
            </span>
            <span v-else class="copied-label">
              <svg
                class="check-icon"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                stroke-width="2.5"
                fill="none"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            </span>
          </button>
        </div>

        <div class="terminal-body">
          <span class="term-prompt">$</span>
          <code class="term-code">{{ currentCmd }}</code>
        </div>
      </div>

      <!-- Action Navigation Buttons -->
      <div class="hero-cta-group">
        <a href="/guide/getting-started" class="btn-cta btn-primary">
          <span>Documentation &amp; Guide</span>
          <span class="arrow">&rarr;</span>
        </a>
        <a href="/examples/" class="btn-cta btn-outline">
          <span>&#127918;</span>
          <span>Playable Examples</span>
        </a>
        <a href="/api/" class="btn-cta btn-outline">
          <span>API Reference</span>
        </a>
        <a
          href="https://github.com/vdokkupalle-ebsco/flixel-pixi"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-cta btn-outline"
        >
          <span>GitHub</span>
          <span class="ext-icon">&#x2197;</span>
        </a>
      </div>

      <!-- Key Specs Bar -->
      <div class="specs-strip">
        <div class="spec-item">
          <span class="spec-val">Fixed-Step</span>
          <span class="spec-label">Deterministic 60/120Hz Loop</span>
        </div>
        <span class="spec-sep">/</span>
        <div class="spec-item">
          <span class="spec-val">PixiJS v8</span>
          <span class="spec-label">WebGL &amp; WebGPU Batching</span>
        </div>
        <span class="spec-sep">/</span>
        <div class="spec-item">
          <span class="spec-val">QuadTree</span>
          <span class="spec-label">Zero-Alloc Spatial Physics</span>
        </div>
        <span class="spec-sep">/</span>
        <div class="spec-item">
          <span class="spec-val">0 Leaks</span>
          <span class="spec-label">Soak &amp; GC Verified</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-wrapper {
  position: relative;
  padding: 56px 16px 40px;
  max-width: 1080px;
  margin: 0 auto;
}

.hero-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Logo Frame */
.hero-logo-frame {
  margin-bottom: 28px;
}

.hero-logo-img {
  width: 110px;
  height: 110px;
  border-radius: 24px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--vp-c-border);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-logo-img:hover {
  transform: scale(1.04);
}

/* Badge Group */
.hero-badge-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 24px;
}

.badge-pill {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-3);
}

.badge-pill.active-tag {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Typography */
.hero-headline {
  font-size: 42px;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--vp-c-text-1);
  margin-bottom: 20px;
  max-width: 880px;
}

@media (min-width: 768px) {
  .hero-headline {
    font-size: 56px;
  }
}

.accent-text {
  color: var(--vp-c-brand-1);
}

.hero-lead {
  font-size: 17px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
  max-width: 720px;
  margin-bottom: 36px;
}

/* Terminal Card */
.terminal-card {
  width: 100%;
  max-width: 640px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 36px;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
}

.pm-tabs {
  display: flex;
  gap: 4px;
}

.pm-tab {
  padding: 4px 10px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--vp-transition);
}

.pm-tab:hover {
  color: var(--vp-c-text-1);
}

.pm-tab.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.copy-action-btn {
  padding: 4px 10px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 600;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--vp-transition);
}

.copy-action-btn:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
}

.copy-label,
.copied-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.copied-label {
  color: var(--vp-c-accent-green);
}

.terminal-body {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  overflow-x: auto;
  background: #18181b;
}

.term-prompt {
  color: var(--vp-c-accent-rose);
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 13px;
  user-select: none;
}

html:not(.dark) .term-prompt {
  color: #be123c;
}

.term-code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: #e2e8f0;
  white-space: nowrap;
}

/* CTA Group */
.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 44px;
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none !important;
  transition: var(--vp-transition);
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #ffffff;
}

.dark .btn-primary {
  color: #111113;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.btn-outline:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

/* Specs Strip */
.specs-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 16px;
  max-width: 860px;
  width: 100%;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spec-val {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.spec-label {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.spec-sep {
  color: var(--vp-c-text-3);
  font-size: 14px;
  font-weight: 300;
  display: none;
}

@media (min-width: 640px) {
  .spec-sep {
    display: inline;
  }
}
</style>
