import { test, expect } from '@fixtures/index';
import type { ProductKey } from '@data/products';

// Spec: specs/03-cart.md, scenario 1.4. Authenticated (default): starts logged in as standard_user, empty cart.
// The cart lives in localStorage, so it must survive a reload and cart → inventory → details → cart navigation.

const ADDED: readonly ProductKey[] = ['fleeceJacket', 'onesie'];
const OPENED: ProductKey = 'fleeceJacket';

test.describe('Cart', () => {
  test(
    'TC-CART-04 Continue Shopping and reload preserve the cart',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-CART-10, AC-CART-14' } },
    async ({ page, shop, cartPage, inventoryPage, productDetailsPage }) => {
      await test.step('Add the fleece jacket and the onesie, then open the cart', async () => {
        await shop.addAndOpenCart(ADDED);
        await expect.soft(cartPage.list).toShowProducts(ADDED);
        await expect.soft(cartPage.header).toHaveCartBadge(ADDED.length);
      });

      await test.step('Reload the cart: same rows in the same order, same badge', async () => {
        await page.reload();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.list).toShowProducts(ADDED);
        await expect.soft(cartPage.header).toHaveCartBadge(ADDED.length);
      });

      await test.step('Continue Shopping: the badge and the Remove buttons are unchanged', async () => {
        // Hard guard: back on /inventory.html with the list rendered.
        await cartPage.continueShopping();
        await inventoryPage.waitForLoaded();
        await expect.soft(inventoryPage.header).toHaveCartBadge(ADDED.length);
        // Only what AC-CART-10 needs; the add/remove toggle itself is PROD's (TC-PROD-06).
        for (const key of ADDED) {
          await expect.soft(inventoryPage.removeButton(key)).toBeVisible();
        }
      });

      await test.step('Details, back to products, cart: still the same rows and badge', async () => {
        // Hard guards on every navigation: the exact details URL, then the inventory, then the cart.
        await inventoryPage.openDetailsByName(OPENED);
        await productDetailsPage.waitForLoaded(OPENED);
        await expect.soft(productDetailsPage.removeButton).toBeVisible();
        await productDetailsPage.backToProducts();
        await inventoryPage.waitForLoaded();
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.list).toShowProducts(ADDED);
        await expect.soft(cartPage.header).toHaveCartBadge(ADDED.length);
      });
    },
  );
});
