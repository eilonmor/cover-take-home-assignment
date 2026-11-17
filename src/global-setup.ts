import fs from 'fs';
import { AUTH_DIR } from './utils/paths';

/**
 * Runs once at the start of every run, whatever the CLI filters are.
 * Deletes the auth files from previous runs, so a run can never reuse an old session.
 * The auth fixture then creates new ones on demand.
 */
export default function globalSetup(): void {
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}
