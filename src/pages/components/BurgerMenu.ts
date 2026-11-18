import { expect, type Locator, type Page } from '@playwright/test';
import { ROUTES, routePattern } from '../../data/routes';

/**
 * What the wrapper shows: closed; opening (sliding in); open (fully slid in); or stuck (aria-hidden="false"
 * but `hidden`, from the site race described on `BurgerMenu.open`).
 */
type MenuState = 'closed' | 'opening' | 'open' | 'stuck';

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
   * Clicks the burger button and waits until the menu is open and has slid in (see `waitForOpen`).
   *
   * Site race (react-burger-menu, read from the bundle): 500 ms after every mount and every open/close, a
   * timer sets the HTML `hidden` attribute (display: none) on the first `.bm-menu-wrap` if the menu is
   * closed at that time; a page's unmount sets it at once. Opening removes `hidden` and only marks the menu
   * open a moment later, and the open is what cancels a pending timer. A click that lands as a pending timer
   * fires (right after a page swap or load) leaves the menu "stuck": aria-hidden="false" with `hidden`, for
   * good, so its items can never be clicked (seen on WebKit). The pending timer is not observable on a
   * closed menu, so the click is checked afterwards and a stuck menu is recovered.
   */
  async open(): Promise<void> {
    await this.clickOpen();
    await this.waitForOpen();
  }

  private async clickOpen(): Promise<void> {
    await this.openButton.click();
    await expect(this.wrapper).toHaveAttribute('aria-hidden', 'false');
  }

  /**
   * Waits for one of the two end states of an open: "open" (fully slid in; the 0.5 s slide-in outlives any
   * racing timer) or "stuck" (permanent). Both are read directly, so a slow slide-in is never mistaken for
   * stuck. A stuck menu is toggled closed with the burger button (not covered, since the panel is
   * display: none); the close's own timer is awaited through the `hidden` attribute it puts back, so the
   * reopen has no timer left to race.
   */
  private async waitForOpen(): Promise<void> {
    await expect
      .poll(async () => this.readState(), { message: 'menu fully open, or stuck open but hidden' })
      .toMatch(/^(?:open|stuck)$/);
    if ((await this.readState()) === 'open') {
      return;
    }
    await this.openButton.click();
    await expect(this.wrapper).toHaveAttribute('aria-hidden', 'true');
    await expect(this.wrapper, 'close settled (no pending menu timer)').toHaveAttribute('hidden');
    await this.clickOpen();
    await expect.poll(async () => this.readState(), { message: 'menu fully open after recovery' }).toBe('open');
  }

  /** The menu's state, read from the wrapper's attributes and position (see `waitForOpen`). */
  private async readState(): Promise<MenuState> {
    return this.wrapper.evaluate((wrap) => {
      if (wrap.getAttribute('aria-hidden') !== 'false') {
        return 'closed' as const;
      }
      if (wrap.hasAttribute('hidden')) {
        return 'stuck' as const;
      }
      const { left, right } = wrap.getBoundingClientRect();
      return left >= 0 && right <= window.innerWidth ? ('open' as const) : ('opening' as const);
    });
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

  /** Opens a closed menu; a menu already open (or still sliding in, or stuck) goes through `waitForOpen`. */
  private async ensureOpen(): Promise<void> {
    if ((await this.readState()) === 'closed') {
      await this.open();
    } else {
      await this.waitForOpen();
    }
  }
}
