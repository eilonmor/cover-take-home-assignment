import { CUSTOMER, type CheckoutInfo } from '../../data/checkout';
import type { ProductKey } from '../../data/products';
import type { Pages } from '../index';

/**
 * Multi-page shortcuts that bring a logged-in test to a given step of the purchase.
 * Every method starts from the inventory page and ends once the target page is ready.
 */
export class ShopFlow {
  constructor(private readonly pages: Pages) {}

  /** Opens the inventory, adds the products in order, then opens the cart. */
  async addAndOpenCart(keys: readonly ProductKey[]): Promise<void> {
    const { inventoryPage, cartPage } = this.pages;
    await inventoryPage.goto();
    await inventoryPage.addToCart(...keys);
    await inventoryPage.header.openCart();
    await cartPage.waitForLoaded();
  }

  /** Adds the products and goes to checkout step one. */
  async startCheckout(keys: readonly ProductKey[]): Promise<void> {
    await this.addAndOpenCart(keys);
    await this.pages.cartPage.checkout();
    await this.pages.checkoutInfoPage.waitForLoaded();
  }

  /** Adds the products, fills step one and goes to the overview (step two). */
  async reachOverview(keys: readonly ProductKey[], info: CheckoutInfo = CUSTOMER): Promise<void> {
    await this.startCheckout(keys);
    await this.pages.checkoutInfoPage.submit(info);
    await this.pages.checkoutOverviewPage.waitForLoaded();
  }

  /** Runs the whole purchase and ends on the complete page. */
  async placeOrder(keys: readonly ProductKey[], info: CheckoutInfo = CUSTOMER): Promise<void> {
    await this.reachOverview(keys, info);
    await this.pages.checkoutOverviewPage.finish();
    await this.pages.checkoutCompletePage.waitForLoaded();
  }
}
