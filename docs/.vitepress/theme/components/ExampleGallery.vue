<script setup lang="ts">
import { computed, ref } from 'vue';
import { withBase } from 'vitepress';

interface ExampleItem {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'gameplay' | 'rendering' | 'ui' | 'benchmarks';
  tags: string[];
  demoUrl: string;
  sourceUrl: string;
  docUrl?: string;
  icon?: string;
}

const examples: ExampleItem[] = [
  {
    id: 'hello',
    title: 'Hello World',
    description:
      'Minimal game boot with FlxState, FlxSprite, makeGraphic, and createBrowserGame.',
    category: 'getting-started',
    tags: ['FlxState', 'FlxSprite', 'createBrowserGame'],
    demoUrl: '/games/hello/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/hello',
    docUrl: '/examples/hello/',
    icon: '👋',
  },
  {
    id: 'platformer',
    title: 'Retro Platformer',
    description:
      'Tilemap collision, player physics, gravity, jumping, coin pickups, and camera tracking.',
    category: 'gameplay',
    tags: ['FlxTilemap', 'Physics', 'Collision', 'FlxCamera'],
    demoUrl: '/games/platformer/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/platformer',
    docUrl: '/examples/platformer/',
    icon: '🏃',
  },
  {
    id: 'physics-playground',
    title: 'Rigid-body Physics',
    description:
      'Optional Planck adapter with static, kinematic, dynamic, and sensor bodies plus portable contacts and queries.',
    category: 'gameplay',
    tags: ['FlxPhysicsWorld', 'Planck', 'Sensors', 'Queries'],
    demoUrl: '/games/physics-playground/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/physics-playground',
    docUrl: '/examples/physics-playground/',
    icon: '⚙️',
  },
  {
    id: 'physics-joints',
    title: 'Portable Physics Joints',
    description:
      'Distance, revolute, prismatic, weld, and wheel constraints through the optional Planck adapter.',
    category: 'gameplay',
    tags: ['FlxPhysicsWorld', 'Joints', 'Planck', 'Motors'],
    demoUrl: '/games/physics-joints/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/physics-joints',
    docUrl: '/examples/physics-joints/',
    icon: '🔗',
  },
  {
    id: 'flx-invaders',
    title: 'Flx-Invaders (AS3 Port)',
    description:
      'Pinned clean-room compatibility port of AdamAtomic’s original Flx-Invaders game.',
    category: 'gameplay',
    tags: ['FlxGroup', 'FlxEmitter', 'Sound', 'AS3 Baseline'],
    demoUrl: '/games/flx-invaders/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/flx-invaders',
    docUrl: '/examples/flx-invaders/',
    icon: '👾',
  },
  {
    id: 'kenney-platformer',
    title: 'Kenney Platformer',
    description:
      'Rich platformer featuring Kenney graphics, spritesheet animations, and ladders.',
    category: 'gameplay',
    tags: ['Atlas', 'Spritesheet', 'Kenney Assets', 'Tilemap'],
    demoUrl: '/games/kenney-platformer/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/kenney-platformer',
    docUrl: '/examples/kenney-platformer/',
    icon: '🎮',
  },
  {
    id: 'action',
    title: 'Action RPG / Top-Down',
    description:
      '8-directional movement, melee attack bounding boxes, health bars, and enemy AI chase.',
    category: 'gameplay',
    tags: ['Top-Down', 'State Machine', 'Combat', 'FlxGroup'],
    demoUrl: '/games/action/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/action',
    docUrl: '/examples/action/',
    icon: '⚔️',
  },
  {
    id: 'animation',
    title: 'Sprite Animation & Atlases',
    description:
      'Texture atlas animations, frame-rate control, ping-pong playback, and event callbacks.',
    category: 'rendering',
    tags: ['FlxAnimation', 'TextureAtlas', 'FrameEvents'],
    demoUrl: '/games/animation/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/animation',
    docUrl: '/examples/animation/',
    icon: '🎞️',
  },
  {
    id: 'particle-effect',
    title: 'Composed Particle Effect',
    description:
      'Load an exported flame, ember, and smoke composition through FlxAssets and control it as one runtime effect.',
    category: 'rendering',
    tags: ['FlxParticleEffect', 'Particle Editor', 'FlxAssets', 'Effects'],
    demoUrl: '/games/particle-effect/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/particle-effect',
    docUrl: '/examples/particle-effect/',
    icon: '🔥',
  },
  {
    id: 'tweens',
    title: 'Tweens & Motion Easing',
    description:
      'FlxTween chains, cubic/elastic/bounce easing curves, color transitions, and path motion.',
    category: 'rendering',
    tags: ['FlxTween', 'FlxEase', 'Motion', 'Sequencing'],
    demoUrl: '/games/tweens/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/tweens',
    docUrl: '/examples/tweens/',
    icon: '✨',
  },
  {
    id: 'filters',
    title: 'PixiJS Filters & Shaders',
    description:
      'Direct integration with PixiJS v8 ColorMatrixFilter, BlurFilter, and custom GLSL/WGSL shaders.',
    category: 'rendering',
    tags: ['PixiJS Filters', 'WebGL Shaders', 'Post-Processing'],
    demoUrl: '/games/filters/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/filters',
    docUrl: '/examples/filters/',
    icon: '🔮',
  },
  {
    id: 'meshes',
    title: 'Deformable Meshes & Ropes',
    description:
      'Interactive SimpleMesh, MeshPlane grid deformation, and MeshRope ribbon paths.',
    category: 'rendering',
    tags: ['PixiJS Mesh', 'MeshPlane', 'MeshRope', 'Geometry'],
    demoUrl: '/games/meshes/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/meshes',
    docUrl: '/examples/meshes/',
    icon: '🌊',
  },
  {
    id: 'graphics',
    title: 'Vector Graphics & Stamping',
    description:
      'Procedural shape drawing, bitmap canvas stamping, and runtime palette tinting.',
    category: 'rendering',
    tags: ['FlxGraphics', 'Procedural', 'makeGraphic', 'Canvas'],
    demoUrl: '/games/graphics/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/graphics',
    docUrl: '/examples/graphics/',
    icon: '🎨',
  },
  {
    id: 'containers',
    title: 'PixiJS Container Bridge',
    description:
      'Mixing Flixel state hierarchy with native PixiJS Display Containers and custom display nodes.',
    category: 'rendering',
    tags: ['SceneGraph', 'PixiJS Bridge', 'Container'],
    demoUrl: '/games/containers/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/containers',
    docUrl: '/examples/containers/',
    icon: '📦',
  },
  {
    id: 'ui',
    title: 'UI Controls & 9-Slice Panels',
    description:
      'Interactive 9-slice buttons, modal dialogue boxes, bitmap font labels, and hover states.',
    category: 'ui',
    tags: ['FlxButton', 'FlxNineSliceSprite', 'FlxText', 'UI'],
    demoUrl: '/games/ui/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/ui',
    docUrl: '/examples/ui/',
    icon: '🔘',
  },
  {
    id: 'swipe',
    title: 'Touch & Swipe Gestures',
    description:
      'Touch input tracking, multi-touch pinch zoom, swipe gesture velocity, and virtual directional pads.',
    category: 'ui',
    tags: ['Touch', 'Gestures', 'Mobile', 'FlxSwipe'],
    demoUrl: '/games/swipe/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/swipe',
    docUrl: '/examples/swipe/',
    icon: '📱',
  },
  {
    id: 'substates',
    title: 'SubStates & Pause Modals',
    description:
      'Layered SubStates for pause menus, inventory screens, and settings without losing game state.',
    category: 'ui',
    tags: ['FlxSubState', 'Pause Modal', 'Menu System'],
    demoUrl: '/games/substates/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/substates',
    docUrl: '/examples/substates/',
    icon: '⏸️',
  },
  {
    id: 'viewport',
    title: 'Responsive Scaling & Viewport',
    description:
      'Adaptive letterboxing, integer pixel-perfect scaling, and responsive canvas resizing modes.',
    category: 'ui',
    tags: ['FlxViewport', 'Letterbox', 'Scaling', 'HiDPI'],
    demoUrl: '/games/viewport/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/viewport',
    docUrl: '/examples/viewport/',
    icon: '📐',
  },
  {
    id: 'ambient-audio',
    title: 'Web Audio & Sound Groups',
    description:
      'Positional 2D audio panning, sound effect groups, volume ducking, and browser audio unlock.',
    category: 'ui',
    tags: ['WebAudioBackend', 'FlxSoundGroup', 'Spatial Audio'],
    demoUrl: '/games/ambient-audio/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/ambient-audio',
    docUrl: '/examples/ambient-audio/',
    icon: '🔊',
  },
  {
    id: 'bench-sprites',
    title: 'Sprite Stress Benchmark',
    description:
      'Stress test rendering 10,000+ active moving sprites with batched PixiJS v8 WebGL/WebGPU pipeline.',
    category: 'benchmarks',
    tags: ['Benchmark', '10,000 Sprites', 'Batching', 'Performance'],
    demoUrl: '/games/bench-sprites/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/bench-sprites',
    docUrl: '/examples/bench-sprites/',
    icon: '⚡',
  },
  {
    id: 'bench-soak',
    title: 'Lifecycle Soak & GC Stability',
    description:
      'Automated 2,000+ cycle state transition and teardown test verifying zero memory leaks.',
    category: 'benchmarks',
    tags: ['Zero Leaks', 'GC Verification', 'Soak Test', 'Stability'],
    demoUrl: '/games/bench-soak/index.html',
    sourceUrl:
      'https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/bench-soak',
    docUrl: '/examples/bench-soak/',
    icon: '🛡️',
  },
];

