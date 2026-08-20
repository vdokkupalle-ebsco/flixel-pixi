<script setup lang="ts">
import { withBase } from 'vitepress';
import DemoEmbed from './DemoEmbed.vue';
</script>

<template>
  <div class="landing-content">
    <section class="home-section" aria-labelledby="features-title">
      <div class="section-heading">
        <h2 id="features-title">
          The parts you need to build a complete game.
        </h2>
        <p>
          The engine’s systems share the same lifecycle and work together, so
          you can focus on the game instead of assembling a framework for each
          project.
        </p>
      </div>

      <div class="features-grid">
        <article>
          <h3>States and game objects</h3>
          <p>
            Organize menus, levels, pause screens, and reusable objects with a
            predictable create, update, and destroy lifecycle.
          </p>
        </article>

        <article>
          <h3>Sprites and animation</h3>
          <p>
            Draw images, atlas frames, bitmap text, particles, and frame-based
            animation without managing the render tree yourself.
          </p>
        </article>

        <article>
          <h3>Worlds and collision</h3>
          <p>
            Build tile-based levels and use bounds, overlap checks, separation,
            and spatial partitioning for gameplay collision.
          </p>
        </article>

        <article>
          <h3>Keyboard, pointer, touch, and gamepad</h3>
          <p>
            Read device input directly or map several controls to the same named
            action for flexible control schemes.
          </p>
        </article>

        <article>
          <h3>Sound, saves, and replay</h3>
          <p>
            Work with Web Audio, volume groups, browser storage, and recorded
            input through engine services with clear ownership.
          </p>
        </article>

        <article>
          <h3>Cameras, effects, and interface</h3>
          <p>
            Follow objects, shake or fade the view, apply PixiJS filters, and
            build game interfaces that scale with the canvas.
          </p>
        </article>
      </div>
    </section>

    <section class="home-section demo-section" aria-labelledby="demo-title">
      <div class="demo-heading">
        <div>
          <h2 id="demo-title">Flx-Invaders example</h2>
        </div>
        <p>
          This small example combines a game state, player input, sprite groups,
          collision, sound, and object recycling. Run it here, or visit the
          examples section to inspect the project.
        </p>
      </div>

      <DemoEmbed
        src="/games/flx-invaders/index.html"
        title="Flx-Invaders — AS3 clean-room port"
        height="500px"
        controlsHint="Use the arrow keys or A and D to steer. Press Spacebar to fire. Click the game first to focus it."
      />
    </section>

    <section class="home-section closing-section">
      <div>
        <h2>Ready to make something?</h2>
        <p>
          Start with a small idea. Flixel-Pixi gives you the building blocks to
          turn it into a fast, playable 2D game for the web.
        </p>
      </div>
      <div class="closing-actions">
        <a :href="withBase('/guide/getting-started')" class="closing-primary">
          Build your first game <span aria-hidden="true">→</span>
        </a>
        <a :href="withBase('/api/')">Explore the API</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-content {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 28px 96px;
}

.home-section {
  padding: 96px 0;
  border-top: 1px solid var(--vp-c-divider);
}

.section-heading {
  max-width: 780px;
  margin-bottom: 54px;
}

h2 {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(36px, 4.5vw, 56px);
  font-weight: 820;
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.section-heading p,
.demo-heading p,
.closing-section p {
  margin: 22px 0 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.75;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.features-grid article {
  min-height: 270px;
  padding: 28px;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--vp-shadow-sm);
}

.features-grid h3 {
  margin: 0 0 12px;
  color: var(--vp-c-text-1);
  font-size: 19px;
  line-height: 1.28;
  letter-spacing: -0.018em;
}

.features-grid p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
}

.demo-heading {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 72px;
  align-items: end;
  margin-bottom: 36px;
}

.demo-heading p {
  max-width: 500px;
  margin-top: 0;
}

.closing-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 70px;
  align-items: end;
  padding-bottom: 0;
}

.closing-section p {
  max-width: 660px;
}

.closing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.closing-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 19px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.closing-actions .closing-primary {
  color: #071518;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

@media (max-width: 800px) {
  .home-section {
    padding: 72px 0;
  }

  .features-grid,
  .demo-heading,
  .closing-section {
    grid-template-columns: 1fr;
  }

  .features-grid article {
    min-height: 230px;
  }

  .demo-heading,
  .closing-section {
    gap: 28px;
  }

  .closing-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 520px) {
  .landing-content {
    padding: 0 20px 72px;
  }

  .home-section {
    padding: 60px 0;
  }

  .features-grid article {
    padding: 24px;
  }

  .closing-actions {
    display: grid;
    width: 100%;
  }
}
</style>
