import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
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

/** Parses WORKERS: "4" → 4, "25%" → "25%"; empty or unset → 4. Anything else fails fast with a clear message. */
function localWorkers(value: string | undefined): number | string {
  const raw = value?.trim();
  if (!raw) return 4;
  if (/^[1-9]\d*%?$/.test(raw)) return raw.endsWith('%') ? raw : Number(raw);
  throw new Error(`Invalid WORKERS value "${raw}": use a positive number (e.g. 4) or a percentage (e.g. 25%).`);
}

/**
 * Playwright configuration.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  // Deletes old auth files so every run creates a fresh login (see src/fixtures/auth.fixture.ts),
  // and the previous run's allure-results, so the Allure report shows one run only.
  globalSetup: './src/global-setup.ts',

  // Tests are independent, so every test can run in parallel.
  fullyParallel: true,

  // Fail the CI build if test.only is left in the source.
  forbidOnly: !!process.env.CI,

  // Assignment requirement: retries: 1.
  retries: 1,

  // CI always uses 2 workers, even though it loads WORKERS from .env.example. Locally, WORKERS sets the count
  // (a number, or a percentage of CPU cores such as "25%"), with 4 as the default. Playwright's own default (half
  // the cores) starts too many browsers on a many-core machine, and Firefox/WebKit then time out.
  workers: process.env.CI ? 2 : localWorkers(process.env.WORKERS),

  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // Raw results for the Allure 3 report. The HTML report above never depends on it. Annotations are mapped
    // to Allure labels by src/fixtures/allure.fixture.ts, so they are not repeated as "covers: …" steps.
    ['allure-playwright', { resultsDir: ALLURE_RESULTS_DIR, reportAnnotations: false }],
    // Local runs only: builds the Allure report and opens it in the browser when the run ends. It must stay
    // after allure-playwright, which finishes writing the results in its own onEnd. ALLURE_OPEN=false (or 0, no,
    // off) turns it off.
    ...(!process.env.CI && !/^(false|0|no|off)$/i.test(process.env.ALLURE_OPEN ?? '')
      ? [['./src/reporters/allure-open.reporter.ts'] as ReporterDescription]
      : []),
    // CI only: each browser job also writes a blob report (blob-report/report-<browser>.zip, named by
    // PLAYWRIGHT_BLOB_OUTPUT_NAME in the workflow), which the report job merges into one HTML report.
    ...(process.env.CI ? [['blob'] as ReporterDescription] : []),
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
