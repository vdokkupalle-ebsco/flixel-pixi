import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type DefaultTheme } from 'vitepress';

let apiSidebar: DefaultTheme.SidebarItem[] = [];
const apiSidebarPath = resolve(__dirname, 'api-sidebar.json');
if (existsSync(apiSidebarPath)) {
  try {
    apiSidebar = JSON.parse(readFileSync(apiSidebarPath, 'utf8'));
  } catch (e) {
    console.warn('Failed to parse api-sidebar.json', e);
  }
}

export default defineConfig({
  title: 'Flixel-Pixi',
  description:
    'A TypeScript port of the original AS3 Flixel engine using PixiJS v8.',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcExclude: ['**/history/**', '**/adr/**', '**/temp/**'],
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  sitemap: {
    hostname: 'https://flixel-pixi.dev',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: '',
      },
    ],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap',
      },
    ],
    ['meta', { name: 'theme-color', content: '#080a0f' }],
    ['meta', { property: 'og:type', content: 'website' }],
    [
      'meta',
      {
        property: 'og:title',
        content: 'Flixel-Pixi — TypeScript Game Engine on PixiJS v8',
      },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Browser-native TypeScript game engine combining Flixel deterministic game loop with PixiJS v8 rendering.',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://flixel-pixi.dev/logo.png',
      },
    ],
  ],
  themeConfig: {
    siteTitle: 'Flixel-Pixi',
    logo: { src: '/logo.png', width: 28, height: 28, alt: 'Flixel-Pixi Logo' },
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API Reference', link: '/api/' },
      {
        text: 'Resources',
        items: [
          { text: 'Changelog', link: '/resources/changelog' },
          { text: 'Roadmap', link: '/resources/roadmap' },
          {
            text: 'AS3 Compatibility Ledger',
            link: '/resources/compatibility',
          },
          {
            text: 'Browser & Device Matrix',
            link: '/resources/browser-support',
          },
          {
            text: 'Versioning & Release Policy',
            link: '/resources/versioning',
          },
          { text: 'Contributing Guide', link: '/resources/contributing' },
        ],
      },
      {
        text: 'npm v0.1.0-rc.5',
        link: 'https://www.npmjs.com/package/flixel-pixi',
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/vdokkupalle-ebsco/flixel-pixi',
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/guide/' },
            {
              text: 'Installation & Quick Start',
              link: '/guide/getting-started',
            },
            { text: 'Creating Your First Game', link: '/guide/first-game' },
          ],
        },
        {
          text: 'Core Architecture',
          collapsed: false,
          items: [
            { text: 'Game Loop & Fixed Step', link: '/guide/core-concepts' },
            { text: 'States & SubStates', link: '/guide/states' },
            { text: 'Context & Services', link: '/guide/context' },
          ],
        },
        {
          text: 'Game Objects & Display',
          collapsed: false,
          items: [
            { text: 'FlxObject & Sprites', link: '/guide/sprites' },
            { text: 'Groups & Containers', link: '/guide/groups' },
            { text: 'Vector Graphics & Gradients', link: '/guide/graphics' },
            { text: 'Particles & Emitters', link: '/guide/particles' },
            { text: 'Tilemaps & Level Design', link: '/guide/tilemaps' },
          ],
        },
        {
          text: 'Animation & Atlases',
          collapsed: false,
          items: [
            { text: 'Sprite Animations', link: '/guide/animation' },
            { text: 'Texture Atlases', link: '/guide/atlases' },
          ],
        },
        {
          text: 'Input Systems',
          collapsed: false,
          items: [
            { text: 'Keyboard & Mouse', link: '/guide/input' },
            { text: 'Touch & Swipe Gestures', link: '/guide/touch' },
            { text: 'Gamepads & Virtual Controls', link: '/guide/gamepads' },
            { text: 'Action Mapping System', link: '/guide/actions' },
          ],
        },
        {
          text: 'Physics & Collision',
          collapsed: false,
          items: [
            { text: 'QuadTree & Collision', link: '/guide/collision' },
            { text: 'Math & Deterministic RNG', link: '/guide/math' },
          ],
        },
        {
          text: 'Audio & Tweens',
          collapsed: false,
          items: [
            { text: 'Web Audio & Sound Groups', link: '/guide/audio' },
            { text: 'Tweens & Motion Paths', link: '/guide/tweens' },
          ],
        },
        {
          text: 'UI & Typography',
          collapsed: false,
          items: [
            { text: 'Buttons & 9-Slice UI', link: '/guide/ui' },
            { text: 'Bitmap & Canvas Text', link: '/guide/text' },
          ],
        },
        {
          text: 'Advanced Rendering',
          collapsed: false,
          items: [
            { text: 'PixiJS Filters & Shaders', link: '/guide/filters' },
            { text: 'Meshes & Strips', link: '/guide/meshes' },
            { text: 'Cameras & Viewport Effects', link: '/guide/camera' },
          ],
        },
        {
          text: 'Tools & Production',
          collapsed: false,
          items: [
            { text: 'Debugger, Console & Watch', link: '/guide/debugging' },
            { text: 'Asset Loading & Preloaders', link: '/guide/loading' },
            { text: 'Save Data & Replays', link: '/guide/storage' },
            { text: 'Browser DX & Viewport', link: '/guide/browser' },
            {
              text: 'Deployment & Cloudflare Pages',
              link: '/guide/deployment',
            },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples Gallery',
          items: [{ text: 'All Examples', link: '/examples/' }],
        },
        {
          text: 'Getting Started',
          items: [{ text: 'Hello World', link: '/examples/hello/' }],
        },
        {
          text: 'Gameplay & Physics',
          items: [
            { text: 'Retro Platformer', link: '/examples/platformer/' },
            {
              text: 'Flx-Invaders (AS3 Port)',
              link: '/examples/flx-invaders/',
            },
            { text: 'Kenney Platformer', link: '/examples/kenney-platformer/' },
            { text: 'Action RPG / Top-Down', link: '/examples/action/' },
          ],
        },
        {
          text: 'Rendering & FX',
          items: [
            {
              text: 'Sprite Animation & Atlases',
              link: '/examples/animation/',
            },
            { text: 'Tweens & Motion Easing', link: '/examples/tweens/' },
            { text: 'PixiJS Filters & Shaders', link: '/examples/filters/' },
            { text: 'Meshes & Strip Deformation', link: '/examples/meshes/' },
            {
              text: 'Sprite Groups & Containers',
              link: '/examples/containers/',
            },
            {
              text: 'Vector Graphics & Gradients',
              link: '/examples/graphics/',
            },
          ],
        },
        {
          text: 'UI, Controls & Audio',
          items: [
            { text: 'UI Controls & 9-Slice Buttons', link: '/examples/ui/' },
            { text: 'Touch Gestures & Swiping', link: '/examples/swipe/' },
            { text: 'SubStates & Pause Menus', link: '/examples/substates/' },
            {
              text: 'Responsive Viewport & Scaling',
              link: '/examples/viewport/',
            },
            {
              text: 'Web Audio & Spatial Sound',
              link: '/examples/ambient-audio/',
            },
          ],
        },
        {
          text: 'Benchmarks & Diagnostics',
          items: [
            {
              text: 'Sprite Stress Benchmark',
              link: '/examples/bench-sprites/',
            },
            {
              text: 'Teardown Soak & GC Verification',
              link: '/examples/bench-soak/',
            },
          ],
        },
      ],
      '/api/':
        apiSidebar.length > 0
          ? apiSidebar
          : [
              {
                text: 'API Reference',
                items: [{ text: 'Overview', link: '/api/' }],
              },
            ],
      '/resources/': [
        {
          text: 'Resources & Specifications',
          items: [
            { text: 'Changelog', link: '/resources/changelog' },
            { text: 'Roadmap', link: '/resources/roadmap' },
            {
              text: 'AS3 Compatibility Ledger',
              link: '/resources/compatibility',
            },
            {
              text: 'Browser & Device Matrix',
              link: '/resources/browser-support',
            },
            {
              text: 'Versioning & Release Policy',
              link: '/resources/versioning',
            },
            {
              text: 'HaxeFlixel Parity Priorities',
              link: '/resources/haxeflixel-priorities',
            },
            { text: 'Contributing Guide', link: '/resources/contributing' },
          ],
        },
      ],
      '/versions/next/': [
        {
          text: 'Next (Development)',
          items: [
            { text: 'Next Overview', link: '/versions/next/' },
            { text: 'Guide', link: '/versions/next/guide/' },
            { text: 'API Reference', link: '/versions/next/api/' },
          ],
        },
      ],
      '/versions/v0.1.0-rc.5/': [
        {
          text: 'v0.1.0-rc.5 Archive',
          items: [
            { text: 'Archive Overview', link: '/versions/v0.1.0-rc.5/' },
            { text: 'Guide', link: '/versions/v0.1.0-rc.5/guide/' },
            { text: 'API Reference', link: '/versions/v0.1.0-rc.5/api/' },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright:
        'Copyright © 2026 Flixel-Pixi contributors. Original Flixel by Adam Atomic.',
    },
  },
});