const selectedCategory = ref<string>('all');
const searchQuery = ref<string>('');

const categories = [
  { id: 'all', name: 'All Demos' },
  { id: 'getting-started', name: 'Getting Started' },
  { id: 'gameplay', name: 'Gameplay & Physics' },
  { id: 'rendering', name: 'Rendering & Shaders' },
  { id: 'ui', name: 'UI & Input' },
  { id: 'benchmarks', name: 'Performance & Soak' },
];

const filteredExamples = computed(() => {
  return examples.filter((item) => {
    const matchesCategory =
      selectedCategory.value === 'all' ||
      item.category === selectedCategory.value;
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((t) => t.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });
});
</script>

<template>
  <div class="gallery-wrapper">
    <!-- Filter Toolbar -->
    <div class="gallery-toolbar">
      <div class="category-pill-group">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="cat-pill"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="search-field-box">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter examples (e.g. tilemap, audio, tween)..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          class="search-clear-btn"
          @click="searchQuery = ''"
        >
          &times;
        </button>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div class="cards-grid">
      <div
        v-for="item in filteredExamples"
        :key="item.id"
        class="interactive-card"
      >
        <div class="card-head">
          <div class="card-glyph">{{ item.icon || '🎮' }}</div>
          <div class="card-meta">
            <span class="card-cat-badge">{{ item.category }}</span>
            <h3 class="card-name">{{ item.title }}</h3>
          </div>
        </div>

        <p class="card-summary">{{ item.description }}</p>

        <div class="card-pill-row">
          <span v-for="tag in item.tags" :key="tag" class="tech-chip">{{
            tag
          }}</span>
        </div>

        <div class="card-btn-row">
          <a
            v-if="item.docUrl"
            :href="withBase(item.docUrl)"
            class="card-action-btn btn-walkthrough"
          >
            <span>Walkthrough</span>
            <span class="btn-arrow">&rarr;</span>
          </a>
          <a
            :href="withBase(item.demoUrl)"
            target="_blank"
            rel="noopener noreferrer"
            class="card-action-btn btn-play"
            title="Launch in standalone tab"
          >
            <span>Play</span>
            <span class="btn-arrow">&#x2197;</span>
          </a>
          <a
            :href="item.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="card-action-btn btn-code"
            title="View code on GitHub"
          >
            <span>Code</span>
          </a>
        </div>
      </div>
    </div>

    <div v-if="filteredExamples.length === 0" class="empty-state">
      <p>No examples match your filter query.</p>
    </div>
  </div>
</template>

<style scoped>
.gallery-wrapper {
  margin: 32px 0 48px;
}

.gallery-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

@media (min-width: 768px) {
  .gallery-toolbar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.category-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-pill {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: var(--vp-transition);
}

.cat-pill:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.cat-pill.active {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.search-field-box {
  position: relative;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--vp-c-text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  font-size: 13px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  outline: none;
  transition: var(--vp-transition);
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--vp-c-text-3);
  font-size: 16px;
  cursor: pointer;
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.interactive-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-left: 3px solid transparent;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: var(--vp-transition);
}

.interactive-card:hover {
  border-left-color: var(--vp-c-brand-1);
}

.card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.card-glyph {
  font-size: 28px;
  line-height: 1;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-cat-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-brand-1);
}

.card-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
}

.card-summary {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
  flex: 1;
}

.card-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.tech-chip {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.card-btn-row {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.card-action-btn {
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: var(--vp-transition);
}

.btn-walkthrough {
  flex: 1.4;
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.btn-walkthrough:hover {
  background: var(--vp-c-brand-1);
  color: #ffffff;
}

.dark .btn-walkthrough:hover {
  color: #07090e;
}

.btn-play {
  flex: 1;
  background: var(--vp-c-accent-pink-soft);
  border: 1px solid var(--vp-c-accent-pink);
  color: var(--vp-c-accent-pink);
}

.btn-play:hover {
  background: var(--vp-c-accent-pink);
  color: #ffffff;
}

.btn-code {
  background: transparent;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-3);
}

.btn-code:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--vp-c-text-3);
}
</style>
