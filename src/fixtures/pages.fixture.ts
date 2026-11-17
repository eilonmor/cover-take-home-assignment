import { test as base } from '@playwright/test';
import { ShopFlow } from '../pages/flows/ShopFlow';
import { createPages, type Pages } from '../pages/index';

/** Test-scoped fixtures: one instance of every page object, plus the multi-page shop flow. */
export interface PageFixtures extends Pages {
  shop: ShopFlow;
}

/** The registry behind the page fixtures; the page objects come from `createPages` only. */
interface PageRegistryFixture {
  /** Every page object for this test's `page` (specs normally use the individual fixtures instead). */
  pages: Pages;
}

/** Injects the page objects into tests, all bound to the test's `page`. */
export const test = base.extend<PageFixtures & PageRegistryFixture>({
  pages: async ({ page }, use) => {
    await use(createPages(page));
  },
  loginPage: async ({ pages }, use) => {
    await use(pages.loginPage);
  },
  inventoryPage: async ({ pages }, use) => {
    await use(pages.inventoryPage);
  },
  productDetailsPage: async ({ pages }, use) => {
    await use(pages.productDetailsPage);
  },
  cartPage: async ({ pages }, use) => {
    await use(pages.cartPage);
  },
  checkoutInfoPage: async ({ pages }, use) => {
    await use(pages.checkoutInfoPage);
  },
  checkoutOverviewPage: async ({ pages }, use) => {
    await use(pages.checkoutOverviewPage);
  },
  checkoutCompletePage: async ({ pages }, use) => {
    await use(pages.checkoutCompletePage);
  },
  shop: async ({ pages }, use) => {
    await use(new ShopFlow(pages));
  },
});
