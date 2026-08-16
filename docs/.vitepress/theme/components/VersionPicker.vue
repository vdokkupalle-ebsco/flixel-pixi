<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vitepress';
import versionsData from '../../versions.json';

const route = useRoute();
const router = useRouter();
const isOpen = ref(false);

const currentVersionLabel = computed(() => {
  const path = route.path;
  if (path.includes('/versions/next/')) {
    return 'Next (main)';
  }
  const match = path.match(/\/versions\/(v[0-9a-zA-Z.-]+)\//);
  if (match) {
    return match[1];
  }
  return `v${versionsData.latest.version}`;
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectVersion(targetPath: string) {
  isOpen.value = false;
  window.location.href = targetPath;
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.version-picker-container')) {
      isOpen.value = false;
    }
  });
});
</script>

<template>
  <div class="version-picker-container">
    <button
      class="version-picker-btn"
      @click="toggleDropdown"
      aria-label="Select Version"
    >
      <span class="version-indicator"></span>
      <span class="version-name">{{ currentVersionLabel }}</span>
      <span class="chevron" :class="{ open: isOpen }">&#9662;</span>
    </button>

    <div v-if="isOpen" class="version-dropdown">
      <div class="dropdown-section">
        <div class="dropdown-header">Recommended</div>
        <a
          href="/"
          class="dropdown-item"
          :class="{
            active: currentVersionLabel === `v${versionsData.latest.version}`,
          }"
        >
          <span class="item-title">v{{ versionsData.latest.version }}</span>
          <span class="item-badge latest">Latest</span>
        </a>
      </div>

      <div class="dropdown-section">
        <div class="dropdown-header">Development</div>
        <a
          href="/versions/next/"
          class="dropdown-item"
          :class="{ active: currentVersionLabel === 'Next (main)' }"
        >
          <span class="item-title">Next</span>
          <span class="item-badge next">main</span>
        </a>
      </div>

      <div
        v-if="versionsData.versions && versionsData.versions.length > 0"
        class="dropdown-section"
      >
        <div class="dropdown-header">Tagged Releases</div>
        <a
          v-for="ver in versionsData.versions"
          :key="ver.version"
          :href="ver.path"
          class="dropdown-item"
          :class="{
            active:
              currentVersionLabel === ver.tag ||
              currentVersionLabel === ver.version,
          }"
        >
          <span class="item-title">{{ ver.tag || ver.version }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.version-picker-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.version-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.version-picker-btn:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-mute);
}

.version-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

.chevron {
  font-size: 10px;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.version-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  padding: 6px 0;
  z-index: 100;
}

.dropdown-section {
  padding: 4px 0;
}

.dropdown-section:not(:last-child) {
  border-bottom: 1px solid var(--vp-c-divider);
}

.dropdown-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vp-c-text-3);
  padding: 4px 14px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.dropdown-item:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.dropdown-item.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.item-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-badge.latest {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
}

.item-badge.next {
  background: rgba(245, 158, 11, 0.10);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

html.dark .item-badge.next {
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}
</style>
