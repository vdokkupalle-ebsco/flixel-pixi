<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const repositoryUrl = 'https://github.com/vdokkupalle-ebsco/flixel-pixi';
const repositoryApiUrl =
  'https://api.github.com/repos/vdokkupalle-ebsco/flixel-pixi';
const starCount = ref<string | null>(null);

const accessibleLabel = computed(() =>
  starCount.value
    ? `Star Flixel-Pixi on GitHub. ${starCount.value} stars. Opens in a new tab.`
    : 'Star Flixel-Pixi on GitHub. Opens in a new tab.',
);

onMounted(async () => {
  try {
    const response = await fetch(repositoryApiUrl, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return;

    const repository = (await response.json()) as {
      stargazers_count?: unknown;
    };
    if (typeof repository.stargazers_count !== 'number') return;

    starCount.value = new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(repository.stargazers_count);
  } catch {
    // The repository link remains useful if the public GitHub API is unavailable.
  }
});
</script>

<template>
  <a
    :href="repositoryUrl"
    class="github-star-button"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="accessibleLabel"
  >
    <svg class="github-star-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 2.75 2.8 5.67 6.26.91-4.53 4.42 1.07 6.24L12 17.04l-5.6 2.95 1.07-6.24-4.53-4.42 6.26-.91L12 2.75Z"
      />
    </svg>
    <span class="github-star-label">Star</span>
    <span v-if="starCount" class="github-star-count" aria-hidden="true">
      {{ starCount }}
    </span>
  </a>
</template>

<style scoped>
.github-star-button {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 3px 9px;
  border: 1px solid var(--vp-c-border);
  border-radius: 7px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.github-star-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.github-star-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.github-star-icon {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.github-star-count {
  min-width: 1ch;
  padding-left: 7px;
  border-left: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

@media (max-width: 640px) {
  .github-star-button {
    gap: 4px;
    margin-left: 2px;
    padding-inline: 7px;
  }

  .github-star-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
