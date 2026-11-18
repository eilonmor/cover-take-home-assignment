import { test, expect, GUEST_STATE } from '@fixtures/index';
import { PAGE_TITLES } from '@data/messages';
import { ROUTES, routePattern } from '@data/routes';
import { getUser } from '@data/users';

// Spec: specs/01-login.md, scenario 1.5.
test.use({ storageState: GUEST_STATE });

test.describe('Login', () => {
  test(
    'TC-LOGIN-05 Enter key submits the login form',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-LOGIN-11' } },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.fillCredentials(getUser('standard'));

      // Enter in the password field, without clicking the login button.
      await loginPage.submitWithEnter();

      await inventoryPage.waitForLoaded();
      await expect(inventoryPage.page).toHaveURL(routePattern(ROUTES.inventory));
      await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory);
    },
  );
});
