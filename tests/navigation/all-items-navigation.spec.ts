import { test, expect } from '@fixtures/index';
import { CUSTOMER } from '@data/checkout';
import { PAGE_TITLES } from '@data/messages';
import type { ProductKey } from '@data/products';
import { ROUTES, routePattern } from '@data/routes';

// Spec: specs/05-logout-navigation.md, scenario 1.6. Authenticated (default): starts logged in as standard_user, empty cart.
// One step per page of AC-NAV-04. Each step starts on the inventory (where the previous All Items landed)
// and reaches its page through the shop flow or page objects, whose waitForLoaded() is the hard URL guard.
// The complete page is included because AC-NAV-04 lists it; it runs last, since finishing empties the cart.

const ITEM: ProductKey = 'backpack'; // id 4: the details page is /inventory-item.html?id=4

test.describe('Logout & Navigation', () => {
  test(
    'TC-NAV-06 All Items returns to inventory from cart, details, and checkout pages',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-NAV-04' } },
    async ({
      page,
      shop,
      inventoryPage,
      productDetailsPage,
      cartPage,
      checkoutInfoPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      /** Clicks All Items from the current page and checks the inventory is shown. */
      const allItemsLandsOnInventory = async (): Promise<void> => {
        // Hard guard: goToAllItems() waits for the inventory URL, which the next step starts from.
        await inventoryPage.menu.goToAllItems();
        await expect.soft(page).toHaveURL(routePattern(ROUTES.inventory));
        await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory);
      };

      await test.step('From the cart', async () => {
        await shop.addAndOpenCart([ITEM]);
        await allItemsLandsOnInventory();
      });

      await test.step('From the product details page', async () => {
        await inventoryPage.openDetailsByName(ITEM);
        await productDetailsPage.waitForLoaded(ITEM);
        await allItemsLandsOnInventory();
      });

      await test.step('From checkout step one', async () => {
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await cartPage.checkout();
        await checkoutInfoPage.waitForLoaded();
        await allItemsLandsOnInventory();
      });

      await test.step('From checkout step two', async () => {
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await cartPage.checkout();
        await checkoutInfoPage.submit(CUSTOMER);
        await checkoutOverviewPage.waitForLoaded();
        await allItemsLandsOnInventory();
      });

      await test.step('From the checkout complete page', async () => {
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await cartPage.checkout();
        await checkoutInfoPage.submit(CUSTOMER);
        await checkoutOverviewPage.finish();
        await checkoutCompletePage.waitForLoaded();
        await allItemsLandsOnInventory();
      });
    },
  );
});
