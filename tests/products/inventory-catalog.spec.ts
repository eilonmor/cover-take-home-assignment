import { test, expect } from '@fixtures/index';
import { PAGE_TITLES, PRODUCT_TEXT } from '@data/messages';
import { CATALOG_AZ, PLACEHOLDER_IMAGE, PRODUCTS } from '@data/products';

// Spec: specs/02-products.md, scenario 1.1. Authenticated (default): starts logged in as standard_user.

test.describe('Products', () => {
  test(
    'TC-PROD-01 Inventory shows 6 products with exact catalog data',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-PROD-01, AC-PROD-02' } },
    async ({ inventoryPage }) => {
      // Hard guard: goto() waits for the /inventory.html URL and the product list.
      await inventoryPage.goto();

      // 1. Page title, then the 6 products: count, names and prices in A-to-Z order.
      await expect.soft(inventoryPage.title).toHaveText(PAGE_TITLES.inventory);
      await expect.soft(inventoryPage.list).toShowProducts(CATALOG_AZ);
      await expect.soft(inventoryPage.list.descriptions).toHaveText(CATALOG_AZ.map((key) => PRODUCTS[key].description));

      // 2. Per product: its own image (alt = name, catalog file, not the placeholder) and an "Add to cart" button.
      for (const key of CATALOG_AZ) {
        const product = PRODUCTS[key];
        await test.step(product.name, async () => {
          const image = inventoryPage.image(key);
          await expect.soft(image).toBeVisible();
          await expect.soft(image).toHaveAttribute('alt', product.name);
          await expect.soft(image).toHaveAttribute('src', new RegExp(product.imagePrefix));
          await expect.soft(image).not.toHaveAttribute('src', PLACEHOLDER_IMAGE);
          await expect.soft(inventoryPage.addButton(key)).toHaveText(PRODUCT_TEXT.addToCart);
        });
      }

      // 3. A fresh context starts with an empty cart: no badge.
      await expect.soft(inventoryPage.header).toHaveCartBadge(0);
    },
  );
});
