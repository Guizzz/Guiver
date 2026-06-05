import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 10000,
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    env: {
      API_PORT: '8085',
      WSS_CLI_PORT: '8086',
      WSS_MDL_PORT: '8087',
      INFO_PORT: '54322',
    },
  },
})
