import { test, expect } from '@fixtures/index';
import { CUSTOMER } from '@data/checkout';
import type { ProductKey } from '@data/products';

// Spec: specs/04-checkout.md, scenario 1.5. Authenticated (default): starts logged in as standard_user, empty cart.
// Cancel on step one returns to the cart; cancel on step two returns to the inventory (not the cart).
// Neither cancel clears the cart.

const ITEMS: readonly ProductKey[] = ['backpack', 'bikeLight'];

test.describe('Checkout', () => {
  test(
    'TC-CHK-05 Cancel on step one and step two keeps the cart',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-CHK-08, AC-CHK-14' } },
    async ({ shop, cartPage, checkoutInfoPage, checkoutOverviewPage, inventoryPage }) => {
      await test.step('Add the backpack and the bike light, open the cart, click checkout: step one opens', async () => {
        // Hard guard: startCheckout waits for /checkout-step-one.html and the form.
        await shop.startCheckout(ITEMS);
      });

      await test.step('Cancel on step one: back in the cart with both items and badge 2', async () => {
        // Hard guard: cancel waits for /cart.html (AC-CHK-08), then the cart renders.
        await checkoutInfoPage.cancel();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.list).toShowProducts(ITEMS);
        await expect.soft(cartPage.header).toHaveCartBadge(ITEMS.length);
      });

      await test.step('Checkout, fill the form, continue, cancel on step two: the inventory, cart intact', async () => {
        // Hard guards: checkout waits for step one, submit for step two.
        await cartPage.checkout();
        await checkoutInfoPage.submit(CUSTOMER);
        await checkoutOverviewPage.waitForLoaded();
        // Hard guard: cancel waits for /inventory.html, not the cart (AC-CHK-14).
        await checkoutOverviewPage.cancel();
        await inventoryPage.waitForLoaded();
        await expect.soft(inventoryPage.header).toHaveCartBadge(ITEMS.length);
        for (const key of ITEMS) {
          await expect.soft(inventoryPage.removeButton(key)).toBeVisible();
        }
      });

      await test.step('Open the cart: it still lists both items', async () => {
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.list).toShowProducts(ITEMS);
      });
    },
  );
});
