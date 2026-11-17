import { test } from '@playwright/test';

/**
 * Grouped verification runner: runs data-driven cases inside ONE test, each as its own isolated,
 * named `test.step`. A failing case never stops the others, and the test fails at the end if any
 * case failed. Serves TC-LOGIN-02, TC-LOGIN-04, TC-NAV-02 and TC-CHK-03.
 */

/** A case of a grouped test; `name` becomes the step title `#<n> <name>`. */
export interface GroupedCase {
  readonly name: string;
}

export interface GroupedOptions<C extends GroupedCase> {
  /** Runs one case. It must start by establishing its own fresh state (e.g. goto('/'), resetBrowserState, clearCart). */
  readonly run: (testCase: C, index: number) => Promise<void>;
  /** Per-case step timeout, default 30_000. */
  readonly stepTimeout?: number;
}

/** The outcome of one case. */
export interface CaseResult {
  readonly title: string;
  readonly status: 'passed' | 'failed';
  /** Soft-assertion failures and the thrown error (if any), as plain text. */
  readonly errors: readonly string[];
}

const DEFAULT_STEP_TIMEOUT = 30_000;
/** Extra test budget for fixtures, the summary attachment and teardown. */
const TEST_BUDGET_MARGIN = 15_000;

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const plain = (text: string): string => text.replace(ANSI, '');

const describeError = (error: unknown): string =>
  plain(error instanceof Error ? error.message : String(error));

/** First line of a message, made safe for a markdown table cell. */
const cell = (text: string): string => (text.split('\n').find((line) => line.trim() !== '') ?? '').replace(/\|/g, '\\|').trim();

/**
 * Runs every case as its own `test.step`, records soft and hard failures per case, attaches a
 * `grouped-summary.md` table, and throws at the end if any case failed.
 */
export async function runGroupedCases<C extends GroupedCase>(
  cases: readonly C[],
  options: GroupedOptions<C>,
): Promise<readonly CaseResult[]> {
  if (cases.length === 0) {
    throw new Error('runGroupedCases needs at least one case: an empty case list would pass without checking anything.');
  }
  const info = test.info();
  const stepTimeout = options.stepTimeout ?? DEFAULT_STEP_TIMEOUT;

  // 1. Size the test budget for all cases, so a grouped test never needs test.slow().
  const budget = cases.length * stepTimeout + TEST_BUDGET_MARGIN;
  if (info.timeout !== 0 && info.timeout < budget) {
    test.setTimeout(budget);
  }

  const results: CaseResult[] = [];
  for (const [index, testCase] of cases.entries()) {
    const title = `#${index + 1} ${testCase.name}`;
    // 3. Soft failures of this case are the test errors added while its step runs.
    const errorsBefore = info.errors.length;
    let thrown: string | undefined;
    // A step timeout rejects test.step but does NOT cancel `run`, so track whether it really finished.
    let runSettled = false;
    try {
      // 2. One named step per case, with its own timeout.
      await test.step(
        title,
        async () => {
          try {
            await options.run(testCase, index);
          } finally {
            runSettled = true;
          }
        },
        { timeout: stepTimeout },
      );
    } catch (error) {
      // 4. A hard error fails this step in the report and is recorded, but the loop moves on.
      thrown = describeError(error);
    }
    const errors = info.errors
      .slice(errorsBefore)
      .map((error) => plain(error.message ?? error.value ?? 'Unknown error'));
    if (thrown !== undefined) {
      errors.push(thrown);
    }
    results.push({ title, status: errors.length === 0 ? 'passed' : 'failed', errors });

    // 5. Isolation: if the step timed out while `run` is still pending, it would keep acting on the
    // shared page during the next case and report its failures there. Stop instead of continuing.
    if (!runSettled) {
      for (const [rest, skipped] of cases.entries()) {
        if (rest > index) {
          results.push({
            title: `#${rest + 1} ${skipped.name}`,
            status: 'failed',
            errors: [`Not run: ${title} timed out and was still running, so the shared page was not safe to reuse.`],
          });
        }
      }
      break;
    }
  }

  // 6. Verdict: summary attachment + annotation, then fail if any case failed.
  const failed = results.filter((result) => result.status === 'failed');
  const passedCount = results.length - failed.length;
  const summary = [
    `| Case | Status | First error |`,
    `|------|--------|-------------|`,
    ...results.map((r) => `| ${cell(r.title)} | ${r.status} | ${cell(r.errors[0] ?? '')} |`),
  ].join('\n');
  await info.attach('grouped-summary.md', { body: summary, contentType: 'text/markdown' });
  info.annotations.push({
    type: 'grouped',
    description: `${results.length} cases, ${passedCount} passed, ${failed.length} failed`,
  });

  if (failed.length > 0) {
    throw new Error(
      `${failed.length} of ${results.length} cases failed: ${failed.map((r) => r.title).join(', ')}`,
    );
  }
  return results;
}
