import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
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
