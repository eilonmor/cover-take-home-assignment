import { test, expect } from '@fixtures/index';
import { CHECKOUT_CARTS, observedLabels } from '@data/checkout';
import { PRODUCTS } from '@data/products';
import { runGroupedCases } from '@utils/grouped';
import { summarize } from '@utils/money';
import { clearCart } from '@utils/storage';

// Spec: specs/04-checkout.md, scenario 1.3. Grouped: one isolated step per cart of CHECKOUT_CARTS (10 carts).
// Authenticated (default): the session is shared by all cases; only the cart is reset, through clearCart.
// runGroupedCases sizes the test timeout for all 10 carts, so there is no test.slow().

test.describe('Checkout', () => {
  test(
    'TC-CHK-03 Tax and total are calculated correctly for every cart combination',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-CHK-11, AC-CHK-12, AC-CHK-13' } },
    async ({ page, inventoryPage, shop, checkoutOverviewPage }) => {
      await runGroupedCases(CHECKOUT_CARTS, {
        run: async (cart) => {
          // Fresh state: clearCart needs the app origin, and the UI only sees the change after a navigation.
          await inventoryPage.goto();
          await clearCart(page);
          await inventoryPage.goto();
          await expect.soft(inventoryPage.header).toHaveCartBadge(0);

          // Hard guard: reachOverview waits for /checkout-step-two.html and the Finish button.
          await shop.reachOverview(cart.items);

          // 1. The exact strings observed live (spec 04 §4 table).
          const observed = observedLabels(cart);
          await expect.soft(checkoutOverviewPage.subtotalLabel).toHaveText(observed.subtotal);
          await expect.soft(checkoutOverviewPage.taxLabel).toHaveText(observed.tax);
          await expect.soft(checkoutOverviewPage.totalLabel).toHaveText(observed.total);

          // 2. Independently, the rule: sum of catalog prices, 8% tax rounded to the cent, total = sum + tax,
          // all in integer cents.
          await expect
            .soft(checkoutOverviewPage)
            .toHaveOrderSummary(summarize(cart.items.map((key) => PRODUCTS[key].priceCents)));
        },
      });
    },
  );
});
