import { defineConfig, devices } from '@playwright/test'

const frontendPort = Number(process.env.PLAYWRIGHT_FRONTEND_PORT || 3001)
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT || 3002)
const frontendUrl = `http://127.0.0.1:${frontendPort}`
const apiUrl = `http://127.0.0.1:${apiPort}`
const reuseExistingServer = !process.env.CI

import { existsSync } from 'node:fs'

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium-browser') ? '/usr/bin/chromium-browser' : undefined)

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: frontendUrl, trace: 'retain-on-failure' },
  webServer: [
    { command: `PLAYWRIGHT_API_PORT=${apiPort} bun tests/e2e/mock-api.ts`, url: `${apiUrl}/health`, reuseExistingServer },
    { command: `NUXT_API_BASE_URL=${apiUrl}/api/v1 NUXT_PUBLIC_API_BASE_URL=${apiUrl}/api/v1 bun run dev -- --host 127.0.0.1 --port ${frontendPort}`, url: frontendUrl, reuseExistingServer }
  ],
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        executablePath: chromiumPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }
    }
  }]
})
