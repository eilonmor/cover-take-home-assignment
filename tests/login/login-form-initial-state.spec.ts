import { test, expect, GUEST_STATE } from '@fixtures/index';
import { LOGIN_FORM } from '@data/messages';
import { ENV } from '@utils/env';

// Spec: specs/01-login.md, scenario 1.6.
test.use({ storageState: GUEST_STATE });

test.describe('Login', () => {
  test(
    'TC-LOGIN-06 Login form initial state',
    { tag: ['@regression'], annotation: { type: 'covers', description: 'AC-LOGIN-10' } },
    async ({ loginPage }) => {
      await loginPage.goto();

      // 1. The empty form: fields, placeholders, masked password, no error.
      await expect.soft(loginPage.usernameInput).toBeVisible();
      await expect.soft(loginPage.usernameInput).toHaveValue('');
      await expect.soft(loginPage.usernameInput).toHaveAttribute('placeholder', LOGIN_FORM.usernamePlaceholder);
      await expect.soft(loginPage.passwordInput).toBeVisible();
      await expect.soft(loginPage.passwordInput).toHaveValue('');
      await expect.soft(loginPage.passwordInput).toHaveAttribute('placeholder', LOGIN_FORM.passwordPlaceholder);
      await expect.soft(loginPage.passwordInput).toHaveAttribute('type', 'password');
      await expect.soft(loginPage.loginButton).toBeVisible();
      await expect.soft(loginPage.loginButton).toHaveValue(LOGIN_FORM.buttonLabel);
      await expect.soft(loginPage.errorMessage).toHaveCount(0);

      // 2. Typing keeps the password masked.
      await loginPage.typePassword(ENV.password);
      await expect.soft(loginPage.passwordInput).toHaveAttribute('type', 'password');
      await expect.soft(loginPage.passwordInput).toHaveValue(ENV.password);
    },
  );
});
