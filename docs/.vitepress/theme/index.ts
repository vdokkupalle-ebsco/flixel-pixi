import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import VersionBanner from './components/VersionBanner.vue';
import GitHubStarButton from './components/GitHubStarButton.vue';
import DemoEmbed from './components/DemoEmbed.vue';
import ExampleGallery from './components/ExampleGallery.vue';
import HomeHero from './components/HomeHero.vue';
import LandingContent from './components/LandingContent.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(VersionBanner),
      'nav-bar-content-after': () => h(GitHubStarButton),
    });
  },
  enhanceApp({ app }) {
    app.component('VersionBanner', VersionBanner);
    app.component('GitHubStarButton', GitHubStarButton);
    app.component('DemoEmbed', DemoEmbed);
    app.component('ExampleGallery', ExampleGallery);
    app.component('HomeHero', HomeHero);
    app.component('LandingContent', LandingContent);
  },
} satisfies Theme;
