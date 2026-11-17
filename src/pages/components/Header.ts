import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES, routePattern } from '../../data/routes';

/** The primary header of every logged-in page: cart link and badge. */
export class Header {
  /** The cart icon link. */
  readonly cartLink: Locator;
  /** The item count badge. Absent (not "0") when the cart is empty. */
  readonly cartBadge: Locator;

  constructor(readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  /** Clicks the cart link and waits for `/cart.html` (reading rows earlier returns the previous page's DOM). */
  async openCart(): Promise<void> {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.cart));
  }
}
