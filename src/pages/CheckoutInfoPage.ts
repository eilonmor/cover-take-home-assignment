import { expect, type Locator, type Page } from '@playwright/test';
import type { CheckoutInfo } from '../data/checkout';
import { ROUTES, routePattern } from '../data/routes';
import { AppPage } from './AppPage';

/** Page object for checkout step one, "Your Information" (`/checkout-step-one.html`). */
export class CheckoutInfoPage extends AppPage {
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
    if (info.firstName !== undefined) {
      await this.firstName.fill(info.firstName);
    }
    if (info.lastName !== undefined) {
      await this.lastName.fill(info.lastName);
    }
    if (info.postalCode !== undefined) {
      await this.postalCode.fill(info.postalCode);
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
