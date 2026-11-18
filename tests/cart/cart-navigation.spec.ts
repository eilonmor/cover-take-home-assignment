import { test, expect } from '@fixtures/index';
import { PRODUCTS, type ProductKey } from '@data/products';

// Spec: specs/03-cart.md, scenario 1.6. Authenticated (default): starts logged in as standard_user, empty cart.
// Checkout step one is asserted by URL only; its form belongs to the Checkout spec.

const ITEM: ProductKey = 'backpack';

test.describe('Cart', () => {
  test(
    'TC-CART-06 Checkout button goes to checkout step one and item name opens details',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-CART-11, AC-CART-15' } },
    async ({ shop, cartPage, productDetailsPage }) => {
      await test.step('Add the backpack and open the cart', async () => {
        await shop.addAndOpenCart([ITEM]);
        await expect.soft(cartPage.list).toShowProducts([ITEM]);
      });

      await test.step('Click the item name: its details page opens with a Remove button', async () => {
        // Hard guard: openItem() and waitForLoaded(key) wait for the exact ?id=4 page.
        await cartPage.openItem(ITEM);
        await productDetailsPage.waitForLoaded(ITEM);
        await expect.soft(productDetailsPage.name).toHaveText(PRODUCTS[ITEM].name);
        await expect.soft(productDetailsPage.removeButton).toBeVisible();
      });

      await test.step('Open the cart again and click Checkout: checkout step one opens', async () => {
        await productDetailsPage.header.openCart();
        await cartPage.waitForLoaded();
        // checkout() asserts the /checkout-step-one.html URL (hard); the form is the Checkout spec's.
        await cartPage.checkout();
      });
    },
  );
});
