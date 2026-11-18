import { test, expect } from '@fixtures/index';
import type { ProductKey } from '@data/products';

// Spec: specs/03-cart.md, scenario 1.5. Authenticated (default): starts logged in as standard_user, empty cart.
// The cart lists items in add order, not catalog (A-Z) order, and an item added on its details page is appended last.

const FROM_INVENTORY: readonly ProductKey[] = ['fleeceJacket', 'backpack'];
/** Bike Light, id 0: first in the catalog, so appending it last proves add order. */
const FROM_DETAILS: ProductKey = 'bikeLight';
const EXPECTED_ORDER: readonly ProductKey[] = [...FROM_INVENTORY, FROM_DETAILS];

test.describe('Cart', () => {
  test(
    'TC-CART-05 Cart items appear in add order, including one added from the details page',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-CART-13, AC-CART-16' } },
    async ({ inventoryPage, productDetailsPage, cartPage }) => {
      await test.step('Add the fleece jacket, then the backpack, on the inventory page', async () => {
        await inventoryPage.goto();
        await inventoryPage.addToCart(...FROM_INVENTORY);
        await expect.soft(inventoryPage.header).toHaveCartBadge(FROM_INVENTORY.length);
      });

      await test.step('Add the bike light on its details page', async () => {
        // Hard guards: open() waits for the exact ?id=0 page; addToCart() waits for the button to turn into Remove.
        await productDetailsPage.open(FROM_DETAILS);
        await productDetailsPage.addToCart();
        await expect.soft(productDetailsPage.header).toHaveCartBadge(EXPECTED_ORDER.length);
      });

      await test.step('Open the cart: rows in add order, with their prices', async () => {
        // Hard guard: /cart.html rendered. toShowProducts compares names and prices in exact order.
        await productDetailsPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.list).toShowProducts(EXPECTED_ORDER);
      });
    },
  );
});
