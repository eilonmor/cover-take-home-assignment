import { test, expect } from '@fixtures/index';
import { CUSTOMER } from '@data/checkout';
import { CHECKOUT_ERRORS } from '@data/messages';
import { ROUTES, routePattern } from '@data/routes';

// Spec: specs/04-checkout.md, scenario 1.2. Authenticated (default): starts logged in as standard_user, empty cart.
// Observed live: while an error is shown, all three inputs carry the `error` class (filled ones too);
// dismissing removes only that class. `input_error` is always present, so it is not a signal.

test.describe('Checkout', () => {
  test(
    'TC-CHK-02 Step one required-field validation order, texts and dismiss',
    {
      tag: ['@smoke', '@regression'],
      annotation: { type: 'covers', description: 'AC-CHK-02, AC-CHK-03, AC-CHK-04, AC-CHK-05' },
    },
    async ({ page, shop, checkoutInfoPage }) => {
      const inputs = [checkoutInfoPage.firstName, checkoutInfoPage.lastName, checkoutInfoPage.postalCode];

      /**
       * Clicks Continue and checks that validation kept the user on step one with this error.
       * Hard guards: the error appears (validation ran) and the URL is still step one.
       */
      const continueExpectingError = async (expected: string): Promise<void> => {
        await checkoutInfoPage.continue();
        await expect(checkoutInfoPage.error).toBeVisible();
        await expect(page).toHaveURL(routePattern(ROUTES.checkoutInfo));
        await expect.soft(checkoutInfoPage.error).toHaveText(expected);
      };

      await test.step('Add the backpack and check out: step one opens', async () => {
        // Hard guard: startCheckout waits for /checkout-step-one.html and the form.
        await shop.startCheckout(['backpack']);
      });

      await test.step('Continue with all fields empty: first name is required', async () => {
        await continueExpectingError(CHECKOUT_ERRORS.firstName);
        for (const input of inputs) {
          await expect.soft(input).toHaveClass(checkoutInfoPage.inputErrorClass);
        }
      });

      await test.step('Fill the first name and continue: last name is required', async () => {
        await checkoutInfoPage.fill({ firstName: CUSTOMER.firstName });
        await continueExpectingError(CHECKOUT_ERRORS.lastName);
      });

      await test.step('Fill the last name and continue: postal code is required', async () => {
        await checkoutInfoPage.fill({ lastName: CUSTOMER.lastName });
        await continueExpectingError(CHECKOUT_ERRORS.postalCode);
      });

      await test.step('Dismiss the error: message and red styling go, the typed values stay', async () => {
        await checkoutInfoPage.dismissError();
        await expect.soft(checkoutInfoPage.error).toHaveCount(0);
        await expect.soft(checkoutInfoPage.errorButton).toHaveCount(0);
        for (const input of inputs) {
          await expect.soft(input).not.toHaveClass(checkoutInfoPage.inputErrorClass);
        }
        await expect.soft(checkoutInfoPage.firstName).toHaveValue(CUSTOMER.firstName);
        await expect.soft(checkoutInfoPage.lastName).toHaveValue(CUSTOMER.lastName);
      });

      await test.step('Clear the first name, fill the postal code, continue: first name is validated first', async () => {
        await checkoutInfoPage.fill({ firstName: '', postalCode: CUSTOMER.postalCode });
        await continueExpectingError(CHECKOUT_ERRORS.firstName);
      });
    },
  );
});
