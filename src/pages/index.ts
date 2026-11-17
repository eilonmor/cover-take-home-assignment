import type { Page } from '@playwright/test';
import { CartPage } from './CartPage';
import { CheckoutCompletePage } from './CheckoutCompletePage';
import { CheckoutInfoPage } from './CheckoutInfoPage';
import { CheckoutOverviewPage } from './CheckoutOverviewPage';
import { InventoryPage } from './InventoryPage';
import { LoginPage } from './LoginPage';
import { ProductDetailsPage } from './ProductDetailsPage';

/** Every page object, as injected into the tests by the pages fixture. */
export interface Pages {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
}

/** Creates every page object for one Playwright page. */
export function createPages(page: Page): Pages {
  return {
    loginPage: new LoginPage(page),
    inventoryPage: new InventoryPage(page),
    productDetailsPage: new ProductDetailsPage(page),
    cartPage: new CartPage(page),
    checkoutInfoPage: new CheckoutInfoPage(page),
    checkoutOverviewPage: new CheckoutOverviewPage(page),
    checkoutCompletePage: new CheckoutCompletePage(page),
  };
}
