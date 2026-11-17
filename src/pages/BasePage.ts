import type { Page } from '@playwright/test';

/**
 * Base of every page object: it holds locators and actions, plus one readiness wait.
 * Business assertions stay in the specs, so page objects work with `expect` and `expect.soft`.
 */
export abstract class BasePage {
  /** Route of the page, relative to `baseURL`. */
  abstract readonly path: string;

  constructor(readonly page: Page) {}

  /** Opens the page by its route and waits until it is ready. */
  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForLoaded();
  }

  /** Waits (auto-retrying `expect`) until the URL matches the page and its key element is visible. */
  abstract waitForLoaded(): Promise<void>;
}
