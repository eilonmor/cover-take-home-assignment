import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES, routePattern } from '../../data/routes';

/** The burger (side) menu of every logged-in page. */
export class BurgerMenu {
  /** Opens the menu. */
  readonly openButton: Locator;
  /** Closes the menu. */
  readonly closeButton: Locator;
  /** The sliding panel; its `aria-hidden` attribute tells whether the menu is open. */
  readonly wrapper: Locator;
  /** All menu links, in DOM order. */
  readonly items: Locator;
  readonly allItemsLink: Locator;
  readonly dynamicCatalogLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetLink: Locator;

  constructor(readonly page: Page) {
    // Exception to the data-test rule: the clickable buttons have no data-test. (`open-menu` and
    // `close-menu` exist, but only on the decorative <img> icons inside the buttons.)
    this.openButton = page.locator('#react-burger-menu-btn');
    this.closeButton = page.locator('#react-burger-cross-btn');
    // Exception to the data-test rule: menu items stay "visible" in CSS when the menu is closed, so
    // aria-hidden on this wrapper is the only reliable open/closed signal.
    this.wrapper = page.locator('.bm-menu-wrap');
    this.items = page.getByTestId(/-sidebar-link$/);
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.dynamicCatalogLink = page.getByTestId('dynamic-catalog-sidebar-link');
    this.aboutLink = page.getByTestId('about-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetLink = page.getByTestId('reset-sidebar-link');
  }

  /** Clicks the burger button and waits until the menu reports it is open. */
  async open(): Promise<void> {
    await this.openButton.click();
    await expect(this.wrapper).toHaveAttribute('aria-hidden', 'false');
  }

  /** Clicks the close button and waits until the menu reports it is closed. */
  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.wrapper).toHaveAttribute('aria-hidden', 'true');
  }

  /** Opens the menu if needed, clicks All Items and waits for the inventory URL. */
  async goToAllItems(): Promise<void> {
    await this.ensureOpen();
    await this.allItemsLink.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.inventory));
  }

  /** Opens the menu if needed, clicks Logout and waits for the login URL. */
  async logout(): Promise<void> {
    await this.ensureOpen();
    await this.logoutLink.click();
    await expect(this.page).toHaveURL(routePattern(ROUTES.login));
  }

  /** Opens the menu if needed and clicks Reset App State. The menu stays open. */
  async resetAppState(): Promise<void> {
    await this.ensureOpen();
    await this.resetLink.click();
  }

  private async ensureOpen(): Promise<void> {
    if ((await this.wrapper.getAttribute('aria-hidden')) !== 'false') {
      await this.open();
    }
  }
}
