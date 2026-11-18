import { test, expect } from '@fixtures/index';
import { CART_TEXT } from '@data/messages';
import type { ProductKey } from '@data/products';
import { recordNavigations } from '@utils/navigation';

// Spec: specs/03-cart.md, scenario 1.3. Authenticated (default): starts logged in as standard_user, empty cart.
// Only the inventory buttons the Cart ACs need are checked (AC-CART-08); PROD owns the toggle itself.

const ADDED: readonly ProductKey[] = ['backpack', 'bikeLight', 'onesie'];
const REMOVED_FIRST: ProductKey = 'bikeLight';
const REMAINING: readonly ProductKey[] = ['backpack', 'onesie'];

test.describe('Cart', () => {
  test(
    'TC-CART-03 Removing from the cart page updates rows, badge and inventory state',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-CART-07, AC-CART-08, AC-CART-03' } },
    async ({ page, shop, cartPage, inventoryPage }) => {
      await test.step('Add the backpack, bike light and onesie, then open the cart', async () => {
        await shop.addAndOpenCart(ADDED);
        await expect.soft(cartPage.list).toShowProducts(ADDED);
        await expect.soft(cartPage.header).toHaveCartBadge(ADDED.length);
      });

      await test.step('Remove the bike light: its row disappears without a reload, the others stay', async () => {
        // remove() waits for the row to disappear, so a failed removal fails here. A reload or any
        // other main-frame navigation during the removal is recorded and fails the "in place" check.
        const navigations = await recordNavigations(page, () => cartPage.remove(REMOVED_FIRST));
        expect.soft(navigations, 'main-frame navigations during the removal').toEqual([]);
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
        // Scenario 1.3 step 4: the headers and buttons stay on the empty cart. toHaveText also passes
        // on hidden elements, so visibility is asserted on its own.
        for (const [locator, text] of [
          [cartPage.quantityLabel, CART_TEXT.quantityLabel],
          [cartPage.descriptionLabel, CART_TEXT.descriptionLabel],
          [cartPage.continueShoppingButton, CART_TEXT.continueShopping],
          [cartPage.checkoutButton, CART_TEXT.checkout],
        ] as const) {
          await expect.soft(locator).toBeVisible();
          await expect.soft(locator).toHaveText(text);
        }
      });
    },
  );
});
