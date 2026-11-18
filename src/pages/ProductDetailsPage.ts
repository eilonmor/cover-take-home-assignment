import { expect, type Locator, type Page } from '@playwright/test';
import { PRODUCTS, type ProductKey } from '../data/products';
import { ROUTES, routePattern } from '../data/routes';
import { AppPage } from './AppPage';

/** Page object for a product's details page (`/inventory-item.html?id=N`). */
export class ProductDetailsPage extends AppPage {
  /** Route without the id; use `open(key)` to open a product. */
  readonly path = '/inventory-item.html';

  /** The product card. */
  readonly item: Locator;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  /** "Add to cart" (no slug on this page). */
  readonly addButton: Locator;
  /** "Remove" (no slug on this page). */
  readonly removeButton: Locator;
  /** "Back to products". */
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.item = page.getByTestId('inventory-item');
    this.name = this.item.getByTestId('inventory-item-name');
    this.description = this.item.getByTestId('inventory-item-desc');
    this.price = this.item.getByTestId('inventory-item-price');
    this.addButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    this.backButton = page.getByTestId('back-to-products');
  }

  /**
   * Not supported: without an id the site shows its "ITEM NOT FOUND" page, which would still look loaded.
   * Use `open(key)` instead.
   */
  override async goto(): Promise<void> {
    throw new Error('ProductDetailsPage.goto() has no product id; use productDetailsPage.open(key) instead.');
  }

  /** Opens the product's details page by URL and waits until it is ready. */
  async open(key: ProductKey): Promise<void> {
    await this.page.goto(ROUTES.details(PRODUCTS[key].id));
    await this.waitForLoaded(key);
  }

  /**
   * Waits for the details URL (with the product's id when `key` is given), the "Back to products"
   * button, and then the product name.
   *
   * The SPA can update the URL before the DOM swaps, and the inventory list reuses the `inventory-item` and
   * `inventory-item-name` ids, so `name` would match every list row (strict mode violation) during the
   * transition. The inventory list has no "Back to products", so waiting on it first proves the swap.
   * The "ITEM NOT FOUND" page has that button too: only a `key` (an exact `?id=N`) proves a real product.
   */
  async waitForLoaded(key?: ProductKey): Promise<void> {
    const route = key === undefined ? this.path : ROUTES.details(PRODUCTS[key].id);
    await expect(this.page).toHaveURL(routePattern(route));
    await expect(this.backButton).toBeVisible();
    await expect(this.name).toBeVisible();
  }

  /** The product image. Note the id differs from the list's `inventory-item-<slug>-img`. */
  image(key: ProductKey): Locator {
    return this.page.getByTestId(`item-${PRODUCTS[key].slug}-img`);
  }

  /** Adds the product and waits for the button to turn into "Remove". */
  async addToCart(): Promise<void> {
    await this.addButton.click();
    await expect(this.removeButton).toBeVisible();
  }

  /** Removes the product and waits for the button to turn back into "Add to cart". */
  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
    await expect(this.addButton).toBeVisible();
  }

  /** Clicks "Back to products" and waits for the inventory URL and for the details page to unmount. */
  async backToProducts(): Promise<void> {
    await this.backButton.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.inventory));
    // The URL changes before the DOM swaps; the inventory page has no "Back to products".
    await expect(this.backButton).toHaveCount(0);
  }
}
