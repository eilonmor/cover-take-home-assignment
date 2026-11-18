import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES, routePattern } from '../../data/routes';

/** Budget for the 0.5 s slide-in before the menu is treated as stuck (see `BurgerMenu.open`). */
const SLIDE_IN_TIMEOUT = 2_000;

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

  /**
   * Clicks the burger button and waits until the menu reports it is open and has slid in.
   *
   * Site race (react-burger-menu, read from the bundle): 500 ms after every mount and every open/close, a
   * timer sets the HTML `hidden` attribute (display: none) on the first `.bm-menu-wrap` if the menu is
   * closed at that time; a page's unmount sets it at once. Opening removes `hidden` and only marks the menu
   * open a moment later, and the open is what cancels a pending timer. A click that lands as a pending timer
   * fires (right after a page swap or load) leaves the menu at aria-hidden="false" with `hidden`, for good,
   * so its items can never be clicked (seen on WebKit). That pending timer is not observable on a closed
   * menu, so the first click is checked afterwards instead: the slide-in takes 0.5 s, so a panel fully in
   * the viewport has outlived any timer. A stuck menu is toggled closed, and the close's own timer is
   * awaited through the `hidden` attribute it sets, so the reopen has no timer left to race.
   */
  async open(): Promise<void> {
    await this.clickOpen();
    if (await this.hasSlidIn()) {
      return;
    }
    // Stuck at "open but hidden": the burger button toggles it closed (which removes `hidden`)...
    await this.openButton.click();
    await expect(this.wrapper).toHaveAttribute('aria-hidden', 'true');
    // ...and the close timer puts `hidden` back after 500 ms: once it is there, no timer is pending.
    await expect(this.wrapper, 'close settled (no pending menu timer)').toHaveAttribute('hidden');
    await this.clickOpen();
    await expect(this.wrapper, 'menu panel slid in').toBeInViewport({ ratio: 1 });
  }

  private async clickOpen(): Promise<void> {
    await this.openButton.click();
    await expect(this.wrapper).toHaveAttribute('aria-hidden', 'false');
  }

  /** True once the open panel is fully in the viewport; false if it stays hidden (see `open`). */
  private async hasSlidIn(): Promise<boolean> {
    try {
      await expect(this.wrapper).toBeInViewport({ ratio: 1, timeout: SLIDE_IN_TIMEOUT });
      return true;
    } catch {
      return false;
    }
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
