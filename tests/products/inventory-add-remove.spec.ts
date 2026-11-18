import { test, expect } from '@fixtures/index';
import { PRODUCT_TEXT } from '@data/messages';
import { CATALOG_AZ, type ProductKey } from '@data/products';

// Spec: specs/02-products.md, scenario 1.6. Authenticated (default): starts logged in as standard_user, empty cart.
// The badge is asserted only as feedback for the toggle; CART (TC-CART-01) owns the count rules.

test.describe('Products', () => {
  test(
    'TC-PROD-06 Add/remove toggle on inventory page updates button and badge',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-PROD-10, AC-PROD-11' } },
    async ({ inventoryPage }) => {
      /**
       * Soft-checks every product's button (in cart: "Remove" only; otherwise: "Add to cart" only),
       * so a toggle never affects another product, plus the cart badge (0 = absent).
       */
      async function expectCartState(inCart: readonly ProductKey[]): Promise<void> {
        for (const key of CATALOG_AZ) {
          const [shown, hidden, label] = inCart.includes(key)
            ? [inventoryPage.removeButton(key), inventoryPage.addButton(key), PRODUCT_TEXT.remove]
            : [inventoryPage.addButton(key), inventoryPage.removeButton(key), PRODUCT_TEXT.addToCart];
          await expect.soft(shown).toHaveText(label);
          await expect.soft(hidden).toHaveCount(0);
        }
        await expect.soft(inventoryPage.header).toHaveCartBadge(inCart.length);
      }

      // addToCart / removeFromCart wait for the button to toggle: a failed toggle fails at once, with its cause.
      await test.step('A fresh context starts with an empty cart', async () => {
        await inventoryPage.goto();
        await expectCartState([]);
      });

      await test.step('Add Backpack', async () => {
        await inventoryPage.addToCart('backpack');
        await expectCartState(['backpack']);
      });

      await test.step('Add Bike Light', async () => {
        await inventoryPage.addToCart('bikeLight');
        await expectCartState(['backpack', 'bikeLight']);
      });

      await test.step('Remove Backpack', async () => {
        await inventoryPage.removeFromCart('backpack');
        await expectCartState(['bikeLight']);
      });

      await test.step('Remove Bike Light: the badge disappears', async () => {
        await inventoryPage.removeFromCart('bikeLight');
        await expectCartState([]);
      });

      // The slug "test.allthethings()-t-shirt-(red)" goes to getByTestId as an exact string (no CSS).
      await test.step('Add Red T-Shirt (slug with dots and parentheses)', async () => {
        await inventoryPage.addToCart('redTShirt');
        await expectCartState(['redTShirt']);
      });
    },
  );
});
