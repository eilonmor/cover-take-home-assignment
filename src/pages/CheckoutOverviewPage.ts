import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES, routePattern } from '../data/routes';
import { parseMoney, type OrderSummary } from '../utils/money';
import { AppPage } from './AppPage';
import { ItemList } from './components/ItemList';

/** Page object for checkout step two, "Overview" (`/checkout-step-two.html`). */
export class CheckoutOverviewPage extends AppPage {
  readonly path = ROUTES.checkoutOverview;

  /** The ordered items, in add order (the list id is `cart-list`, verified live). */
  readonly list: ItemList;
  readonly paymentLabel: Locator;
  readonly paymentValue: Locator;
  readonly shippingLabel: Locator;
  readonly shippingValue: Locator;
  /** The "Price Total" header. */
  readonly totalInfoLabel: Locator;
  /** "Item total: $..". */
  readonly subtotalLabel: Locator;
  /** "Tax: $..". */
  readonly taxLabel: Locator;
  /** "Total: $..". */
  readonly totalLabel: Locator;
  readonly cancelButton: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.list = new ItemList(page.getByTestId('cart-list'));
    this.paymentLabel = page.getByTestId('payment-info-label');
    this.paymentValue = page.getByTestId('payment-info-value');
    this.shippingLabel = page.getByTestId('shipping-info-label');
    this.shippingValue = page.getByTestId('shipping-info-value');
    this.totalInfoLabel = page.getByTestId('total-info-label');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.cancelButton = page.getByTestId('cancel');
    this.finishButton = page.getByTestId('finish');
  }

  /** Waits for the step two URL and the Finish button. */
  async waitForLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(this.path));
    await expect(this.finishButton).toBeVisible();
  }

  /** Reads the three summary labels and parses them into cents. Call after `waitForLoaded()`. */
  async readSummary(): Promise<OrderSummary> {
    return {
      itemTotal: parseMoney(await this.subtotalLabel.innerText()),
      tax: parseMoney(await this.taxLabel.innerText()),
      total: parseMoney(await this.totalLabel.innerText()),
    };
  }

  /** Clicks Cancel and waits for the inventory URL (not the cart). */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.inventory));
  }

  /** Clicks Finish and waits for the complete URL. */
  async finish(): Promise<void> {
    await this.finishButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.checkoutComplete));
  }
}
