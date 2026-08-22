<script setup lang="ts">
import { withBase } from 'vitepress';
import DemoEmbed from './DemoEmbed.vue';

const paths = [
  {
    title: "I'm new here",
    text: 'Set up the engine, put something on screen, and get a tiny game running before the coffee goes cold.',
    link: '/guide/getting-started',
    action: 'Make a first scene',
  },
  {
    title: 'I learn by pulling things apart',
    text: 'Open a working example, play it, change it, and see how the engine pieces fit together.',
    link: '/examples/',
    action: 'Explore working games',
  },
  {
    title: 'I know what I need',
    text: 'Jump straight to a class, method, or type without digging through a long tutorial first.',
    link: '/api/',
    action: 'Search the API',
  },
];
</script>

<template>
  <div class="landing-content">
    <section class="path-section" aria-labelledby="paths-title">
      <div class="section-heading split-heading">
        <h2 id="paths-title">There is more than one way into a game.</h2>
        <p>
          Take the guided route, learn from a working project, or look up the
          one thing blocking you right now.
        </p>
      </div>
      <div class="path-grid">
        <a
          v-for="path in paths"
          :key="path.title"
          :href="withBase(path.link)"
          class="path-card"
        >
          <h3>{{ path.title }}</h3>
          <p>{{ path.text }}</p>
          <span class="path-action">
            {{ path.action }} <span aria-hidden="true">↗</span>
          </span>
        </a>
      </div>
    </section>

    <section class="home-section" aria-labelledby="features-title">
      <div class="section-heading split-heading">
        <h2 id="features-title">The everyday tools of making a game.</h2>
        <p>
          The useful parts are already connected, so a quick prototype can grow
          into a real project without a rewrite halfway through.
        </p>
      </div>
      <div class="capability-grid">
        <article class="capability-card">
          <div class="world-graphic" aria-hidden="true">
            <i v-for="n in 28" :key="n"></i>
            <span class="world-player"></span>
          </div>
          <div class="capability-copy">
            <h3>A world that stays manageable</h3>
            <p>
              Keep menus, levels, entities, groups, cameras, and collisions in a
              lifecycle that is easy to reason about.
            </p>
          </div>
        </article>
        <article class="capability-card">
          <div class="physics-graphic" aria-hidden="true">
            <span class="physics-path"></span>
            <i class="physics-body body-one"></i>
            <i class="physics-body body-two"></i>
            <b class="physics-floor"></b>
          </div>
          <h3>Physics that serves the game feel</h3>
          <p>
            Add gravity and velocity, separate solid objects, tune elasticity,
            detect overlaps, and keep busy worlds quick with spatial collision.
          </p>
        </article>
        <article class="capability-card">
          <div class="orbit-graphic" aria-hidden="true">
            <i></i><i></i><span></span>
          </div>
          <h3>Movement worth tuning</h3>
          <p>
            Animate sprites, shape motion with tweens, shake the camera, and
            keep adjusting until the jump feels right.
          </p>
        </article>
        <article class="capability-card">
          <div class="particle-graphic" aria-hidden="true">
            <i v-for="particle in 18" :key="particle"></i>
            <span></span>
          </div>
          <h3>Particles and effects with personality</h3>
          <p>
            Burst sparks, dust, smoke, trails, and debris from pooled emitters,
            then layer in filters, fades, flashes, and camera shake.
          </p>
        </article>
        <article class="capability-card">
          <div class="input-graphic" aria-hidden="true">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
            <span>Action → MOVE</span>
          </div>
          <h3>Controls players can make their own</h3>
          <p>
            Map keyboard, pointer, touch, and gamepad controls to the same game
            actions, with rebinding when you need it.
          </p>
        </article>
        <article class="capability-card">
          <div class="sound-graphic" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            <span class="sound-source"></span>
          </div>
          <h3>Sound and ambience with a sense of place</h3>
          <p>
            Mix music and effects in their own groups, loop ambient beds, and
            attach sounds to waterfalls, engines, or anything moving through the
            world.
          </p>
        </article>
        <article class="capability-card capability-wide">
          <div class="responsive-graphic" aria-hidden="true">
            <span class="responsive-desktop"><i></i></span>
            <span class="responsive-tablet"><i></i></span>
            <span class="responsive-phone"><i></i></span>
          </div>
          <div class="capability-copy">
            <h3>A game that fits the screen it is on</h3>
            <p>
              Scale, align, and letterbox the game across phones, tablets, and
              desktops, with safe-area-aware layouts and fullscreen support.
            </p>
          </div>
        </article>
        <article class="capability-card capability-wide">
          <div class="service-row" aria-hidden="true">
            <span>assets</span><i></i><span>storage</span><i></i>
            <span>debugger</span><i></i><span>replay</span><i></i>
            <span>deploy</span>
          </div>
          <div class="capability-copy">
            <h3>The unglamorous parts are here too</h3>
            <p>
              Preload assets, save progress, record deterministic replays,
              inspect the game in the debugger, and get the build onto the web.
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="home-section demo-section" aria-labelledby="demo-title">
      <div class="demo-heading">
        <div><h2 id="demo-title">Don't just read about it. Play it.</h2></div>
        <p>
          This little invaders game is built with the same public API in the
          guide. Click the canvas, move around, fire a few shots, then open the
          example and pull it apart.
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
        <h2>Put something on screen.</h2>
        <p>
          One state. One sprite. One idea you want to feel in your hands. We can
          build outward from there.
        </p>
      </div>
      <div class="closing-actions">
        <a :href="withBase('/guide/getting-started')" class="closing-primary">
          Make your first scene <span aria-hidden="true">→</span>
        </a>
        <a :href="withBase('/api/')">Explore the API</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 28px 104px;
}
.path-section,
.home-section {
  padding: 96px 0;
  border-top: 1px solid var(--vp-c-divider);
}
.path-section {
  border-top: 0;
}
.path-section + .home-section {
  border-top: 0;
}
.section-heading {
  margin-bottom: 48px;
}
.split-heading {
  display: grid;
  grid-template-columns: 1.1fr 0.7fr;
  gap: clamp(40px, 8vw, 120px);
  align-items: end;
}
h2 {
  max-width: 760px;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(38px, 5vw, 64px);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.055em;
  text-wrap: balance;
}
.section-heading p,
.demo-heading p,
.closing-section p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.75;
}
.path-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--vp-c-border);
  border-bottom: 1px solid var(--vp-c-border);
}
.path-card {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: 30px;
  color: inherit;
  border-right: 1px solid var(--vp-c-border);
  text-decoration: none;
  transition:
    background-color 180ms ease,
    transform 180ms ease;
}
.path-card:last-child {
  border-right: 0;
}
.path-card:hover {
  background: var(--vp-c-bg-soft);
  transform: translateY(-3px);
}
.path-card h3 {
  margin: auto 0 12px;
  color: var(--vp-c-text-1);
  font-size: 23px;
  letter-spacing: -0.025em;
}
.path-card p {
  margin: 0 0 24px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
}
.path-action {
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 750;
}
.capability-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.capability-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 410px;
  overflow: hidden;
  padding: 28px;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--vp-shadow-sm);
}
.capability-card h3 {
  margin: auto 0 11px;
  color: var(--vp-c-text-1);
  font-size: 23px;
  letter-spacing: -0.025em;
}
.capability-card p {
  max-width: 540px;
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.7;
}
.capability-copy {
  position: relative;
  z-index: 2;
  margin-top: auto;
}
.capability-copy h3 {
  margin-top: 0;
}
.capability-wide {
  grid-column: 1/-1;
  min-height: 310px;
}
.world-graphic {
  position: absolute;
  top: 58px;
  right: -22px;
  display: grid;
  grid-template-columns: repeat(7, 44px);
  gap: 3px;
  transform: rotate(-7deg) skewX(8deg);
}
.world-graphic > i {
  height: 44px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-mute);
}
.world-graphic > i:nth-child(3n) {
  background: var(--vp-c-brand-soft);
}
.world-player {
  position: absolute;
  left: 142px;
  top: 76px;
  width: 24px;
  height: 32px;
  background: var(--vp-c-accent-coral);
  box-shadow: 0 8px 0 var(--vp-c-accent-rose);
}
.orbit-graphic {
  position: relative;
  width: 190px;
  height: 190px;
  margin: 26px auto;
  border: 1px solid var(--vp-c-border);
  border-radius: 50%;
}
.orbit-graphic::before,
.orbit-graphic::after {
  position: absolute;
  inset: 29px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  content: '';
}
.orbit-graphic::after {
  inset: 62px;
}
.orbit-graphic i {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: var(--vp-c-brand-1);
}
.orbit-graphic i:first-child {
  top: 20px;
  left: 34px;
}
.orbit-graphic i:nth-child(2) {
  right: 20px;
  bottom: 46px;
  background: var(--vp-c-accent-coral);
}
.orbit-graphic span {
  position: absolute;
  inset: 78px;
  border-radius: 5px;
  background: var(--vp-c-text-1);
}
.physics-graphic {
  position: relative;
  width: 230px;
  height: 170px;
  margin: 34px auto 22px;
}
.physics-floor {
  position: absolute;
  right: 4px;
  bottom: 12px;
  left: 4px;
  height: 8px;
  border-radius: 2px;
  background: var(--vp-c-text-1);
}
.physics-body {
  position: absolute;
  z-index: 2;
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 7px;
  background: var(--vp-c-logo-pink);
  box-shadow: 0 8px 18px var(--vp-c-accent-rose-soft);
}
.body-one {
  left: 34px;
  bottom: 20px;
  transform: rotate(-8deg);
}
.body-two {
  top: 28px;
  right: 36px;
  width: 34px;
  height: 34px;
  background: var(--vp-c-logo-cyan);
  transform: rotate(12deg);
}
.physics-path {
  position: absolute;
  top: 45px;
  right: 54px;
  width: 118px;
  height: 80px;
  border-top: 1px dashed var(--vp-c-text-3);
  border-radius: 50%;
  transform: rotate(-22deg);
}
.particle-graphic {
  position: relative;
  width: 220px;
  height: 180px;
  margin: 24px auto 12px;
}
.particle-graphic i {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--vp-c-logo-cyan);
  box-shadow: 0 0 14px var(--vp-c-brand-soft-strong);
}
.particle-graphic i:nth-child(2n) {
  background: var(--vp-c-logo-pink);
}
.particle-graphic i:nth-child(3n) {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.particle-graphic i:nth-child(1) {
  transform: translate(-74px, -45px);
}
.particle-graphic i:nth-child(2) {
  transform: translate(-42px, -72px);
}
.particle-graphic i:nth-child(3) {
  transform: translate(6px, -78px);
}
.particle-graphic i:nth-child(4) {
  transform: translate(54px, -57px);
}
.particle-graphic i:nth-child(5) {
  transform: translate(79px, -21px);
}
.particle-graphic i:nth-child(6) {
  transform: translate(68px, 27px);
}
.particle-graphic i:nth-child(7) {
  transform: translate(31px, 55px);
}
.particle-graphic i:nth-child(8) {
  transform: translate(-18px, 63px);
}
.particle-graphic i:nth-child(9) {
  transform: translate(-63px, 41px);
}
.particle-graphic i:nth-child(10) {
  transform: translate(-85px, 7px);
}
.particle-graphic i:nth-child(11) {
  transform: translate(-28px, -30px);
}
.particle-graphic i:nth-child(12) {
  transform: translate(25px, -39px);
}
.particle-graphic i:nth-child(13) {
  transform: translate(46px, 4px);
}
.particle-graphic i:nth-child(14) {
  transform: translate(12px, 30px);
}
.particle-graphic i:nth-child(15) {
  transform: translate(-39px, 20px);
}
.particle-graphic i:nth-child(16) {
  transform: translate(-9px, -4px);
}
.particle-graphic i:nth-child(17) {
  transform: translate(20px, 2px);
}
.particle-graphic i:nth-child(18) {
  transform: translate(-2px, 18px);
}
.particle-graphic span {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--vp-c-text-1);
  transform: translate(-7px, -7px) rotate(45deg);
}
.input-graphic {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  gap: 6px;
  width: max-content;
  margin: 40px auto;
}
.input-graphic kbd {
  display: grid;
  place-items: center;
  height: 44px;
  border: 1px solid var(--vp-c-border);
  border-bottom-width: 3px;
  border-radius: 7px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  font: 700 12px var(--vp-font-family-mono);
}
.input-graphic kbd:first-child {
  grid-column: 2;
}
.input-graphic kbd:nth-child(2) {
  grid-column: 1;
}
.input-graphic span {
  grid-column: 1/-1;
  margin-top: 12px;
  color: var(--vp-c-brand-1);
  font: 650 9px var(--vp-font-family-mono);
  text-align: center;
}
.sound-graphic {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 178px;
  margin: 18px auto 8px;
}
.sound-graphic i {
  width: 8px;
  height: 32px;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
}
.sound-graphic i:nth-child(2),
.sound-graphic i:nth-child(6) {
  height: 62px;
  background: var(--vp-c-logo-pink);
}
.sound-graphic i:nth-child(3),
.sound-graphic i:nth-child(5) {
  height: 96px;
}
.sound-graphic i:nth-child(4) {
  height: 132px;
  background: var(--vp-c-logo-pink);
}
.sound-source {
  position: absolute;
  width: 160px;
  height: 160px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  box-shadow:
    0 0 0 28px var(--vp-c-brand-soft),
    0 0 0 56px color-mix(in srgb, var(--vp-c-logo-pink) 5%, transparent);
}
.responsive-graphic {
  display: grid;
  grid-template-columns: minmax(150px, 2.2fr) minmax(70px, 0.9fr) minmax(
      44px,
      0.55fr
    );
  gap: clamp(8px, 2vw, 18px);
  align-items: end;
  width: min(100%, 520px);
  min-height: 176px;
  margin: 18px auto 8px;
}
.responsive-graphic span {
  position: relative;
  display: block;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  border-radius: 9px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-sm);
}
.responsive-graphic span::before {
  position: absolute;
  inset: 0 0 auto;
  height: 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-mute);
  content: '';
}
.responsive-graphic i {
  position: absolute;
  inset: 30px 16% 16px;
  border-radius: 5px;
  background:
    linear-gradient(
      135deg,
      var(--vp-c-brand-soft),
      var(--vp-c-accent-coral-soft)
    ),
    var(--vp-c-bg-soft);
  box-shadow: inset 0 0 0 1px var(--vp-c-divider);
}
.responsive-desktop {
  height: 150px;
}
.responsive-tablet {
  height: 132px;
}
.responsive-graphic .responsive-phone {
  height: 108px;
  border-radius: 12px;
}
.service-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 60px 0;
}
.service-row span {
  padding: 10px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
  font: 650 9px var(--vp-font-family-mono);
}
.service-row i {
  width: 28px;
  height: 1px;
  background: var(--vp-c-brand-1);
}
.demo-heading {
  display: grid;
  grid-template-columns: 1fr 0.65fr;
  gap: 72px;
  align-items: end;
  margin-bottom: 38px;
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
  margin-top: 20px;
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
  min-height: 48px;
  padding: 0 20px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease;
}
.closing-actions a:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
}
.closing-actions .closing-primary {
  color: #090d16;
  background: var(--vp-c-logo-pink);
  border-color: var(--vp-c-logo-pink);
}
@media (max-width: 800px) {
  .path-section,
  .home-section {
    padding: 72px 0;
  }
  .split-heading,
  .demo-heading,
  .closing-section {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .path-grid {
    grid-template-columns: 1fr;
  }
  .path-card {
    min-height: 230px;
    border-right: 0;
    border-bottom: 1px solid var(--vp-c-border);
  }
  .path-card:last-child {
    border-bottom: 0;
  }
  .capability-grid {
    grid-template-columns: 1fr;
  }
  .capability-wide {
    grid-column: auto;
  }
  .closing-actions {
    justify-content: flex-start;
  }
}
@media (max-width: 520px) {
  .landing-content {
    padding: 0 20px 72px;
  }
  .path-section,
  .home-section {
    padding: 60px 0;
  }
  .capability-card {
    min-height: 380px;
    padding: 24px;
  }
  .world-graphic {
    right: -100px;
  }
  .service-row {
    transform: scale(0.8);
  }
  .closing-actions {
    display: grid;
    width: 100%;
  }
}
</style>
