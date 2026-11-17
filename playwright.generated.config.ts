
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './generated/automation',
  testMatch: 'ai-generated-20*.spec.ts',

  globalSetup: './src/validate-ai-test-suite.mjs',

  fullyParallel: true,
  retries: 0,

  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report-generated',
      open: 'never'
    }]
  ],

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'ai-generated-chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4173/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
