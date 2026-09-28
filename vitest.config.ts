import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/back-end/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/back-end/schemas/**'],
    },
  },
});
