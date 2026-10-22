import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  resolve: {
    // Keep in sync with `paths` in tsconfig.json.
    alias: [{ find: /^#\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }]
  },
  server: {
    host: true,
    port: 17327,
    // The API port is fixed in the repo README; /api is the only path proxied.
    proxy: {
      '/api': {
        target: 'http://localhost:17073',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 8192
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts']
  }
});
