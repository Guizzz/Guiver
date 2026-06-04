import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 10000,
    include: ['tests/**/*.test.ts'],
  },
})
