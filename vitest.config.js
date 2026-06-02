import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-logic tests only (Pixi-free modules) — run in Node, no DOM/WebGL.
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
