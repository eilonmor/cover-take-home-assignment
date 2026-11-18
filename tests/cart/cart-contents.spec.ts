import { test, expect } from '@fixtures/index';
import { CART_TEXT, PAGE_TITLES, PRODUCT_TEXT } from '@data/messages';
import { PRODUCTS, type ProductKey } from '@data/products';

// Spec: specs/03-cart.md, scenario 1.2. Authenticated (default): starts logged in as standard_user, empty cart.
// "The inventory values" are the PRODUCTS catalog: TC-PROD-01 asserts the inventory shows exactly those values.

const ADDED: readonly ProductKey[] = ['backpack', 'bikeLight'];

test.describe('Cart', () => {
  test(
    'TC-CART-02 Cart page lists items with correct quantity, name, description and price',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-CART-04, AC-CART-05, AC-CART-06' } },
    async ({ inventoryPage, cartPage }) => {
      await test.step('Add the backpack and the bike light', async () => {
        await inventoryPage.goto();
        await inventoryPage.addToCart(...ADDED);
        await expect.soft(inventoryPage.header).toHaveCartBadge(ADDED.length);
      });

      await test.step('Open the cart: title, column headers and buttons', async () => {
        // Hard guard: /cart.html and the cart page rendered, so rows are read from the cart DOM.
        await inventoryPage.header.openCart();
        await cartPage.waitForLoaded();
        await expect.soft(cartPage.title).toHaveText(PAGE_TITLES.cart);
        await expect.soft(cartPage.quantityLabel).toHaveText(CART_TEXT.quantityLabel);
        await expect.soft(cartPage.descriptionLabel).toHaveText(CART_TEXT.descriptionLabel);
        await expect.soft(cartPage.continueShoppingButton).toBeVisible();
        await expect.soft(cartPage.checkoutButton).toBeVisible();
      });

      await test.step('One row per product, in add order, with catalog data and quantity 1', async () => {
        await expect.soft(cartPage.list).toShowProducts(ADDED);
        await expect.soft(cartPage.list.quantities).toHaveText(ADDED.map(() => '1'));
        await expect.soft(cartPage.list.descriptions).toHaveText(ADDED.map((key) => PRODUCTS[key].description));
      });

      await test.step('Each row has a Remove button and no quantity input', async () => {
        for (const key of ADDED) {
          await expect.soft(cartPage.removeButton(key)).toHaveText(PRODUCT_TEXT.remove);
          await expect.soft(cartPage.quantityInputs(key)).toHaveCount(0);
        }
      });
    },
  );
});
