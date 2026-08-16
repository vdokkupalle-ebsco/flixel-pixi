<script setup lang="ts">
import { computed, ref } from 'vue';
import { withBase } from 'vitepress';

const props = withDefaults(
  defineProps<{
    src: string;
    title?: string;
    aspectRatio?: string;
    width?: string;
    height?: string;
    controlsHint?: string;
  }>(),
  {
    title: 'Flixel-Pixi Game Sandbox',
    aspectRatio: '4 / 3',
    width: '100%',
    height: '560px',
    controlsHint:
      'Click inside canvas to focus. Use Arrow keys / WASD to move, Space / X to jump or shoot.',
  },
);

const isRunning = ref(false);
const isFullscreen = ref(false);
const iframeRef = ref<HTMLIFrameElement | null>(null);
const resolvedSrc = computed(() => withBase(props.src));

function startDemo() {
  isRunning.value = true;
}

function restartDemo() {
  if (iframeRef.value) {
    const currentSrc = iframeRef.value.src;
    iframeRef.value.src = '';
    setTimeout(() => {
      if (iframeRef.value) iframeRef.value.src = currentSrc;
    }, 60);
  }
}

function toggleFullscreen() {
  if (!iframeRef.value) return;
  if (!document.fullscreenElement) {
    iframeRef.value.requestFullscreen?.().catch((err) => {
      console.warn('Fullscreen error:', err);
    });
    isFullscreen.value = true;
  } else {
    document.exitFullscreen?.();
    isFullscreen.value = false;
  }
}
</script>

<template>
  <div class="cabinet-card">
    <!-- Cabinet Top Bar -->
    <div class="cabinet-header">
      <div class="cabinet-meta">
        <span class="status-indicator" :class="{ live: isRunning }"></span>
        <span class="cabinet-title">{{ title }}</span>
      </div>

      <div class="cabinet-controls">
        <button
          v-if="isRunning"
          class="cabinet-btn"
          @click="restartDemo"
          title="Restart Game Instance"
        >
          <span class="btn-icon">&#8635;</span>
          <span>Restart</span>
        </button>
        <button
          v-if="isRunning"
          class="cabinet-btn"
          @click="toggleFullscreen"
          title="Toggle Fullscreen"
        >
          <span class="btn-icon">&#x26F6;</span>
          <span>Fullscreen</span>
        </button>
        <a
          :href="resolvedSrc"
          target="_blank"
          rel="noopener noreferrer"
          class="cabinet-btn tab-link"
          title="Open in standalone tab"
        >
          <span>Open Standalone</span>
          <span class="btn-icon">&#x2197;</span>
        </a>
      </div>
    </div>

    <!-- Screen Container -->
    <div class="cabinet-screen" :style="{ minHeight: height }">
      <!-- Play Prompt Overlay -->
      <div v-if="!isRunning" class="screen-prompt">
        <div class="prompt-box">
          <div class="arcade-glyph">&#127918;</div>
          <h3 class="prompt-title">{{ title }}</h3>
          <p class="prompt-instructions">{{ controlsHint }}</p>
          <button class="launch-btn" @click="startDemo">
            <span class="play-triangle">&#9658;</span>
            <span>Run Interactive Game</span>
          </button>
        </div>
      </div>

      <!-- Live Canvas Iframe -->
      <iframe
        v-else
        ref="iframeRef"
        :src="resolvedSrc"
        class="game-iframe"
        allow="autoplay; fullscreen; gamepad"
        loading="lazy"
      ></iframe>
    </div>

    <!-- Controls Bar -->
    <div v-if="controlsHint && isRunning" class="cabinet-footer">
      <span class="keyboard-icon">&#9000;</span>
      <span class="footer-hint-text">{{ controlsHint }}</span>
    </div>
  </div>
</template>

<style scoped>
.cabinet-card {
  margin: 28px 0;
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.15),
    0 0 1px rgba(0, 0, 0, 0.1);
}

.cabinet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
}

.cabinet-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  transition: all 0.3s ease;
}

.status-indicator.live {
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 10px var(--vp-c-brand-1);
}

.cabinet-title {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.cabinet-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cabinet-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 6px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  cursor: pointer;
  text-decoration: none !important;
  transition: var(--vp-transition);
}

.cabinet-btn:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.cabinet-screen {
  position: relative;
  width: 100%;
  background: #04060a;
  display: flex;
  justify-content: center;
  align-items: center;
}

.screen-prompt {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 480px;
  padding: 32px;
  text-align: center;
  background: radial-gradient(circle at center, #0f1524 0%, #04060a 100%);
}

.prompt-box {
  max-width: 480px;
}

.arcade-glyph {
  font-size: 44px;
  margin-bottom: 14px;
}

.prompt-title {
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 10px;
  letter-spacing: -0.02em;
}

.prompt-instructions {
  font-size: 14px;
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 24px;
}

.launch-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 700;
  color: #07090e;
  background: #00e5ff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 229, 255, 0.4);
  transition: var(--vp-transition);
}

.launch-btn:hover {
  background: #3beeff;
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 229, 255, 0.6);
}

.game-iframe {
  width: 100%;
  height: 560px;
  border: none;
  display: block;
}

.cabinet-footer {
  padding: 10px 16px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-mute);
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  gap: 8px;
}

.keyboard-icon {
  font-size: 16px;
  color: var(--vp-c-text-2);
}
</style>
