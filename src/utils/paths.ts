import path from 'path';

/**
 * Folder for the auth (storageState) files. global-setup wipes it at the start of every run.
 * Kept in a module without Playwright imports, so global-setup can use it without loading the test runner.
 */
export const AUTH_DIR = path.resolve(__dirname, '../../playwright/.auth');
