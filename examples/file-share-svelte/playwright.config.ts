import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'turbo build && pnpm run preview',
    port: 4173
  },

  testDir: 'e2e'
});
