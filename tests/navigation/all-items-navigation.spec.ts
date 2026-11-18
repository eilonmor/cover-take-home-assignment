import { test, expect } from '@fixtures/index';
import { PAGE_TITLES } from '@data/messages';
import type { ProductKey } from '@data/products';
import { clearCart } from '@utils/storage';

// Spec: specs/05-logout-navigation.md, scenario 1.6. Authenticated (default): starts logged in as standard_user, empty cart.
// One step per page of AC-NAV-04. Each step starts on the inventory (where the previous All Items landed), the
// checkout steps from an empty cart, and reaches its page through the shop flow or page objects, whose
// readiness waits are the hard guards. The complete page is included because AC-NAV-04 lists it.

const ITEM: ProductKey = 'backpack'; // id 4: the details page is /inventory-item.html?id=4

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-06 All Items returns to inventory from cart, details, and checkout pages',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-NAV-04' } },
    async ({ page, shop, inventoryPage, productDetailsPage, checkoutInfoPage, checkoutOverviewPage }) => {
      /**
       * Empties the cart left by the previous step, so the shop flow can add the item again. Each step ends on
       * the inventory (the app origin clearCart needs), and the shop flow's own goto() makes the UI see it.
       */
      const freshCart = async (): Promise<void> => {
        await clearCart(page);
      };

      /** Clicks All Items from the current page and checks the inventory is shown. */
      const allItemsLandsOnInventory = async (): Promise<void> => {
        await inventoryPage.menu.goToAllItems();
        // Hard guard: the URL changes before the DOM swaps, so wait for the product list itself.
        await inventoryPage.waitForLoaded();
        await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory);
      };

      await test.step('From the cart', async () => {
        // The test starts with an empty cart.
        await shop.addAndOpenCart([ITEM]);
        await allItemsLandsOnInventory();
      });

      await test.step('From the product details page', async () => {
        // Opening the details does not depend on the cart; the step starts on the inventory.
        await inventoryPage.openDetailsByName(ITEM);
        await productDetailsPage.waitForLoaded(ITEM);
        await allItemsLandsOnInventory();
      });

      await test.step('From checkout step one', async () => {
        await freshCart();
        await shop.startCheckout([ITEM]);
        await expect.soft(checkoutInfoPage.title).toHaveText(PAGE_TITLES.checkoutInfo);
        await allItemsLandsOnInventory();
      });

      await test.step('From checkout step two', async () => {
        await freshCart();
        await shop.reachOverview([ITEM]);
        await expect.soft(checkoutOverviewPage.title).toHaveText(PAGE_TITLES.checkoutOverview);
        await allItemsLandsOnInventory();
      });

      await test.step('From the checkout complete page', async () => {
        await freshCart();
        await shop.placeOrder([ITEM]);
        await allItemsLandsOnInventory();
      });
    },
  );
});
