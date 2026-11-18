import { expect, type Locator, type Page } from '@playwright/test';
import type { CheckoutInfo } from '../data/checkout';
import { ROUTES, routePattern } from '../data/routes';
import { AppPage } from './AppPage';

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
   * Fills one input, and fills it once more if the value did not stick.
   *
   * Right after the cart -> step one swap the app itself calls blur() on the just-focused input, once
   * (observed on WebKit, ~1-10 ms after focus). Playwright's fill() is focus -> insert text, so when
   * that blur lands in between, the text is dropped before fill() resolves and the field stays empty.
   * One more fill() then succeeds, because the blur does not repeat.
   *
   * It never throws on a value that does not stick: an input that rejects input by design of a test
   * user (problem_user's last name, spec 04 §6) is left as the site leaves it, so the spec asserts the
   * outcome (e.g. the "Last Name is required" error) instead of the page object failing first.
   */
  private async fillField(input: Locator, value: string | undefined): Promise<void> {
    if (value === undefined) {
      return;
    }
    await input.fill(value);
    if ((await input.inputValue()) !== value) {
      await input.fill(value);
    }
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
