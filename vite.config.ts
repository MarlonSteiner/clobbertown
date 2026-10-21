// `defineConfig` comes from vitest rather than vite so the `test` block below
// is type-checked; vite's own version does not know about it.
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { npcBrainServer } from './server/npcBrainPlugin.ts';

export default defineConfig(({ mode }) => {
  // Read every variable, not only VITE_-prefixed ones, but use it only here,
  // in the server. Vite exposes only VITE_ variables to browser code, so the
  // API key never reaches the game bundle.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      npcBrainServer({ savePath: 'saves/memory.json', apiKey: env.ANTHROPIC_API_KEY || undefined }),
    ],
    // Phase 4 ships this inside Electron, which loads files from disk rather than
    // a web server. Relative asset paths work in both, absolute ones only work on the web.
    base: './',
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    },
  };
});
