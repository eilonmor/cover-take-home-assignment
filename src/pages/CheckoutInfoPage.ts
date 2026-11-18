import { expect, type Locator, type Page } from '@playwright/test';
import type { CheckoutInfo } from '../data/checkout';
import { ROUTES, routePattern } from '../data/routes';
import { AppPage } from './AppPage';

/** Total budget for filling one input, retries included (see `fillField`). */
const FILL_TIMEOUT = 5_000;

/** Page object for checkout step one, "Your Information" (`/checkout-step-one.html`). */
export class CheckoutInfoPage extends AppPage {
  /**
   * Class pattern of an input in the red error state. It matches the exact `error` class token
   * only: the `input_error` class is always on the inputs, with or without an error, so it is not
   * a signal (observed live).
   */
  readonly inputErrorClass = /(?:^|\s)error(?:\s|$)/;

  readonly path = ROUTES.checkoutInfo;

  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  /** The validation error; only present after a failed Continue. */
  readonly error: Locator;
  /** The X button that dismisses the error. */
  readonly errorButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.error = page.getByTestId('error');
    this.errorButton = page.getByTestId('error-button');
  }

  /** Waits for the step one URL and the first name input. */
  async waitForLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(this.path));
    await expect(this.firstName).toBeVisible();
  }

  /** Fills each given field; an empty string clears it, a missing one is left untouched. */
  async fill(info: Partial<CheckoutInfo>): Promise<void> {
    await this.fillField(this.firstName, info.firstName);
    await this.fillField(this.lastName, info.lastName);
    await this.fillField(this.postalCode, info.postalCode);
  }

  /**
   * Fills one input and confirms it holds the value. Right after the cart -> step one swap the app
   * itself calls blur() on the just-focused input (observed on WebKit, ~10 ms after focus). Playwright's
   * fill() is focus -> insert text, so when that blur lands in between, the text is silently dropped
   * and the field stays empty. The fill and its confirmation are therefore retried as one unit,
   * which only ever repeats in that rare window (the blur happens once). The retry is bounded, so an
   * input that never keeps its value (problem_user's last name, spec 04 §6) fails here fast and clearly.
   */
  private async fillField(input: Locator, value: string | undefined): Promise<void> {
    if (value === undefined) {
      return;
    }
    await expect(async () => {
      await input.fill(value);
      await expect(input).toHaveValue(value, { timeout: 1_000 });
    }).toPass({ timeout: FILL_TIMEOUT });
  }

  /** Clicks Continue without waiting for a navigation (validation may keep the page). */
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /** Fills the form, clicks Continue and waits for the step two URL. */
  async submit(info: CheckoutInfo): Promise<void> {
    await this.fill(info);
    await this.continue();
    await expect(this.page).toHaveURL(routePattern(ROUTES.checkoutOverview));
  }

  /** Clicks Cancel and waits for the cart URL. */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.cart));
  }

  /** Clicks the X button on the error message. */
  async dismissError(): Promise<void> {
    await this.errorButton.click();
  }
}
