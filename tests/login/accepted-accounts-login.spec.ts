import { test, expect, GUEST_STATE } from '@fixtures/index';
import { ACCEPTED_ACCOUNTS } from '@data/login-cases';
import { PAGE_TITLES } from '@data/messages';
import { CATALOG_AZ } from '@data/products';
import { ROUTES, routePattern } from '@data/routes';
import { runGroupedCases } from '@utils/grouped';
import { resetBrowserState } from '@utils/storage';
import { SLOW_RENDER_TIMEOUT } from '@utils/timeouts';

// Spec: specs/01-login.md, scenario 1.4. Grouped: one isolated step per account of ACCEPTED_ACCOUNTS.
// Images and prices are not asserted: these accounts have known catalog defects (spec 01 §6).
test.use({ storageState: GUEST_STATE });

/**
 * Per-case budget: two navigations plus up to three SLOW_RENDER_TIMEOUT waits for
 * performance_glitch_user, so a failing slow case still ends inside its own step.
 */
const STEP_TIMEOUT = 4 * SLOW_RENDER_TIMEOUT;

test.describe('Login', () => {
  test(
    'TC-LOGIN-04 All other accepted accounts can log in',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-LOGIN-15' } },
    async ({ page, loginPage, inventoryPage }) => {
      await runGroupedCases(ACCEPTED_ACCOUNTS, {
        stepTimeout: STEP_TIMEOUT,
        run: async ({ user, timeout }) => {
          // Fresh state: drop the previous case's session, cart and storage.
          await resetBrowserState(page);
          await loginPage.loginAs(user);

          // Hard guard: a rejected login fails this case fast instead of timing out check by check.
          // performance_glitch_user renders after about 5 s: a longer wait, not a speed SLA.
          await expect(page).toHaveURL(routePattern(ROUTES.inventory), { timeout });
          await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory, { timeout });
          await expect.soft(inventoryPage.list.items).toHaveCount(CATALOG_AZ.length, { timeout });
          await expect.soft(loginPage.errorMessage).toHaveCount(0);
        },
      });
    },
  );
});
