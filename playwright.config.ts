import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env (see .env.example).
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

/**
 * Playwright configuration.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // Deletes old auth files so every run creates a fresh login (see src/fixtures/auth.fixture.ts).
  globalSetup: './src/global-setup.ts',

  // Tests are independent, so every test can run in parallel.
  fullyParallel: true,

  // Fail the CI build if test.only is left in the source.
  forbidOnly: !!process.env.CI,

  // Assignment requirement: retries: 1.
  retries: 1,

  // Let Playwright pick the worker count locally; keep CI predictable.
  workers: process.env.CI ? 2 : undefined,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',

    // saucedemo uses data-test attributes, so getByTestId targets them.
    testIdAttribute: 'data-test',

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
