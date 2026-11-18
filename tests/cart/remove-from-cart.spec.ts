import { test, expect } from '@fixtures/index';
import { CART_TEXT } from '@data/messages';
import type { ProductKey } from '@data/products';

// Spec: specs/03-cart.md, scenario 1.3. Authenticated (default): starts logged in as standard_user, empty cart.
// Only the inventory buttons the Cart ACs need are checked (AC-CART-08); PROD owns the toggle itself.

const ADDED: readonly ProductKey[] = ['backpack', 'bikeLight', 'onesie'];
const REMOVED_FIRST: ProductKey = 'bikeLight';
const REMAINING: readonly ProductKey[] = ['backpack', 'onesie'];

test.describe('Cart', () => {
  test(
    'TC-CART-03 Removing from the cart page updates rows, badge and inventory state',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-CART-07, AC-CART-08, AC-CART-03' } },
    async ({ shop, cartPage, inventoryPage }) => {
      await test.step('Add the backpack, bike light and onesie, then open the cart', async () => {
        await shop.addAndOpenCart(ADDED);
        await expect.soft(cartPage.list).toShowProducts(ADDED);
        await expect.soft(cartPage.header).toHaveCartBadge(ADDED.length);
      });

      await test.step('Remove the bike light: its row disappears, the others stay', async () => {
        // remove() waits for the row to disappear (no reload), so a failed removal fails here.
        await cartPage.remove(REMOVED_FIRST);
        await expect.soft(cartPage.list).toShowProducts(REMAINING);
        await expect.soft(cartPage.header).toHaveCartBadge(REMAINING.length);
      });

      await test.step('Continue Shopping: the inventory buttons reflect the cart', async () => {
        // Hard guard: back on /inventory.html with the list rendered.
        await cartPage.continueShopping();
        await inventoryPage.waitForLoaded();
        await expect.soft(inventoryPage.addButton(REMOVED_FIRST)).toBeVisible();
        for (const key of REMAINING) {
          await expect.soft(inventoryPage.removeButton(key)).toBeVisible();
        }
      });

      await test.step('Remove the remaining items: no rows, no badge, headers and buttons stay', async () => {
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await cartPage.remove(...REMAINING);
        await expect.soft(cartPage.list.items).toHaveCount(0);
        await expect.soft(cartPage.header).toHaveCartBadge(0);
        await expect.soft(cartPage.quantityLabel).toHaveText(CART_TEXT.quantityLabel);
        await expect.soft(cartPage.descriptionLabel).toHaveText(CART_TEXT.descriptionLabel);
        await expect.soft(cartPage.continueShoppingButton).toBeVisible();
        await expect.soft(cartPage.checkoutButton).toBeVisible();
      });
    },
  );
});
