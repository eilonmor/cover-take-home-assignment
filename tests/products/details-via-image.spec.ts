import { test, expect } from '@fixtures/index';
import { PRODUCT_TEXT } from '@data/messages';
import { PLACEHOLDER_IMAGE, PRODUCTS, type ProductKey } from '@data/products';

// Spec: specs/02-products.md, scenario 1.5. Authenticated (default): starts logged in as standard_user.

/** Bike Light (id 0) is second in the list and Fleece Jacket (id 5) is fourth: the image link is id-based. */
const OPENED: readonly ProductKey[] = ['bikeLight', 'fleeceJacket'];

test.describe('Products', () => {
  test(
    'TC-PROD-05 Open details via image',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-PROD-07, AC-PROD-08' } },
    async ({ inventoryPage, productDetailsPage }) => {
      await inventoryPage.goto();

      for (const key of OPENED) {
        const product = PRODUCTS[key];
        await test.step(`${product.name} (id ${product.id})`, async () => {
          // Hard guard: openDetailsByImage waits for /inventory-item.html?id=N; the rest reads that page.
          await inventoryPage.openDetailsByImage(key);
          await productDetailsPage.waitForLoaded(key);

          await expect.soft(productDetailsPage.name).toHaveText(product.name);
          await expect.soft(productDetailsPage.price).toHaveText(product.price);
          await expect.soft(productDetailsPage.description).toHaveText(product.description);

          const image = productDetailsPage.image(key);
          await expect.soft(image).toBeVisible();
          await expect.soft(image).toHaveAttribute('alt', product.name);
          await expect.soft(image).toHaveAttribute('src', new RegExp(product.imagePrefix));
          await expect.soft(image).not.toHaveAttribute('src', PLACEHOLDER_IMAGE);

          await expect.soft(productDetailsPage.addButton).toHaveText(PRODUCT_TEXT.addToCart);
          await expect.soft(productDetailsPage.backButton).toHaveText(PRODUCT_TEXT.backToProducts);

          // Hard guard: back on the inventory page, which the next product starts from.
          await productDetailsPage.backToProducts();
          await inventoryPage.waitForLoaded();
        });
      }
    },
  );
});
