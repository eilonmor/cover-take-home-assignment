import { test, expect } from '@fixtures/index';
import { ROUTES, routePattern } from '@data/routes';
import { getUser } from '@data/users';
import { getSessionCookie } from '@utils/storage';

// Spec: specs/05-logout-navigation.md, scenario 1.1. Authenticated (default): starts logged in as the worker's
// authUser (standard_user unless overridden).
// Logging out only clears this test's own context; the worker's storageState file is untouched.

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-01 Logout returns to login page with empty fields and cleared session cookie',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-NAV-05' } },
    async ({ page, context, authUser, inventoryPage, loginPage }) => {
      await test.step('On the inventory, the session cookie holds the username', async () => {
        // Hard guards: the inventory is loaded and the session is the one the test logs out of.
        await inventoryPage.goto();
        await expect
          .poll(async () => (await getSessionCookie(context))?.value, { message: 'session cookie value' })
          .toBe(getUser(authUser).username);
      });

      await test.step('Logout: login page, empty fields, no error, no session cookie', async () => {
        // Hard guard: logout() waits for the login URL.
        await inventoryPage.menu.logout();
        await expect.soft(page).toHaveURL(routePattern(ROUTES.login));
        await expect.soft(loginPage.loginButton).toBeVisible();
        await expect.soft(loginPage.usernameInput).toHaveValue('');
        await expect.soft(loginPage.passwordInput).toHaveValue('');
        await expect.soft(loginPage.errorMessage).toHaveCount(0);
        await expect
          .soft.poll(async () => getSessionCookie(context), { message: 'session cookie after logout' })
          .toBeUndefined();
      });
    },
  );
});
