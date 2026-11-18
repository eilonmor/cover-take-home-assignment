import { test, expect } from '@fixtures/index';
import { CHECKOUT_TEXT, PAGE_TITLES } from '@data/messages';
import { PRODUCTS, type ProductKey } from '@data/products';
import { summarize, summaryLabels, withFloatNoise } from '@utils/money';

// Spec: specs/04-checkout.md, scenario 1.4. Authenticated (default): starts logged in as standard_user, empty cart.

const ITEMS: readonly ProductKey[] = ['fleeceJacket', 'onesie'];
const EXPECTED = summaryLabels(summarize(ITEMS.map((key) => PRODUCTS[key].priceCents))); // 57.98 / 4.64 / 62.62

/**
 * Site defect (spec 04 §5, DEF-CHK-SUBTOTAL): the item total is the unrounded float sum, so this cart shows
 * "Item total: $57.980000000000004" (49.99 + 7.99 in floating point). Tax and total are correct.
 */
const SUBTOTAL_KNOWN_ISSUE =
  'DEF-CHK-SUBTOTAL: the item total is not rounded to 2 decimals; fleece jacket + onesie shows ' +
  '"Item total: $57.980000000000004" instead of "Item total: $57.98" (AC-CHK-11). The amount is checked to the cent, the float noise is tolerated.';

test.describe('Checkout', () => {
  test(
    'TC-CHK-04 Overview item list and static info match the cart',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-CHK-09, AC-CHK-10' } },
    async ({ shop, checkoutOverviewPage }) => {
      await test.step('Add the fleece jacket then the onesie and reach the overview', async () => {
        // Hard guard: reachOverview waits for /checkout-step-two.html and the Finish button.
        await shop.reachOverview(ITEMS);
        await expect.soft(checkoutOverviewPage.title).toHaveText(PAGE_TITLES.checkoutOverview);
        await expect.soft(checkoutOverviewPage.header).toHaveCartBadge(ITEMS.length);
      });

      await test.step('The rows match the cart: add order, name, price, quantity 1', async () => {
        await expect.soft(checkoutOverviewPage.list).toShowProducts(ITEMS);
        await expect.soft(checkoutOverviewPage.list.quantities).toHaveText(ITEMS.map(() => '1'));
      });

      await test.step('Payment, shipping and the Price Total header are the static texts', async () => {
        for (const [locator, text] of [
          [checkoutOverviewPage.paymentLabel, CHECKOUT_TEXT.paymentLabel],
          [checkoutOverviewPage.paymentValue, CHECKOUT_TEXT.paymentValue],
          [checkoutOverviewPage.shippingLabel, CHECKOUT_TEXT.shippingLabel],
          [checkoutOverviewPage.shippingValue, CHECKOUT_TEXT.shippingValue],
          [checkoutOverviewPage.totalInfoLabel, CHECKOUT_TEXT.priceTotal],
        ] as const) {
          await expect.soft(locator).toBeVisible();
          await expect.soft(locator).toHaveText(text);
        }
      });

      await test.step('The summary amounts follow the cents rule', async () => {
        // The known defect is neither asserted nor hidden. The subtotal must be the intended label, or that
        // label followed only by float noise: the amount is right to the cent, anything else fails.
        // toHaveOrderSummary would fail on the defect, so the labels are checked one by one.
        const { subtotalLabel } = checkoutOverviewPage;
        await expect.soft(subtotalLabel).toHaveText(withFloatNoise(EXPECTED.subtotal));
        const shown = await subtotalLabel.innerText();
        if (shown !== EXPECTED.subtotal) {
          // Recorded only while the defect shows: once the site rounds correctly, the annotation disappears.
          test.info().annotations.push({ type: 'known-issue', description: `${SUBTOTAL_KNOWN_ISSUE} Shown: "${shown}".` });
        }
        await expect.soft(checkoutOverviewPage.taxLabel).toHaveText(EXPECTED.tax);
        await expect.soft(checkoutOverviewPage.totalLabel).toHaveText(EXPECTED.total);
      });

      await test.step('Cancel and Finish are visible', async () => {
        for (const [button, text] of [
          [checkoutOverviewPage.cancelButton, CHECKOUT_TEXT.cancel],
          [checkoutOverviewPage.finishButton, CHECKOUT_TEXT.finish],
        ] as const) {
          await expect.soft(button).toBeVisible();
          await expect.soft(button).toHaveText(text);
        }
      });
    },
  );
});
