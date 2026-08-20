<script setup lang="ts">
import { ref } from 'vue';
import { withBase } from 'vitepress';

const installCommand = 'npm install flixel-pixi@next pixi.js@^8.19.0';
const copied = ref(false);

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
    <div class="hero-copy">
      <img
        :src="withBase('/logo.jpg')"
        class="hero-logo"
        width="148"
        height="148"
        alt="Flixel-Pixi"
        fetchpriority="high"
      />
      <h1 id="home-title">Make 2D games for the web.</h1>
      <p class="hero-intro">
        Flixel-Pixi is a code-first TypeScript game engine built on PixiJS. It
        includes states, sprites, animation, collision, input, sound, cameras,
        tilemaps, and the browser runtime that connects them.
      </p>

      <div class="hero-actions">
        <a :href="withBase('/guide/getting-started')" class="primary-action">
          Start building <span aria-hidden="true">→</span>
        </a>
        <a :href="withBase('/examples/')" class="secondary-action">
          Explore examples
        </a>
      </div>

      <div class="install-command" aria-label="Install Flixel-Pixi">
        <span aria-hidden="true">$</span>
        <code>{{ installCommand }}</code>
        <button
          type="button"
          :aria-label="
            copied ? 'Install command copied' : 'Copy install command'
          "
          @click="copyInstall"
        >
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 670px;
  overflow: hidden;
  border-bottom: 1px solid var(--vp-c-divider);
  background:
    radial-gradient(circle at 50% 28%, var(--vp-c-brand-soft), transparent 34%),
    var(--vp-c-bg);
}

.home-hero::before {
  position: absolute;
  inset: 0;
  opacity: 0.26;
  background-image:
    linear-gradient(var(--vp-c-divider) 1px, transparent 1px),
    linear-gradient(90deg, var(--vp-c-divider) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at center, #000, transparent 72%);
  content: '';
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 980px;
  padding: 92px 28px 100px;
  text-align: center;
}

.hero-logo {
  display: block;
  width: 148px;
  height: 148px;
  margin: 0 auto 30px;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 18px 50px rgb(0 0 0 / 24%);
}

h1 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(68px, 8vw, 108px);
  font-weight: 850;
  line-height: 0.94;
  letter-spacing: -0.07em;
}

.hero-intro {
  max-width: 720px;
  margin: 30px auto 0;
  color: var(--vp-c-text-2);
  font-size: 18px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 34px;
}

.hero-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
  transition: var(--vp-transition);
}

.primary-action {
  color: #071518;
  background: var(--vp-c-brand-1);
  box-shadow: 0 10px 30px var(--vp-c-brand-shadow);
}

.primary-action:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.secondary-action {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}

.secondary-action:hover {
  border-color: var(--vp-c-brand-1);
}

.install-command {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  width: 100%;
  max-width: 620px;
  min-height: 54px;
  margin: 30px auto 0;
  padding: 8px 9px 8px 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 9px;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--vp-shadow-sm);
  text-align: left;
}

.install-command > span {
  color: var(--vp-c-accent-coral);
  font-family: var(--vp-font-family-mono);
  font-weight: 800;
}

.install-command code {
  overflow-x: auto;
  color: var(--vp-c-text-1);
  font: 500 12px/1.5 var(--vp-font-family-mono);
  white-space: nowrap;
  scrollbar-width: none;
}

.install-command code::-webkit-scrollbar {
  display: none;
}

.install-command button {
  min-width: 64px;
  min-height: 34px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font: 700 10px var(--vp-font-family-mono);
  cursor: pointer;
}

.install-command button:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .home-hero {
    min-height: 620px;
  }

  .hero-copy {
    padding: 74px 20px 82px;
  }

  h1 {
    font-size: clamp(58px, 17vw, 78px);
  }

  .hero-logo {
    width: 116px;
    height: 116px;
    margin-bottom: 24px;
    border-radius: 18px;
  }

  .hero-intro {
    font-size: 16px;
  }

  .hero-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .install-command code {
    overflow-wrap: anywhere;
    white-space: normal;
  }
}
</style>
