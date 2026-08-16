<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vitepress';

const route = useRoute();

const versionInfo = computed(() => {
  const path = route.path;
  if (path.includes('/versions/next/')) {
    return {
      type: 'warning',
      badge: 'Development',
      message:
        'These docs describe the unreleased development branch (main) and may contain unreleased APIs.',
      showLatestLink: true,
    };
  }
  const match = path.match(/\/versions\/(v[0-9a-zA-Z.-]+)\//);
  if (match) {
    const version = match[1];
    return {
      type: 'info',
      badge: version,
      message: `You are viewing archived documentation for ${version}.`,
      showLatestLink: true,
    };
  }
  return null;
});
</script>

<template>
  <div v-if="versionInfo" :class="['version-banner', versionInfo.type]">
    <div class="banner-content">
      <span class="banner-badge">{{ versionInfo.badge }}</span>
      <span class="banner-text">{{ versionInfo.message }}</span>
      <a v-if="versionInfo.showLatestLink" href="/" class="banner-link">
        View latest documentation &rarr;
      </a>
    </div>
  </div>
</template>

<style scoped>
.version-banner {
  padding: 10px 18px;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: background-color 0.3s;
}

.version-banner.warning {
  background: rgba(234, 179, 8, 0.12);
  border-color: rgba(234, 179, 8, 0.3);
  color: #facc15;
}

.version-banner.info {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 1200px;
  width: 100%;
}

.banner-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: currentColor;
  color: #0b0f19 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.banner-text {
  flex: 1;
  font-weight: 500;
}

.banner-link {
  font-weight: 600;
  text-decoration: underline;
  color: inherit;
  white-space: nowrap;
}

.banner-link:hover {
  opacity: 0.85;
}
</style>
