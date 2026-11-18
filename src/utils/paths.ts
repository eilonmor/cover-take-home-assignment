import path from 'path';

/**
 * Folder for the auth (storageState) files. global-setup wipes it at the start of every run.
 * Kept in a module without Playwright imports, so global-setup can use it without loading the test runner.
 */
export const AUTH_DIR = path.resolve(__dirname, '../../playwright/.auth');

/** Raw Allure results of the current run. global-setup wipes it, so a report only ever shows one run. */
export const ALLURE_RESULTS_DIR = path.resolve(__dirname, '../../allure-results');
