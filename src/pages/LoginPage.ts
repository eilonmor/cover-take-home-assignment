import { expect, type Locator, type Page } from '@playwright/test';
import { getUser, type UserCredentials, type UserKey } from '../data/users';
import { ROUTES, routePattern } from '../data/routes';
import { BasePage } from './BasePage';

/** Page object for the login page (`/`). */
export class LoginPage extends BasePage {
  /**
   * Class pattern of an input in the red error state. It matches the `error` class only: the
   * `input_error` class stays on the inputs after the error is dismissed, so it is not a signal.
   */
  readonly inputErrorClass = /\berror\b/;

  readonly path = ROUTES.login;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  /** The error message (`<h3>`); only present after a failed attempt. */
  readonly errorMessage: Locator;
  /** The X button that dismisses the error. */
  readonly errorButton: Locator;
  /** The red circle-xmark icons shown inside both inputs while an error is displayed. */
  readonly inputErrorIcons: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
    this.errorButton = page.getByTestId('error-button');
    // Exception to the data-test rule: the input error icons have no data-test.
    this.inputErrorIcons = page.locator('.error_icon');
  }

  /** Waits for the login URL and the login button. */
  async waitForLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(routePattern(this.path));
    await expect(this.loginButton).toBeVisible();
  }

  /** Fills only the non-empty values; an empty or missing value leaves its field untouched. */
  async fillCredentials({ username, password }: Partial<UserCredentials>): Promise<void> {
    if (username) {
      await this.usernameInput.fill(username);
    }
    if (password) {
      await this.passwordInput.fill(password);
    }
  }

  /** Clicks the login button. */
  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  /** Submits the form by pressing Enter in the password field. */
  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  /** Opens the login page and logs in as the given account from `.env`. Does not wait for the next page. */
  async loginAs(key: UserKey): Promise<void> {
    await this.login(getUser(key));
  }

  /** Clicks the X button on the error message. */
  async dismissError(): Promise<void> {
    await this.errorButton.click();
  }

  /** Opens the login page and submits the given credentials. Used by the auth fixture. */
  async login(credentials: UserCredentials): Promise<void> {
    await this.goto();
    await this.fillCredentials(credentials);
    await this.submit();
  }
}
