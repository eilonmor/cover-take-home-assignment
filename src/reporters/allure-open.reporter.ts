import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import type { FullResult, Reporter } from '@playwright/test/reporter';
import { ALLURE_REPORT_DIR, ALLURE_RESULTS_DIR, PROJECT_ROOT } from '../utils/paths';

/** The Allure 3 CLI, run with the current Node binary so it works the same on every OS, with no shell. */
const ALLURE_CLI = path.join(PROJECT_ROOT, 'node_modules', 'allure', 'cli.js');

/** A fixed loopback port, so every local run reuses one report server instead of starting a new one. */
const PORT = 5252;
const HOST = '127.0.0.1';
const REPORT_URL = `http://${HOST}:${PORT}/`;

/**
 * Written into the generated report and served with it. Its content is this checkout's path, so a server
 * on the port is reused only when it serves this checkout's report, not a report from another clone or worktree.
 */
const MARKER_FILE = 'report-source.txt';

/** How long the results folder must stay unchanged before the report is built, and the most to wait for it. */
const RESULTS_SETTLE_MS = 500;
const RESULTS_MAX_WAIT_MS = 5_000;
const SERVER_START_TIMEOUT_MS = 15_000;

/** free: nothing listens. ours: serves this checkout's report. other: anything else answers on the port. */
type PortState = 'free' | 'ours' | 'other';

/**
 * Local runs only (playwright.config.ts leaves it out on CI): when the run ends, builds the Allure report
 * from allure-results/ into allure-report/ and opens it in the default browser.
 *
 * - It is listed after allure-playwright, whose onEnd Playwright awaits first. allure-playwright still writes
 *   each test's result at the end of an onTestEnd that nobody awaits (after its attachments are processed),
 *   so the report is built only once the results folder has stopped changing.
 * - The report server runs in the background, so the run exits at once with its own exit code. It keeps
 *   serving allure-report/ from disk, so the next run regenerates the report and just opens a new tab.
 * - Skipped when no test ran (e.g. --list, or a filter that matches nothing) and when the run is interrupted.
 * - Every failure is a warning: the report is optional and never changes the result of the run.
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
      await waitForResultsToSettle();
      await generateReport();

      const port = await probePort();
      if (port === 'other') {
        warn(`port ${PORT} is used by another server (maybe another checkout's report). Run npm run allure:open.`);
        return;
      }
      if (port === 'ours') {
        openInBrowser(REPORT_URL);
      } else if (!(await startReportServer())) {
        warn('the report server did not start. Run npm run allure:open.');
        return;
      }

      console.log(`\nAllure report: ${REPORT_URL} (the server keeps running in the background; see README to stop it).`);
    } catch (error) {
      warn(error instanceof Error ? error.message : String(error));
    }
  }
}

function warn(message: string): void {
  console.warn(`Could not open the Allure report: ${message}`);
}

/** Resolves once the number of files in allure-results/ has not changed for RESULTS_SETTLE_MS. */
async function waitForResultsToSettle(): Promise<void> {
  const countFiles = () => (fs.existsSync(ALLURE_RESULTS_DIR) ? fs.readdirSync(ALLURE_RESULTS_DIR).length : 0);
  const deadline = Date.now() + RESULTS_MAX_WAIT_MS;
  let count = countFiles();
  let stableSince = Date.now();
  while (Date.now() - stableSince < RESULTS_SETTLE_MS && Date.now() < deadline) {
    await delay(100);
    const next = countFiles();
    if (next !== count) {
      count = next;
      stableSince = Date.now();
    }
  }
}

/** allure generate, then the marker file. Output is discarded: npm run allure:generate shows it when needed. */
async function generateReport(): Promise<void> {
  const exitCode = await new Promise<number | null>((resolve, reject) => {
    spawn(
      process.execPath,
      [ALLURE_CLI, 'generate', ALLURE_RESULTS_DIR, '--output', ALLURE_REPORT_DIR, '--clean'],
      { cwd: PROJECT_ROOT, stdio: 'ignore', windowsHide: true },
    )
      .on('error', reject)
      .on('exit', resolve);
  });
  if (exitCode !== 0) {
    throw new Error(`allure generate exited with code ${exitCode}. Run npm run allure:generate to see why.`);
  }
  fs.writeFileSync(path.join(ALLURE_REPORT_DIR, MARKER_FILE), PROJECT_ROOT);
}

/** Is the port free, serving this checkout's report (from an earlier run), or used by something else? */
function probePort(): Promise<PortState> {
  return new Promise((resolve) => {
    const request = http.get(`${REPORT_URL}${MARKER_FILE}`, { timeout: 2_000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => (body += chunk));
      response.on('end', () => resolve(response.statusCode === 200 && body === PROJECT_ROOT ? 'ours' : 'other'));
    });
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', (error: NodeJS.ErrnoException) => resolve(error.code === 'ECONNREFUSED' ? 'free' : 'other'));
  });
}

/**
 * Starts `allure open` in the background; it serves the report and opens the browser itself. Resolves true once
 * the port serves this checkout's report. If another run started the server first, this one exits on the busy
 * port without opening a tab, so the tab is opened here instead.
 */
async function startReportServer(): Promise<boolean> {
  const server = spawnDetached(process.execPath, [
    ALLURE_CLI, 'open', ALLURE_REPORT_DIR, '--port', String(PORT), '--host', HOST,
  ]);
  let exited = false;
  server.on('exit', () => (exited = true));

  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if ((await probePort()) === 'ours') {
      if (exited) openInBrowser(REPORT_URL);
      return true;
    }
    if (exited) return false;
    await delay(250);
  }
  return false;
}

function openInBrowser(url: string): void {
  if (process.platform === 'win32') spawnDetached('rundll32', ['url.dll,FileProtocolHandler', url]);
  else if (process.platform === 'darwin') spawnDetached('open', [url]);
  else spawnDetached('xdg-open', [url]);
}

/**
 * Runs a command the test run does not wait for. A command that cannot start (e.g. no xdg-open) only warns:
 * without the error listener it would be an uncaught exception in the runner.
 * The working directory is the temp folder, so the long-lived report server never locks the project folder
 * (Windows refuses to delete or rename a folder that a running process uses as its working directory).
 */
function spawnDetached(command: string, args: string[]): ChildProcess {
  const child = spawn(command, args, { cwd: os.tmpdir(), detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', (error) => warn(`${command} failed to start (${error.message}).`));
  child.unref();
  return child;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default AllureOpenReporter;
