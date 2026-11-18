import { test, expect } from '@fixtures/index';
import { checkoutCart, CUSTOMER, observedLabels } from '@data/checkout';
import { CHECKOUT_FORM, CHECKOUT_TEXT, PAGE_TITLES } from '@data/messages';
import { PRODUCTS, type ProductKey } from '@data/products';
import { summarize } from '@utils/money';

// Spec: specs/04-checkout.md, scenario 1.1. Authenticated (default): starts logged in as standard_user, empty cart.
// The summary is checked twice: against the cents rule (summarize) and against the exact labels observed live.

const ITEMS: readonly ProductKey[] = ['backpack', 'bikeLight'];

test.describe('Checkout', () => {
  test(
    'TC-CHK-01 End-to-end happy path with two items',
    {
      tag: ['@smoke'],
      annotation: {
        type: 'covers',
        description: 'AC-CHK-01, AC-CHK-07, AC-CHK-09, AC-CHK-10, AC-CHK-11, AC-CHK-12, AC-CHK-13, AC-CHK-15',
      },
    },
    async ({ shop, checkoutInfoPage, checkoutOverviewPage, checkoutCompletePage }) => {
      // Resolved here, not at module load, so a data mismatch fails this test instead of the file's collection.
      const observed = observedLabels(checkoutCart(ITEMS)); // "Item total: $39.98", "Tax: $3.20", "Total: $43.18"

      await test.step('Add the backpack and the bike light, then check out: an empty step one form', async () => {
        // Hard guard: startCheckout waits for /checkout-step-one.html and the form.
        await shop.startCheckout(ITEMS);
        await expect.soft(checkoutInfoPage.title).toHaveText(PAGE_TITLES.checkoutInfo);
        for (const [input, placeholder] of [
          [checkoutInfoPage.firstName, CHECKOUT_FORM.firstNamePlaceholder],
          [checkoutInfoPage.lastName, CHECKOUT_FORM.lastNamePlaceholder],
          [checkoutInfoPage.postalCode, CHECKOUT_FORM.postalCodePlaceholder],
        ] as const) {
          await expect.soft(input).toBeVisible();
          await expect.soft(input).toHaveValue('');
          await expect.soft(input).toHaveAttribute('placeholder', placeholder);
        }
        await expect.soft(checkoutInfoPage.continueButton).toHaveValue(CHECKOUT_FORM.continueLabel);
        await expect.soft(checkoutInfoPage.cancelButton).toBeVisible();
        await expect.soft(checkoutInfoPage.cancelButton).toHaveText(CHECKOUT_TEXT.cancel);
        await expect.soft(checkoutInfoPage.error).toHaveCount(0);
      });

      await test.step('Submit the customer information: the overview opens', async () => {
        // Hard guard: submit waits for /checkout-step-two.html.
        await checkoutInfoPage.submit(CUSTOMER);
        await checkoutOverviewPage.waitForLoaded();
        await expect.soft(checkoutOverviewPage.title).toHaveText(PAGE_TITLES.checkoutOverview);
      });

      await test.step('The overview lists both items with quantity 1, the static info and the summary', async () => {
        await expect.soft(checkoutOverviewPage.list).toShowProducts(ITEMS);
        await expect.soft(checkoutOverviewPage.list.quantities).toHaveText(ITEMS.map(() => '1'));
        await expect.soft(checkoutOverviewPage.header).toHaveCartBadge(ITEMS.length);
        await expect.soft(checkoutOverviewPage.paymentValue).toHaveText(CHECKOUT_TEXT.paymentValue);
        await expect.soft(checkoutOverviewPage.shippingValue).toHaveText(CHECKOUT_TEXT.shippingValue);
        await expect.soft(checkoutOverviewPage.totalInfoLabel).toHaveText(CHECKOUT_TEXT.priceTotal);
        // The rule: sum of the catalog prices, 8% tax rounded to the cent, total = sum + tax (integer cents).
        await expect.soft(checkoutOverviewPage).toHaveOrderSummary(summarize(ITEMS.map((key) => PRODUCTS[key].priceCents)));
        // The exact strings observed live (spec 04 §4 table).
        await expect.soft(checkoutOverviewPage.subtotalLabel).toHaveText(observed.subtotal);
        await expect.soft(checkoutOverviewPage.taxLabel).toHaveText(observed.tax);
        await expect.soft(checkoutOverviewPage.totalLabel).toHaveText(observed.total);
      });

      await test.step('Finish: the confirmation page with an empty cart', async () => {
        // Hard guard: finish waits for /checkout-complete.html, then the confirmation header.
        await checkoutOverviewPage.finish();
        await checkoutCompletePage.waitForLoaded();
        await expect.soft(checkoutCompletePage.title).toHaveText(PAGE_TITLES.checkoutComplete);
        await expect.soft(checkoutCompletePage.completeHeader).toHaveText(CHECKOUT_TEXT.completeHeader);
        await expect.soft(checkoutCompletePage.completeText).toHaveText(CHECKOUT_TEXT.completeText);
        await expect.soft(checkoutCompletePage.ponyExpressImage).toBeVisible();
        await expect.soft(checkoutCompletePage.ponyExpressImage).toHaveAttribute('alt', CHECKOUT_TEXT.ponyAlt);
        await expect.soft(checkoutCompletePage.header).toHaveCartBadge(0);
      });
    },
  );
});
