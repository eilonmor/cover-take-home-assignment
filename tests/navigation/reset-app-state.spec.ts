import { test, expect } from '@fixtures/index';
import type { ProductKey } from '@data/products';
import { ROUTES, routePattern } from '@data/routes';
import { readCartIds } from '@utils/storage';

// Spec: specs/05-logout-navigation.md, scenario 1.4. Authenticated (default): starts logged in as standard_user, empty cart.

const ADDED: readonly ProductKey[] = ['backpack', 'bikeLight'];

/** Spec 05 §6, D1: the buttons are not asserted before the reload, only documented. */
const D1_KNOWN_ISSUE = 'D1: Reset App State leaves "Remove" buttons until reload';

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-04 Reset App State clears the cart and badge; buttons revert after reload',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-NAV-09, AC-NAV-10' } },
    async ({ page, inventoryPage }) => {
      await test.step('Add the backpack and the bike light: the badge shows 2', async () => {
        await inventoryPage.goto();
        await inventoryPage.addToCart(...ADDED);
        // Hard guard: the reset below must start from a cart that really has both items.
        await expect(inventoryPage.header).toHaveCartBadge(ADDED.length);
      });

      await test.step('Reset App State: no badge, empty cart storage, still on the inventory', async () => {
        await inventoryPage.menu.resetAppState();
        await expect.soft(inventoryPage.header).toHaveCartBadge(0);
        // readCartIds returns [] for a missing key, so both "removed" and "[]" count as empty.
        await expect.soft.poll(async () => readCartIds(page), { message: 'cart storage after reset' }).toEqual([]);
        await expect.soft(page).toHaveURL(routePattern(ROUTES.inventory));
        // D1 is a known site bug, never an acceptance criterion: the "Remove" buttons are not checked here.
        test.info().annotations.push({ type: 'known-issue', description: D1_KNOWN_ISSUE });
      });

      await test.step('Reload: every button reads "Add to cart" and there is still no badge', async () => {
        await page.reload();
        // Hard guard: the list is rendered, so the "no Remove buttons" count below is not vacuous.
        await inventoryPage.waitForLoaded();
        for (const key of ADDED) {
          await expect.soft(inventoryPage.addButton(key)).toBeVisible();
        }
        await expect.soft(inventoryPage.removeButtons).toHaveCount(0);
        await expect.soft(inventoryPage.header).toHaveCartBadge(0);
      });
    },
  );
});
