import type { Locator } from '@playwright/test';
import { PRODUCTS, type ProductKey } from '../../data/products';

/**
 * A list of product rows (`inventory-item`), as used on the inventory, cart and checkout overview pages.
 * All locators are scoped to the list root.
 */
export class ItemList {
  /** One element per product row. */
  readonly items: Locator;
  /** Product names, in list order. */
  readonly names: Locator;
  /** Product descriptions, in list order. */
  readonly descriptions: Locator;
  /** Product prices, in list order. */
  readonly prices: Locator;
  /** Quantity cells (cart and overview only), in list order. */
  readonly quantities: Locator;

  constructor(readonly root: Locator) {
    this.items = root.getByTestId('inventory-item');
    this.names = root.getByTestId('inventory-item-name');
    this.descriptions = root.getByTestId('inventory-item-desc');
    this.prices = root.getByTestId('inventory-item-price');
    this.quantities = root.getByTestId('item-quantity');
  }

  /** The row whose name is exactly the product's name. */
  row(key: ProductKey): Locator {
    const page = this.root.page();
    const name = page.getByTestId('inventory-item-name').and(page.getByText(PRODUCTS[key].name, { exact: true }));
    return this.items.filter({ has: name });
  }

  /** The name element in the product's row. */
  nameIn(key: ProductKey): Locator {
    return this.row(key).getByTestId('inventory-item-name');
  }

  /** The price element in the product's row. */
  priceIn(key: ProductKey): Locator {
    return this.row(key).getByTestId('inventory-item-price');
  }

  /** The quantity cell in the product's row (cart and overview only). */
  quantityIn(key: ProductKey): Locator {
    return this.row(key).getByTestId('item-quantity');
  }
}
