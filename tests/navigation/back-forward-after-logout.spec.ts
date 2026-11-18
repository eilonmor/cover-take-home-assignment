import { test, expect } from '@fixtures/index';
import { protectedPageError } from '@data/messages';
import { ROUTES, routePattern } from '@data/routes';
import { recordNavigations } from '@utils/navigation';

// Spec: specs/05-logout-navigation.md, scenario 1.3. Authenticated (default): starts logged in as standard_user.

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-03 Browser Back/Forward after logout does not expose inventory',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-NAV-07' } },
    async ({ page, inventoryPage, loginPage }) => {
      await test.step('Open the inventory and log out', async () => {
        // Hard guards: the inventory is loaded, and logout() waits for the login URL.
        await inventoryPage.goto();
        await inventoryPage.menu.logout();
        await loginPage.waitForLoaded();
      });

      await test.step('Back: still the login page, with the inventory error', async () => {
        await page.goBack();
        // The error only shows once the client-side redirect has run, so it is checked first:
        // the "no inventory" checks below then cannot pass on a page that has not rendered yet.
        await expect.soft(loginPage.errorMessage).toHaveText(protectedPageError(ROUTES.inventory));
        await expect.soft(page).toHaveURL(routePattern(ROUTES.login));
        await expect.soft(loginPage.loginButton).toBeVisible();
        await expect.soft(inventoryPage.container).toHaveCount(0);
      });

      await test.step('Forward: still no protected content', async () => {
        // The history moves are same-document, so goForward() returns null even when it navigates.
        // Recording the navigation proves Forward really ran; otherwise the checks below would pass
        // on the unchanged login page.
        const navigations = await recordNavigations(page, async () => {
          await page.goForward();
        });
        expect.soft(navigations, 'Forward navigated').not.toEqual([]);
        await expect.soft(page).toHaveURL(routePattern(ROUTES.login));
        await expect.soft(loginPage.loginButton).toBeVisible();
        await expect.soft(inventoryPage.container).toHaveCount(0);
      });
    },
  );
});
