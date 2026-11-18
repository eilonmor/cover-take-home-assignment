import { test, expect } from '@fixtures/index';
import { CHECKOUT_TEXT, PAGE_TITLES, PRODUCT_TEXT } from '@data/messages';
import { CATALOG_AZ, type ProductKey } from '@data/products';

// Spec: specs/04-checkout.md, scenario 1.6. Authenticated (default): starts logged in as standard_user, empty cart.
// After Finish the cart is emptied; Back Home returns to the inventory, where every product can be added again.

const ITEMS: readonly ProductKey[] = ['onesie'];

test.describe('Checkout', () => {
  test(
    'TC-CHK-06 Complete page, cart emptied and Back Home',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-CHK-15, AC-CHK-16, AC-CHK-17' } },
    async ({ shop, checkoutCompletePage, inventoryPage, cartPage }) => {
      await test.step('Place an order for the onesie: the confirmation page with an empty cart', async () => {
        // Hard guard: placeOrder waits for /checkout-complete.html and the confirmation header.
        await shop.placeOrder(ITEMS);
        await expect.soft(checkoutCompletePage.title).toHaveText(PAGE_TITLES.checkoutComplete);
        await expect.soft(checkoutCompletePage.completeHeader).toHaveText(CHECKOUT_TEXT.completeHeader);
        await expect.soft(checkoutCompletePage.completeText).toHaveText(CHECKOUT_TEXT.completeText);
        await expect.soft(checkoutCompletePage.ponyExpressImage).toBeVisible();
        await expect.soft(checkoutCompletePage.ponyExpressImage).toHaveAttribute('alt', CHECKOUT_TEXT.ponyAlt);
        await expect.soft(checkoutCompletePage.backHomeButton).toBeVisible();
        await expect.soft(checkoutCompletePage.backHomeButton).toHaveText(CHECKOUT_TEXT.backHome);
        await expect.soft(checkoutCompletePage.header).toHaveCartBadge(0);
      });

      await test.step('Back Home: the inventory, no badge, every product shows "Add to cart" again', async () => {
        // Hard guard: backHome waits for /inventory.html, then the product list renders.
        await checkoutCompletePage.backHome();
        await inventoryPage.waitForLoaded();
        await expect.soft(inventoryPage.header).toHaveCartBadge(0);
        // AC-CHK-16 is about every product, so the whole catalog is checked, not only the ordered one.
        for (const key of CATALOG_AZ) {
          await expect.soft(inventoryPage.addButton(key)).toHaveText(PRODUCT_TEXT.addToCart);
          await expect.soft(inventoryPage.removeButton(key)).toHaveCount(0);
        }
      });

      await test.step('Open the cart: it has no items', async () => {
        // Hard guard: openCart waits for /cart.html, then the cart renders, so rows come from the cart DOM.
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.list.items).toHaveCount(0);
      });
    },
  );
});
