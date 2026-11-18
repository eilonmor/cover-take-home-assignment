import fs from 'fs';
import { ALLURE_RESULTS_DIR, AUTH_DIR } from './utils/paths';

/**
 * Runs once at the start of every run, whatever the CLI filters are.
 * - Deletes the auth files from previous runs, so a run can never reuse an old session.
 *   The auth fixture then creates new ones on demand.
 * - Deletes the previous run's Allure results, so the Allure report shows this run only.
 */
export default function globalSetup(): void {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.rmSync(ALLURE_RESULTS_DIR, { recursive: true, force: true });
}
