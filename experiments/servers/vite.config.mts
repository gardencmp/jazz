import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  publicDir: "public",
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'public/**/*',
          dest: ''
        }
      ],
      structured: true
    })
  ],
  build: {
    copyPublicDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'public/client/http/index.html')
    }
  },
  root: '.',
});