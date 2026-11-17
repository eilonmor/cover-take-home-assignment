import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { BurgerMenu } from './components/BurgerMenu';
import { Header } from './components/Header';

/** Base of every logged-in page: header, burger menu and page title. */
export abstract class AppPage extends BasePage {
  /** Cart link and badge. */
  readonly header: Header;
  /** The burger (side) menu. */
  readonly menu: BurgerMenu;
  /** The secondary header title, e.g. "Products". */
  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.menu = new BurgerMenu(page);
    this.title = page.getByTestId('title');
  }
}
