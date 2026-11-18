import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ALLURE_RESULTS_DIR } from './src/utils/paths';

// Load environment variables from .env. Without one, fall back to .env.example, which holds only the
// public demo values, so a fresh clone runs in three steps: clone → install → test.
// Variables already set in the shell (e.g. in CI) win over both files: dotenv never overrides them.
const ENV_FILE = path.resolve(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  dotenv.config({ path: ENV_FILE, quiet: true });
} else {
  dotenv.config({ path: path.resolve(__dirname, '.env.example'), quiet: true });
  // The runner and every worker load this config; print the notice once, from the runner only. It goes to
  // stderr, so stdout stays clean for reporters that write there (e.g. `--reporter=json > results.json`).
  if (process.env.TEST_WORKER_INDEX === undefined) {
    console.warn('No .env file found: using the public demo values from .env.example (copy it to .env to override).');
  }
}

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
    // Optional Allure 3 report (npm run allure:generate / allure:open). Annotations are mapped to Allure
    // labels by src/fixtures/allure.fixture.ts, so they are not repeated as "covers: …" steps.
    ['allure-playwright', { resultsDir: ALLURE_RESULTS_DIR, reportAnnotations: false }],
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
