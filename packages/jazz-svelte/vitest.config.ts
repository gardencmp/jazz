import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    conditions: mode === 'test' ? ['browser'] : [],
  },
}));
