import { test, expect } from '@fixtures/index';
import { CATALOG_AZ } from '@data/products';
import { ROUTES, routePattern } from '@data/routes';
import { sortOption, type SortValue } from '@data/sort-options';

// Spec: specs/02-products.md, scenario 1.3. Authenticated (default): starts logged in as standard_user.

/** Run order from the spec: away from the default first, then back to A to Z last. */
const RUN_ORDER: readonly SortValue[] = ['za', 'lohi', 'hilo', 'az'];

test.describe('Products', () => {
  test(
    'TC-PROD-03 Each sort option orders products correctly',
    { tag: ['@smoke', '@regression'], annotation: { type: 'covers', description: 'AC-PROD-05' } },
    async ({ inventoryPage }) => {
      // Hard guard: goto() waits for the /inventory.html URL and the product list.
      await inventoryPage.goto();

      for (const option of RUN_ORDER.map(sortOption)) {
        await test.step(`Sort by ${option.label}`, async () => {
          await inventoryPage.sortBy(option.value);
          await expect.soft(inventoryPage.sortSelect).toHaveValue(option.value);
          // Names AND prices in exact order, so each price stays attached to its product.
          // The two $15.99 items tie in both price sorts: Bolt before Red is the observed (stable)
          // order, not a documented rule (spec 02 §4), and it is encoded in SORT_OPTIONS.
          await expect.soft(inventoryPage.list).toShowProducts(option.expectedOrder);
          // The same 6 products are shown, whatever the order.
          await expect.soft(inventoryPage.list.items).toHaveCount(CATALOG_AZ.length);
          // Sorting is client-side: the URL does not change.
          await expect.soft(inventoryPage.page).toHaveURL(routePattern(ROUTES.inventory));
        });
      }
    },
  );
});
