<script setup lang="ts">
import DemoEmbed from './DemoEmbed.vue';

const sampleCode = `import { createBrowserGame, FlxG, FlxSprite, FlxState } from 'flixel-pixi';

class PlayState extends FlxState {
  private player!: FlxSprite;

  override create(): void {
    // 1. Create player sprite with color fill
    this.player = new FlxSprite(304, 224);
    this.player.makeGraphic(32, 32, 0x00e5ff);
    this.player.drag.set(600, 600);
    this.add(this.player);

    // 2. Center camera follow
    FlxG.camera.follow(this.player, 'LOCKON', 0.1);
  }

  override update(elapsed: number): void {
    super.update(elapsed);

    // 3. Simple arrow key motion
    this.player.acceleration.x = 0;
    if (FlxG.keys.pressed.LEFT || FlxG.keys.pressed.A) {
      this.player.acceleration.x = -800;
    } else if (FlxG.keys.pressed.RIGHT || FlxG.keys.pressed.D) {
      this.player.acceleration.x = 800;
    }
  }
}

// 4. Mount onto DOM
const host = document.querySelector<HTMLElement>('#game');
if (host) {
  const app = await createBrowserGame({
    host,
    initialState: PlayState,
    width: 640,
    height: 480,
  });
}`;
</script>

<template>
  <div class="landing-content">
    <!-- Interactive Spotlight Demo -->
    <section class="home-section">
      <div class="section-badge">INTERACTIVE SPOTLIGHT</div>
      <h2 class="section-title">Playable In-Engine Demo</h2>
      <p class="section-subtitle">
        Experience deterministic Flixel physics, group recycling, sound
        synthesis, and particle emitters running directly in your browser
        powered by PixiJS v8.
      </p>

      <DemoEmbed
        src="/games/flx-invaders/index.html"
        title="Flx-Invaders — AS3 Clean-Room Port"
        height="540px"
        controlsHint="Arrow keys / A, D to steer ship. Spacebar to fire cannon. Click into canvas to focus."
      />
    </section>

    <!-- Architecture Pillars -->
    <section class="home-section">
      <div class="section-badge">ENGINE ARCHITECTURE</div>
      <h2 class="section-title">Engineered from First Principles</h2>
      <p class="section-subtitle">
        Flixel-Pixi decouples game state simulation from presentation,
        delivering rock-solid determinism and GPU-accelerated web rendering.
      </p>

      <div class="pillars-grid">
        <div class="pillar-card">
          <div class="pillar-tag">SIMULATION</div>
          <h3 class="pillar-heading">Deterministic Fixed Timestep</h3>
          <p class="pillar-text">
            Logic advances via a locked <code>FixedStepAccumulator</code>.
            Timers, movement velocities, jump arcs, and replay recordings remain
            100% identical across 60Hz, 120Hz, or 240Hz displays.
          </p>
          <div class="pillar-code-snippet">
            <code>FlxG.fixedTimestep = 1 / 60;</code>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-tag">RENDERING</div>
          <h3 class="pillar-heading">Batched PixiJS v8 Pipeline</h3>
          <p class="pillar-text">
            Flixel sprites and tilemaps map directly to PixiJS v8 render
            handles. Draw calls are automatically batched into GPU buffers with
            WebGPU and WebGL2 auto-detection.
          </p>
          <div class="pillar-code-snippet">
            <code>sprite.makeGraphic(32, 32, 0x00e5ff);</code>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-tag">PHYSICS</div>
          <h3 class="pillar-heading">QuadTree Spatial Collision</h3>
          <p class="pillar-text">
            Built-in <code>FlxQuadTree</code> spatial partitioning delivers
            zero-allocation broadphase checks and precise AABB separation for
            platforms, projectiles, and hazards.
          </p>
          <div class="pillar-code-snippet">
            <code>FlxG.collide(player, levelTilemap);</code>
          </div>
        </div>

        <div class="pillar-card">
          <div class="pillar-tag">RELIABILITY</div>
          <h3 class="pillar-heading">Zero Memory Leak Guarantee</h3>
          <p class="pillar-text">
            Strict lifecycle contracts are tested under 30-minute soak
            benchmarks and 2,000+ cycle boot/destroy tests to ensure zero
            dangling event listeners or detached DOM nodes.
          </p>
          <div class="pillar-code-snippet">
            <code>application.destroy();</code>
          </div>
        </div>
      </div>
    </section>

    <!-- Code Walkthrough -->
    <section class="home-section">
      <div class="section-badge">CODE WALKTHROUGH</div>
      <h2 class="section-title">Clean, Ergonomic TypeScript API</h2>
      <p class="section-subtitle">
        Write games with clean object-oriented states, type-safe asset loaders,
        and straightforward update loops.
      </p>

      <div class="code-showcase-box">
        <div class="code-box-header">
          <span class="file-name">src/main.ts</span>
          <span class="lang-tag">TypeScript</span>
        </div>
        <div class="code-box-body">
          <pre><code>{{ sampleCode }}</code></pre>
        </div>
      </div>
    </section>

    <!-- Specifications Table -->
    <section class="home-section">
      <div class="section-badge">VERIFICATION LEDGER</div>
      <h2 class="section-title">Tested Specifications</h2>
      <p class="section-subtitle">
        Flixel-Pixi is tested against rigorous unit test suites, bundle
        constraints, and performance budgets.
      </p>

      <div class="specs-table-wrapper">
        <table class="specs-table">
          <thead>
            <tr>
              <th>Capability Area</th>
              <th>Engine Feature</th>
              <th>Verification Standard</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Fixed Timestep</strong></td>
              <td><code>FixedStepAccumulator</code></td>
              <td>
                Deterministic logic across 60Hz, 120Hz, and 240Hz refresh rates
              </td>
            </tr>
            <tr>
              <td><strong>Renderer</strong></td>
              <td>PixiJS v8 Multi-Backend</td>
              <td>WebGPU with automatic WebGL2/WebGL1 fallback</td>
            </tr>
            <tr>
              <td><strong>Collision</strong></td>
              <td><code>FlxQuadTree</code> + Separate</td>
              <td>
                Broadphase spatial partitioning &amp; zero per-frame heap
                allocations
              </td>
            </tr>
            <tr>
              <td><strong>Audio System</strong></td>
              <td><code>WebAudioBackend</code></td>
              <td>2D spatial panning, sound groups, and user-gesture unlock</td>
            </tr>
            <tr>
              <td><strong>Input Suite</strong></td>
              <td>Keyboard, Mouse, Touch, Gamepad</td>
              <td>Multi-touch swipe gestures &amp; virtual gamepads</td>
            </tr>
            <tr>
              <td><strong>Memory Stability</strong></td>
              <td>Lifecycle Teardown Contract</td>
              <td>2,000+ boot/destroy cycles verified with 0 memory leaks</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Call to Action Banner -->
    <section class="home-section cta-banner-section">
      <div class="cta-banner">
        <h2>Ready to Build with Flixel-Pixi?</h2>
        <p>
          Dive into developer guides, inspect runnable samples, or browse the
          complete API documentation.
        </p>
        <div class="cta-banner-actions">
          <a href="/guide/getting-started" class="btn-banner primary">
            Read the Getting Started Guide &rarr;
          </a>
          <a href="/examples/" class="btn-banner secondary">
            Browse 20+ Runnable Examples &nearr;
          </a>
          <a href="/api/" class="btn-banner ghost"> API Reference </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px 80px;
}

