import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:3001', trace: 'retain-on-failure' },
  webServer: [
    { command: 'bun tests/e2e/mock-api.ts', url: 'http://127.0.0.1:3002/health', reuseExistingServer: false },
    { command: 'NUXT_API_BASE_URL=http://127.0.0.1:3002/api/v1 NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3002/api/v1 bun run dev -- --host 127.0.0.1 --port 3001', url: 'http://127.0.0.1:3001', reuseExistingServer: false }
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
