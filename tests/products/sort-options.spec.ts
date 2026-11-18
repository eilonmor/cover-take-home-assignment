import { test, expect } from '@fixtures/index';
import { CATALOG_AZ } from '@data/products';
import { ROUTES, routePattern } from '@data/routes';
import { DEFAULT_SORT, SORT_OPTIONS } from '@data/sort-options';

// Spec: specs/02-products.md, scenario 1.2. Authenticated (default): starts logged in as standard_user.

test.describe('Products', () => {
  test(
    'TC-PROD-02 Sort dropdown default and options',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-PROD-03, AC-PROD-04' } },
    async ({ inventoryPage }) => {
      const defaultOption = SORT_OPTIONS.find((option) => option.value === DEFAULT_SORT);
      if (defaultOption === undefined) {
        throw new Error(`DEFAULT_SORT "${DEFAULT_SORT}" is not one of SORT_OPTIONS.`);
      }

      await inventoryPage.goto();
      // Hard guard: everything below reads the inventory page.
      await expect(inventoryPage.page).toHaveURL(routePattern(ROUTES.inventory));

      await test.step('Default selection is Name (A to Z)', async () => {
        await expect.soft(inventoryPage.sortSelect).toHaveValue(DEFAULT_SORT);
        await expect.soft(inventoryPage.activeSortOption).toHaveText(defaultOption.label);
      });

      await test.step('Exactly 4 options, with their labels and values in dropdown order', async () => {
        // toHaveText with an array also asserts the count.
        await expect.soft(inventoryPage.sortOptions).toHaveText(SORT_OPTIONS.map((option) => option.label));
        for (const [index, option] of SORT_OPTIONS.entries()) {
          await expect.soft(inventoryPage.sortOptions.nth(index)).toHaveAttribute('value', option.value);
        }
      });

      await test.step('Products are listed A to Z', async () => {
        await expect.soft(inventoryPage.list).toShowProducts(CATALOG_AZ);
      });
    },
  );
});
