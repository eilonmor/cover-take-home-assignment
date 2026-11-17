import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES, routePattern } from '../data/routes';
import { AppPage } from './AppPage';

/** Page object for the order confirmation (`/checkout-complete.html`). */
export class CheckoutCompletePage extends AppPage {
  readonly path = ROUTES.checkoutComplete;

  /** "Thank you for your order!" (named so it does not clash with the inherited `header` component). */
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  /** The confirmation image (alt "Pony Express"). */
  readonly ponyExpressImage: Locator;
  /** "Back Home". */
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.ponyExpressImage = page.getByTestId('pony-express');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  /** Waits for the complete URL and the confirmation header. */
  async waitForLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(this.path));
    await expect(this.completeHeader).toBeVisible();
  }

  /** Clicks "Back Home" and waits for the inventory URL. */
  async backHome(): Promise<void> {
    await this.backHomeButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.inventory));
  }
}
