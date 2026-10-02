import { defineConfig, devices } from '@playwright/test'

const frontendPort = Number(process.env.PLAYWRIGHT_FRONTEND_PORT || 3001)
const frontendUrl = `http://127.0.0.1:${frontendPort}`
const reuseExistingServer = !process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: frontendUrl, trace: 'retain-on-failure' },
  webServer: [
    { command: 'bun tests/e2e/mock-api.ts', url: 'http://127.0.0.1:3002/health', reuseExistingServer },
    { command: `NUXT_API_BASE_URL=http://127.0.0.1:3002/api/v1 NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3002/api/v1 bun run dev -- --host 127.0.0.1 --port ${frontendPort}`, url: frontendUrl, reuseExistingServer }
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
