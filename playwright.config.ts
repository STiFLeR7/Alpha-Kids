import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3107',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start -- --port 3107',
    url: 'http://127.0.0.1:3107',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
