import { test, expect, GUEST_STATE } from '@fixtures/index';
import { invalidLoginCases } from '@data/login-cases';
import { ROUTES, routePattern } from '@data/routes';
import { runGroupedCases } from '@utils/grouped';

// Spec: specs/01-login.md, scenario 1.2. Grouped: one isolated step per row of invalidLoginCases().
test.use({ storageState: GUEST_STATE });

/** The red error state: the `error` class itself, not `input_error`, which stays after a dismiss. */
const ERROR_CLASS = /\berror\b/;

test.describe('Login', () => {
  test(
    'TC-LOGIN-02 Invalid login attempts display the correct error message',
    {
      tag: ['@smoke', '@regression'],
      annotation: {
        type: 'covers',
        description: 'AC-LOGIN-02, AC-LOGIN-03, AC-LOGIN-04, AC-LOGIN-05, AC-LOGIN-06, AC-LOGIN-07, AC-LOGIN-09, AC-LOGIN-12, AC-LOGIN-16, AC-LOGIN-17',
      },
    },
    async ({ loginPage }) => {
      await runGroupedCases(invalidLoginCases(), {
        run: async ({ username, password, expectedError }) => {
          // Fresh state for every row.
          await loginPage.goto();
          await expect.soft(loginPage.errorMessage).toHaveCount(0);

          // Empty values are left untouched by fillCredentials.
          await loginPage.fillCredentials({ username, password });
          await loginPage.submit();

          await expect.soft(loginPage.errorMessage).toBeVisible();
          await expect.soft(loginPage.errorMessage).toHaveText(expectedError);
          await expect.soft(loginPage.page).toHaveURL(routePattern(ROUTES.login));
          await expect.soft(loginPage.errorButton).toBeVisible();
          await expect.soft(loginPage.usernameInput).toHaveClass(ERROR_CLASS);
          await expect.soft(loginPage.passwordInput).toHaveClass(ERROR_CLASS);
          await expect.soft(loginPage.inputErrorIcons).toHaveCount(2);
        },
      });
    },
  );
});