.home-section {
  margin: 64px 0;
}

.section-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-accent-pink);
  margin-bottom: 8px;
}

.section-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin: 0 0 10px 0;
  border-bottom: none;
  padding-bottom: 0;
}

@media (min-width: 768px) {
  .section-title {
    font-size: 34px;
  }
}

.section-subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin-bottom: 28px;
  max-width: 720px;
}

/* Pillars Grid */
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.pillar-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: var(--vp-transition);
}

.pillar-card:hover {
  transform: translateY(-3px);
  border-color: var(--vp-c-brand-1);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 0 16px var(--vp-c-brand-soft);
}

.pillar-tag {
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-brand-1);
  margin-bottom: 8px;
}

.pillar-heading {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 10px 0;
  letter-spacing: -0.01em;
}

.pillar-text {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 16px 0;
  flex: 1;
}

.pillar-text code,
.pillar-code-snippet code {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: var(--vp-code-inline-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

.pillar-code-snippet {
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 8px 12px;
}

/* Code Showcase Box */
.code-showcase-box {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.code-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.code-box-body pre {
  padding: 20px;
  margin: 0;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  background: var(--vp-code-block-bg);
}

/* Specs Table */
.specs-table-wrapper {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.specs-table th {
  background: var(--vp-c-bg-mute);
  font-weight: 700;
  font-size: 13px;
  text-align: left;
  padding: 12px 16px;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-border);
}

.specs-table td {
  padding: 12px 16px;
  font-size: 13.5px;
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

.specs-table tr:last-child td {
  border-bottom: none;
}

.specs-table code {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-brand-1);
  background: var(--vp-code-inline-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

/* CTA Banner */
.cta-banner-section {
  margin-top: 80px;
}

.cta-banner {
  background: linear-gradient(
    135deg,
    var(--vp-c-bg-mute) 0%,
    var(--vp-c-bg-soft) 100%
  );
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
}

.cta-banner h2 {
  font-size: 28px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 0 12px 0;
  border: none;
  padding: 0;
}

.cta-banner p {
  font-size: 16px;
  color: var(--vp-c-text-2);
  max-width: 560px;
  margin: 0 auto 28px auto;
}

.cta-banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.btn-banner {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none !important;
  transition: var(--vp-transition);
}

.btn-banner.primary {
  background: var(--vp-c-brand-1);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 150, 199, 0.3);
}

html.dark .btn-banner.primary {
  background: #00e5ff;
  color: #07090e;
  box-shadow: 0 4px 16px rgba(0, 229, 255, 0.35);
}

.btn-banner.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

.btn-banner.secondary {
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-accent-pink);
  color: var(--vp-c-accent-pink);
}

.btn-banner.secondary:hover {
  background: var(--vp-c-accent-pink);
  color: #ffffff;
  transform: translateY(-2px);
}

.btn-banner.ghost {
  background: transparent;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.btn-banner.ghost:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}
</style>
