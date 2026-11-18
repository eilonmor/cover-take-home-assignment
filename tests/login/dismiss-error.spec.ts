import { test, expect, GUEST_STATE } from '@fixtures/index';
import { LOGIN_ERRORS, PAGE_TITLES } from '@data/messages';
import { ROUTES, routePattern } from '@data/routes';
import { getUser } from '@data/users';

// Spec: specs/01-login.md, scenario 1.3.
test.use({ storageState: GUEST_STATE });

test.describe('Login', () => {
  test(
    'TC-LOGIN-03 Error message can be dismissed and the user can then log in',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-LOGIN-08' } },
    async ({ loginPage, inventoryPage }) => {
      // 1. Submit the empty form to get an error.
      await loginPage.goto();
      await loginPage.submit();
      // Hard guard: the dismiss step needs the error to be shown.
      await expect(loginPage.errorMessage).toHaveText(LOGIN_ERRORS.usernameRequired);
      await expect.soft(loginPage.errorButton).toBeVisible();

      // 2. Dismiss it: the message, the red icons and the red input state are all removed.
      await loginPage.dismissError();
      await expect.soft(loginPage.errorMessage).toHaveCount(0);
      await expect.soft(loginPage.inputErrorIcons).toHaveCount(0);
      await expect.soft(loginPage.usernameInput).not.toHaveClass(loginPage.inputErrorClass);
      await expect.soft(loginPage.passwordInput).not.toHaveClass(loginPage.inputErrorClass);

      // 3. The user can then log in.
      await loginPage.fillCredentials(getUser('standard'));
      await loginPage.submit();
      await inventoryPage.waitForLoaded();
      await expect(inventoryPage.page).toHaveURL(routePattern(ROUTES.inventory));
      await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory);
    },
  );
});
