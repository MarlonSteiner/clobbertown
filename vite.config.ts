// `defineConfig` comes from vitest rather than vite so the `test` block below
// is type-checked; vite's own version does not know about it.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Phase 4 ships this inside Electron, which loads files from disk rather than
  // a web server. Relative asset paths work in both, absolute ones only work on the web.
  base: './',
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
