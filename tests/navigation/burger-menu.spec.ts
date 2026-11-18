import { test, expect } from '@fixtures/index';
import { ABOUT_URL, MENU_ITEMS } from '@data/messages';
import { ROUTES, routePattern } from '@data/routes';

// Spec: specs/05-logout-navigation.md, scenario 1.5. Authenticated (default): starts logged in as standard_user.
// Open/closed is read only from aria-hidden on the menu wrapper: the items stay in the DOM and
// "visible" in CSS while the menu is closed (spec 05 §4).

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-05 Burger menu opens with 5 items and closes with the X button',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-NAV-01, AC-NAV-02' } },
    async ({ page, inventoryPage }) => {
      const { menu } = inventoryPage;

      await test.step('On the inventory, the menu is closed', async () => {
        await inventoryPage.goto();
        // Hard guard: "open" below is only meaningful if the menu starts closed.
        await expect(menu.wrapper).toHaveAttribute('aria-hidden', 'true');
      });

      await test.step('Open: 5 items in order, all shown, About links to Sauce Labs', async () => {
        // Hard guard: open() waits for aria-hidden="false".
        await menu.open();
        await expect.soft(menu.wrapper).toHaveAttribute('aria-hidden', 'false');
        await expect.soft(menu.items).toHaveText(MENU_ITEMS);
        // The 5 named links, not a snapshot of `items`, so a missing link fails instead of skipping its checks.
        for (const item of [menu.allItemsLink, menu.dynamicCatalogLink, menu.aboutLink, menu.logoutLink, menu.resetLink]) {
          await expect.soft(item).toBeVisible();
          // toBeVisible alone also passes on the closed, off-screen panel; the slid-in items are in the viewport.
          await expect.soft(item).toBeInViewport();
        }
        await expect.soft(menu.aboutLink).toHaveAttribute('href', ABOUT_URL);
      });

      await test.step('Close with the X button: closed, still on the inventory', async () => {
        // Hard guard: close() waits for aria-hidden="true".
        await menu.close();
        await expect.soft(menu.wrapper).toHaveAttribute('aria-hidden', 'true');
        await expect.soft(page).toHaveURL(routePattern(ROUTES.inventory));
      });
    },
  );
});
