import { test, expect } from '@fixtures/index';
import { CATALOG_AZ, PRODUCTS } from '@data/products';

// Spec: specs/03-cart.md, scenario 1.1. Authenticated (default): starts logged in as standard_user, empty cart.
// The spec's add order (backpack, bike light, bolt t-shirt, fleece jacket, onesie, red t-shirt) is the catalog A-Z order.

test.describe('Cart', () => {
  test(
    'TC-CART-01 Cart badge hidden when empty and matches item count',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-CART-01, AC-CART-02, AC-CART-03' } },
    async ({ inventoryPage, cartPage }) => {
      await test.step('A fresh session with an empty cart shows no badge', async () => {
        await inventoryPage.goto();
        await expect.soft(inventoryPage.header).toHaveCartBadge(0);
      });

      for (const [index, key] of CATALOG_AZ.entries()) {
        await test.step(`Add ${PRODUCTS[key].name}: the badge shows ${index + 1}`, async () => {
          // addToCart waits for the button to toggle, so a failed add fails here with its cause.
          await inventoryPage.addToCart(key);
          await expect.soft(inventoryPage.header).toHaveCartBadge(index + 1);
        });
      }

      await test.step('Open the cart: the badge still shows 6', async () => {
        // Hard guard: /cart.html and the cart page rendered.
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.header).toHaveCartBadge(CATALOG_AZ.length);
      });
    },
  );
});
