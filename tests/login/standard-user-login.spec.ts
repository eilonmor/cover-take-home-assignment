import { test, expect, GUEST_STATE } from '@fixtures/index';
import { PAGE_TITLES } from '@data/messages';
import { CATALOG_AZ } from '@data/products';
import { ROUTES, routePattern } from '@data/routes';
import { getUser } from '@data/users';

// Spec: specs/01-login.md, scenario 1.1.
test.use({ storageState: GUEST_STATE });

test.describe('Login', () => {
  test(
    'TC-LOGIN-01 Standard user logs in successfully',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-LOGIN-01' } },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.goto();
      await expect.soft(loginPage.usernameInput).toBeVisible();
      await expect.soft(loginPage.passwordInput).toBeVisible();
      await expect.soft(loginPage.loginButton).toBeVisible();

      await loginPage.fillCredentials(getUser('standard'));
      await loginPage.submit();

      // Hard guard: everything below depends on landing on the inventory page.
      await inventoryPage.waitForLoaded();
      await expect(inventoryPage.page).toHaveURL(routePattern(ROUTES.inventory));

      await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory);
      await expect.soft(inventoryPage.list.items).toHaveCount(CATALOG_AZ.length);
      await expect.soft(loginPage.errorMessage).toHaveCount(0);
    },
  );
});
