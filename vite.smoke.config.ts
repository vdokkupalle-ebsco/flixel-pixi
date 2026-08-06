import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'examples/smoke'),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, 'dist/smoke'),
    rollupOptions: {
      input: {
        phase1: resolve(import.meta.dirname, 'examples/smoke/phase1.html'),
        phase4: resolve(import.meta.dirname, 'examples/smoke/phase4.html'),
        phase5: resolve(import.meta.dirname, 'examples/smoke/phase5.html'),
        phase6: resolve(import.meta.dirname, 'examples/smoke/phase6.html'),
        phase7: resolve(import.meta.dirname, 'examples/smoke/phase7.html'),
        phase8: resolve(import.meta.dirname, 'examples/smoke/phase8.html'),
        phase9:  resolve(import.meta.dirname, 'examples/smoke/phase9.html'),
        phase10: resolve(import.meta.dirname, 'examples/smoke/phase10.html'),
        phase11: resolve(import.meta.dirname, 'examples/smoke/phase11.html'),
        smoke:   resolve(import.meta.dirname, 'examples/smoke/index.html'),
      },
    },
    sourcemap: true,
  },
});
