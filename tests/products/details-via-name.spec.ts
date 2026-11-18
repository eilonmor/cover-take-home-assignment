import { test, expect } from '@fixtures/index';
import { PRODUCT_TEXT } from '@data/messages';
import { CATALOG_AZ, PLACEHOLDER_IMAGE, PRODUCTS, type ProductKey } from '@data/products';

// Spec: specs/02-products.md, scenario 1.4. Authenticated (default): starts logged in as standard_user.

/**
 * Backpack (id 4) is first in the list and Red T-Shirt (id 3) is last: ids do not follow list order,
 * so the details URL proves the link is id-based.
 */
const OPENED: readonly ProductKey[] = ['backpack', 'redTShirt'];

test.describe('Products', () => {
  test(
    'TC-PROD-04 Open details via name and return with Back to products',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-PROD-06, AC-PROD-08, AC-PROD-09' } },
    async ({ inventoryPage, productDetailsPage }) => {
      await inventoryPage.goto();

      for (const key of OPENED) {
        const product = PRODUCTS[key];
        await test.step(`${product.name} (id ${product.id})`, async () => {
          // Hard guard: the exact /inventory-item.html?id=N URL and the details page rendered.
          await inventoryPage.openDetailsByName(key);
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

          // Hard guard: back on /inventory.html with the list rendered, which the next product starts from.
          await productDetailsPage.backToProducts();
          await inventoryPage.waitForLoaded();
          await expect.soft(inventoryPage.list.items).toHaveCount(CATALOG_AZ.length);
        });
      }
    },
  );
});
