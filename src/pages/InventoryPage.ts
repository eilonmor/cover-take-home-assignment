import { expect, type Locator, type Page } from '@playwright/test';
import { PRODUCTS, type ProductKey } from '../data/products';
import { ROUTES, routePattern } from '../data/routes';
import type { SortValue } from '../data/sort-options';
import { SLOW_RENDER_TIMEOUT } from '../utils/timeouts';
import { AppPage } from './AppPage';
import { ItemList } from './components/ItemList';

/** Page object for the product list (`/inventory.html`). */
export class InventoryPage extends AppPage {
  readonly path = ROUTES.inventory;

  /** The inventory container, the page's key element. */
  readonly container: Locator;
  /** The product rows. */
  readonly list: ItemList;
  /** The sort `<select>`. */
  readonly sortSelect: Locator;
  /** The `<option>`s of the sort select, in dropdown order. */
  readonly sortOptions: Locator;
  /** The visible label of the selected sort option. */
  readonly activeSortOption: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.getByTestId('inventory-container');
    this.list = new ItemList(page.getByTestId('inventory-list'));
    this.sortSelect = page.getByTestId('product-sort-container');
    this.sortOptions = this.sortSelect.getByRole('option');
    this.activeSortOption = page.getByTestId('active-option');
  }

  /**
   * Waits for the inventory URL and the product list. Allows for performance_glitch_user's slow render.
   *
   * The SPA can update the URL before the DOM swaps, and the details page also renders
   * `inventory-container`, so the wait is on `inventory-list`, which only this page has.
   */
  async waitForLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(this.path), { timeout: SLOW_RENDER_TIMEOUT });
    await expect(this.list.root).toBeVisible({ timeout: SLOW_RENDER_TIMEOUT });
  }

  /** The product's "Add to cart" button. */
  addButton(key: ProductKey): Locator {
    return this.page.getByTestId(`add-to-cart-${PRODUCTS[key].slug}`);
  }

  /** The product's "Remove" button (present only while it is in the cart). */
  removeButton(key: ProductKey): Locator {
    return this.page.getByTestId(`remove-${PRODUCTS[key].slug}`);
  }

  /** The product's name link (id-based, not position-based). */
  titleLink(key: ProductKey): Locator {
    return this.page.getByTestId(`item-${PRODUCTS[key].id}-title-link`);
  }

  /** The product's image link (id-based, not position-based). */
  imageLink(key: ProductKey): Locator {
    return this.page.getByTestId(`item-${PRODUCTS[key].id}-img-link`);
  }

  /** The product's image in the list. */
  image(key: ProductKey): Locator {
    return this.page.getByTestId(`inventory-item-${PRODUCTS[key].slug}-img`);
  }

  /** Adds each product, in order, waiting for its button to turn into "Remove". */
  async addToCart(...keys: readonly ProductKey[]): Promise<void> {
    for (const key of keys) {
      await this.addButton(key).click();
      await expect(this.removeButton(key)).toBeVisible();
    }
  }

  /** Removes each product, in order, waiting for its button to turn back into "Add to cart". */
  async removeFromCart(...keys: readonly ProductKey[]): Promise<void> {
    for (const key of keys) {
      await this.removeButton(key).click();
      await expect(this.addButton(key)).toBeVisible();
    }
  }

  /** Selects a sort option by value. */
  async sortBy(value: SortValue): Promise<void> {
    await this.sortSelect.selectOption(value);
  }

  /** Clicks the product's name and waits for its details URL and for the list to unmount. */
  async openDetailsByName(key: ProductKey): Promise<void> {
    await this.titleLink(key).click();
    await this.waitForDetails(key);
  }

  /** Clicks the product's image and waits for its details URL and for the list to unmount. */
  async openDetailsByImage(key: ProductKey): Promise<void> {
    await this.imageLink(key).click();
    await this.waitForDetails(key);
  }

  /**
   * The URL changes before the DOM swaps, and the list rows reuse the details page's
   * `inventory-item-*` ids, so also wait until the list is gone before the caller reads the page.
   */
  private async waitForDetails(key: ProductKey): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(ROUTES.details(PRODUCTS[key].id)));
    await expect(this.list.root).toHaveCount(0);
  }
}
