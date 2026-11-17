import { test as base, expect, selectors } from '@playwright/test';
import path from 'path';
import { getUser, type UserKey } from '../data/users';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { ENV } from '../utils/env';
import { AUTH_DIR } from '../utils/paths';
import { SESSION_COOKIE } from '../utils/storage';

/** An empty storage state: use it with `test.use({ storageState: GUEST_STATE })` for logged-out specs. */
export const GUEST_STATE = { cookies: [], origins: [] };

export interface AuthWorkerFixtures {
  /**
   * The account the worker logs in as. It is a worker-scoped option, so override it only at the
   * top level of a spec file (`test.use({ authUser: 'problem' })` outside any `test.describe`) or
   * in the config. Playwright rejects it inside a describe block, because it forces a new worker.
   */
  authUser: UserKey;
  /** Path to the storageState file created by this worker in this run. */
  workerStorageState: string;
}

/**
 * Auth fixture: logs in once per worker and per user, through the UI, and saves
 * Playwright storageState. Every test then gets its own new browser context created
 * from that state, so tests start logged in and are still fully isolated.
 *
 * The fixture is created lazily the first time a selected test needs it. So it runs
 * the same way for a single test, a tag filter (@smoke / @regression) or the full suite,
 * and a fresh auth is created on every run and after every retry (a new worker).
 */
export const test = base.extend<object, AuthWorkerFixtures>({
  authUser: ['standard', { scope: 'worker', option: true }],

  workerStorageState: [
    async ({ browser, authUser }, use, workerInfo) => {
      const file = path.join(
        AUTH_DIR,
        `${workerInfo.project.name}-${authUser}-${workerInfo.parallelIndex}.json`,
      );

      // Worker fixtures run before Playwright applies the project's `use` options (those are
      // applied per test), so set testIdAttribute and baseURL explicitly here.
      selectors.setTestIdAttribute(workerInfo.project.use.testIdAttribute ?? 'data-test');
      const context = await browser.newContext({ baseURL: ENV.baseURL });
      try {
        const page = await context.newPage();
        await new LoginPage(page).login(getUser(authUser));
        // Allows for performance_glitch_user, whose inventory takes about 5 s to render (SLOW_RENDER_TIMEOUT).
        await new InventoryPage(page).waitForLoaded();

        const state = await context.storageState({ path: file }); // always overwrite
        if (!state.cookies.some((cookie) => cookie.name === SESSION_COOKIE)) {
          throw new Error(`Auth setup failed for "${authUser}": no ${SESSION_COOKIE} cookie was set.`);
        }
      } finally {
        await context.close();
      }

      await use(file);
    },
    // Own timeout: a UI login (about 5 s for performance_glitch_user) must not eat into the first test's budget.
    { scope: 'worker', timeout: 60_000 },
  ],

  // Default for every test: start logged in.
  storageState: async ({ workerStorageState }, use) => {
    await use(workerStorageState);
  },
});

export { expect };
