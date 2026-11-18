import { test, expect, GUEST_STATE } from '@fixtures/index';
import { PROTECTED_URLS, ROUTES, SESSION_STATES, routePattern, type ProtectedUrl, type SessionState } from '@data/routes';
import { getUser } from '@data/users';
import { runGroupedCases } from '@utils/grouped';
import { getSessionCookie, removeSessionCookie, resetBrowserState } from '@utils/storage';

// Spec: specs/05-logout-navigation.md, scenario 1.2. Grouped: one isolated step per session state × protected URL
// (2 × 6 = 12 cases). Guest: every case starts logged out, from resetBrowserState.
// runGroupedCases sizes the test timeout for all 12 cases, so there is no test.slow().
test.use({ storageState: GUEST_STATE });

interface ProtectedUrlCase extends ProtectedUrl {
  readonly name: string;
  readonly state: SessionState;
}

const CASES: readonly ProtectedUrlCase[] = SESSION_STATES.flatMap((state) =>
  PROTECTED_URLS.map((target) => ({ ...target, state, name: `${state} ${target.url}` })),
);

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-02 Protected pages are blocked without a valid session',
    { tag: ['@smoke', '@regression'], annotation: { type: 'covers', description: 'AC-NAV-06, AC-NAV-12' } },
    async ({ page, context, loginPage, inventoryPage }) => {
      await runGroupedCases(CASES, {
        run: async ({ state, url, expectedError }) => {
          // Fresh state: no cookies and no storage, on the login page.
          await resetBrowserState(page);

          if (state === 'session cookie removed') {
            // A real UI login, then only the session cookie is dropped (AC-NAV-12). resetBrowserState
            // already opened the login page, so the form is submitted without loading it a second time.
            await loginPage.waitForLoaded();
            await loginPage.fillCredentials(getUser('standard'));
            await loginPage.submit();
            await inventoryPage.waitForLoaded();
            // Hard guard: without a session to remove, this case would only repeat "never logged in".
            await expect
              .poll(async () => getSessionCookie(context), { message: 'session cookie after login' })
              .toBeDefined();
            await removeSessionCookie(context);
          }

          await page.goto(url);

          // The redirect to the login page is client-side, so toHaveURL auto-waits for it.
          await expect.soft(page).toHaveURL(routePattern(ROUTES.login));
          await expect.soft(loginPage.errorMessage).toHaveText(expectedError);
          await expect.soft(loginPage.loginButton).toBeVisible();
          // No protected content: the header cart link is on every logged-in page.
          await expect.soft(inventoryPage.header.cartLink).toHaveCount(0);
          await expect.soft(inventoryPage.container).toHaveCount(0);
        },
      });
    },
  );
});
