import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/back-end/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/back-end/**/*.ts'],
      // server.ts only starts the server, schemas only contain types
      exclude: [
        'src/back-end/schemas/**',
        'src/back-end/server.ts',
        'src/back-end/**/*.test.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
