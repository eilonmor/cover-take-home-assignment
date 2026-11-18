import { execFile, spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { promisify } from 'util';
import type { FullResult, Reporter } from '@playwright/test/reporter';
import { ALLURE_REPORT_DIR, ALLURE_RESULTS_DIR, PROJECT_ROOT } from '../utils/paths';

const execFileAsync = promisify(execFile);

/** The Allure 3 CLI, run with the current Node binary so it works the same on every OS, with no shell. */
const ALLURE_CLI = path.join(PROJECT_ROOT, 'node_modules', 'allure', 'cli.js');

/** A fixed loopback port, so every local run reuses one report server instead of starting a new one. */
const PORT = 5252;
const HOST = '127.0.0.1';
const REPORT_URL = `http://${HOST}:${PORT}/`;

type PortState = 'free' | 'allure' | 'other';

/**
 * Local runs only (playwright.config.ts leaves it out on CI): when the run ends, builds the Allure report
 * from allure-results/ into allure-report/ and opens it in the default browser.
 *
 * - It is listed after allure-playwright, and Playwright awaits each reporter's onEnd in order, so the
 *   results are complete (including the environment and categories files) before the report is built.
 * - The report server runs in the background, so the run exits at once with its own exit code. It keeps
 *   serving allure-report/ from disk, so the next run regenerates the report and just opens a new tab.
 * - Skipped when no test ran (e.g. --list, or a filter that matches nothing) and when the run is interrupted.
 */
class AllureOpenReporter implements Reporter {
  private testsRun = 0;

  printsToStdio(): boolean {
    return false;
  }

  onTestEnd(): void {
    this.testsRun++;
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.testsRun === 0 || result.status === 'interrupted') return;

    try {
      await execFileAsync(
        process.execPath,
        [ALLURE_CLI, 'generate', ALLURE_RESULTS_DIR, '--output', ALLURE_REPORT_DIR, '--clean'],
        { cwd: PROJECT_ROOT },
      );

      const port = await probePort();
      if (port === 'other') {
        console.warn(`Allure report generated in allure-report/, but port ${PORT} is taken: run npm run allure:open.`);
        return;
      }
      if (port === 'allure') openInBrowser(REPORT_URL);
      else startReportServer();

      console.log(`\nAllure report: ${REPORT_URL} (the server keeps running in the background).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Could not open the Allure report: ${message}`);
    }
  }
}

/** Is the port free, already serving an Allure report (from an earlier run), or used by something else? */
function probePort(): Promise<PortState> {
  return new Promise((resolve) => {
    const request = http.get(REPORT_URL, { timeout: 2_000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => (body += chunk));
      response.on('end', () => resolve(/allure/i.test(body) ? 'allure' : 'other'));
    });
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', (error: NodeJS.ErrnoException) => resolve(error.code === 'ECONNREFUSED' ? 'free' : 'other'));
  });
}

/** `allure open` serves the report and opens the browser itself. Detached, so the test run does not wait for it. */
function startReportServer(): void {
  spawnDetached(process.execPath, [
    ALLURE_CLI, 'open', ALLURE_REPORT_DIR, '--port', String(PORT), '--host', HOST,
  ]);
}

function openInBrowser(url: string): void {
  if (process.platform === 'win32') spawnDetached('rundll32', ['url.dll,FileProtocolHandler', url]);
  else if (process.platform === 'darwin') spawnDetached('open', [url]);
  else spawnDetached('xdg-open', [url]);
}

function spawnDetached(command: string, args: string[]): void {
  spawn(command, args, { cwd: PROJECT_ROOT, detached: true, stdio: 'ignore', windowsHide: true }).unref();
}

export default AllureOpenReporter;
