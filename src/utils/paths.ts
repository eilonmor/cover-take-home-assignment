import path from 'path';

/**
 * Folder for the auth (storageState) files. global-setup wipes it at the start of every run.
 * Kept in a module without Playwright imports, so global-setup can use it without loading the test runner.
 */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const AUTH_DIR = path.join(PROJECT_ROOT, 'playwright', '.auth');

/** Raw Allure results of the current run. global-setup wipes it, so a report only ever shows one run. */
export const ALLURE_RESULTS_DIR = path.join(PROJECT_ROOT, 'allure-results');

/** The generated Allure report (npm run allure:generate, or automatically after a local run). */
export const ALLURE_REPORT_DIR = path.join(PROJECT_ROOT, 'allure-report');
