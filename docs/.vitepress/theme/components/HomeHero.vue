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
    <div class="hero-glow-bg"></div>

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
        <span class="badge-pill active-tag">
          <span class="pulse-dot"></span>
          v0.1.0-rc.5 Prerelease
        </span>
        <span class="badge-pill tech-tag">PixiJS v8 Engine</span>
        <span class="badge-pill ts-tag">TypeScript 5.9</span>
        <span class="badge-pill mit-tag">MIT Licensed</span>
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
        <a href="/examples/" class="btn-cta btn-secondary">
          <span class="game-icon">&#127918;</span>
          <span>Playable Examples</span>
        </a>
        <a href="/api/" class="btn-cta btn-ghost">
          <span>API Reference</span>
        </a>
        <a
          href="https://github.com/vdokkupalle-ebsco/flixel-pixi"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-cta btn-github"
        >
          <span>GitHub</span>
          <span class="ext-icon">&#x2197;</span>
        </a>
      </div>

      <!-- Key Specs Bar -->
      <div class="specs-grid">
        <div class="spec-item">
          <span class="spec-val">Fixed-Step</span>
          <span class="spec-label">Deterministic 60/120Hz Loop</span>
        </div>
        <div class="spec-divider"></div>
        <div class="spec-item">
          <span class="spec-val">PixiJS v8</span>
          <span class="spec-label">WebGL &amp; WebGPU Batching</span>
        </div>
        <div class="spec-divider"></div>
        <div class="spec-item">
          <span class="spec-val">QuadTree</span>
          <span class="spec-label">Zero-Alloc Spatial Physics</span>
        </div>
        <div class="spec-divider"></div>
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
  padding: 48px 16px 36px;
  max-width: 1080px;
  margin: 0 auto;
  overflow: hidden;
}

.hero-glow-bg {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 280px;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 229, 255, 0.12) 0%,
    rgba(255, 42, 109, 0.08) 50%,
    transparent 80%
  );
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Logo Frame */
.hero-logo-frame {
  margin-bottom: 24px;
  position: relative;
}

.hero-logo-img {
  width: 120px;
  height: 120px;
  border-radius: 26px;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.4),
    0 0 24px rgba(0, 229, 255, 0.25),
    0 0 48px rgba(255, 42, 109, 0.15);
  border: 1px solid var(--vp-c-border);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-logo-img:hover {
  transform: scale(1.06) rotate(1deg);
}

/* Badge Group */
.hero-badge-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;
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
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.badge-pill.active-tag {
  background: rgba(0, 150, 199, 0.1);
  border-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 8px var(--vp-c-brand-1);
}

.badge-pill.tech-tag {
  color: var(--vp-c-accent-pink);
  border-color: var(--vp-c-accent-pink-soft);
  background: var(--vp-c-accent-pink-soft);
}

.badge-pill.ts-tag {
  color: #0284c7;
  border-color: rgba(2, 132, 199, 0.25);
}

.dark .badge-pill.ts-tag {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.25);
}

/* Typography */
.hero-headline {
  font-size: 38px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin-bottom: 18px;
  max-width: 880px;
}

@media (min-width: 768px) {
  .hero-headline {
    font-size: 52px;
  }
}

.accent-text {
  color: var(--vp-c-brand-1);
}

.hero-lead {
  font-size: 17px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 740px;
  margin-bottom: 32px;
}

/* Terminal Card */
.terminal-card {
  width: 100%;
  max-width: 640px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.2),
    0 0 1px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
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
  background: #090c14;
}

.term-prompt {
  color: #ff2a6d;
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 13px;
  user-select: none;
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
  margin-bottom: 40px;
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
  box-shadow: 0 4px 20px rgba(0, 150, 199, 0.35);
}

.dark .btn-primary {
  background: #00e5ff;
  color: #07090e;
  box-shadow: 0 4px 20px rgba(0, 229, 255, 0.35);
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-1);
}

.btn-secondary:hover {
  border-color: var(--vp-c-accent-pink);
  color: var(--vp-c-accent-pink);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.btn-ghost:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.btn-github {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.btn-github:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
}

/* Specs Grid */
.specs-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px 24px;
  padding: 16px 24px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
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

.spec-divider {
  width: 1px;
  height: 28px;
  background: var(--vp-c-divider);
  display: none;
}

@media (min-width: 640px) {
  .spec-divider {
    display: block;
  }
}
</style>
