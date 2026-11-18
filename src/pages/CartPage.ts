import { expect, type Locator, type Page } from '@playwright/test';
import { PRODUCTS, type ProductKey } from '../data/products';
import { ROUTES, routePattern } from '../data/routes';
import { AppPage } from './AppPage';
import { ItemList } from './components/ItemList';

/** Page object for the cart (`/cart.html`). */
export class CartPage extends AppPage {
  readonly path = ROUTES.cart;

  /** The cart rows, in add order. */
  readonly list: ItemList;
  /** The "QTY" column header. */
  readonly quantityLabel: Locator;
  /** The "Description" column header. */
  readonly descriptionLabel: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.list = new ItemList(page.getByTestId('cart-list'));
    this.quantityLabel = page.getByTestId('cart-quantity-label');
    this.descriptionLabel = page.getByTestId('cart-desc-label');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.checkoutButton = page.getByTestId('checkout');
  }

  /** Waits for the cart URL and the Checkout button. Read rows only after this. */
  async waitForLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(this.path));
    await expect(this.checkoutButton).toBeVisible();
  }

  /** The product's "Remove" button, scoped to its own row. */
  removeButton(key: ProductKey): Locator {
    return this.list.row(key).getByTestId(`remove-${PRODUCTS[key].slug}`);
  }

  /**
   * Every button in the product's row except the name link (which has role button, "View details
   * for <name>"). The only one must be "Remove": a quantity stepper (+/-) would show up here as
   * extra buttons (AC-CART-06). A role query scoped to the row.
   */
  rowButtons(key: ProductKey): Locator {
    return this.list
      .row(key)
      .getByRole('button')
      .filter({ hasNot: this.page.getByTestId('inventory-item-name') });
  }

  /**
   * Any editable quantity control (text or number input, slider, select) in the product's row. The
   * cart has none: quantity is fixed at 1 (AC-CART-06), so tests expect a count of 0. A role query
   * scoped to the row, because there is no data-test id for an element that must not exist.
   * Assert the row exists first: a missing row also has 0 inputs.
   */
  quantityInputs(key: ProductKey): Locator {
    const row = this.list.row(key);
    return row
      .getByRole('textbox')
      .or(row.getByRole('spinbutton'))
      .or(row.getByRole('slider'))
      .or(row.getByRole('combobox'));
  }

  /** Removes each product, in order, waiting for its row to disappear. */
  async remove(...keys: readonly ProductKey[]): Promise<void> {
    for (const key of keys) {
      await this.removeButton(key).click();
      await expect(this.list.row(key)).toHaveCount(0);
    }
  }

  /** Clicks "Continue Shopping" and waits for the inventory URL. */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.inventory));
  }

  /** Clicks "Checkout" and waits for the step one URL. */
  async checkout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.checkoutInfo));
  }

  /** Clicks the product's name and waits for its details URL. */
  async openItem(key: ProductKey): Promise<void> {
    await this.list.nameIn(key).click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.details(PRODUCTS[key].id)));
  }
}
