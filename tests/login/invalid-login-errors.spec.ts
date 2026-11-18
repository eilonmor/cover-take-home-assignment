import { test, expect, GUEST_STATE } from '@fixtures/index';
import { invalidLoginCases } from '@data/login-cases';
import { ROUTES, routePattern } from '@data/routes';
import { runGroupedCases } from '@utils/grouped';

// Spec: specs/01-login.md, scenario 1.2. Grouped: one isolated step per row of invalidLoginCases().
test.use({ storageState: GUEST_STATE });

/** The rows' own ACs, plus AC-LOGIN-09 (the red error state), which every row checks. */
const COVERS =
  'AC-LOGIN-02, AC-LOGIN-03, AC-LOGIN-04, AC-LOGIN-05, AC-LOGIN-06, AC-LOGIN-07, AC-LOGIN-09, AC-LOGIN-12, AC-LOGIN-16, AC-LOGIN-17';

test.describe('Login', () => {
  test(
    'TC-LOGIN-02 Invalid login attempts display the correct error message',
    { tag: ['@smoke', '@regression'], annotation: { type: 'covers', description: COVERS } },
    async ({ loginPage }) => {
      // Built here, not at module scope: test discovery must not need credentials for unselected tests.
      const cases = invalidLoginCases();
      const derived = [...new Set([...cases.map((row) => row.covers), 'AC-LOGIN-09'])].sort().join(', ');
      expect(derived, 'the covers annotation matches the covers fields of invalidLoginCases()').toBe(COVERS);

      await runGroupedCases(cases, {
        run: async ({ username, password, expectedError }) => {
          // Fresh state for every row.
          await loginPage.goto();
          await expect.soft(loginPage.errorMessage).toHaveCount(0);

          // Empty values are left untouched by fillCredentials.
          await loginPage.fillCredentials({ username, password });
          await loginPage.submit();

          // Hard guard: without an error the other checks would only time out one by one, so the
          // row fails fast here and runGroupedCases records it and moves on to the next row.
          await expect(loginPage.errorMessage).toBeVisible();
          await expect.soft(loginPage.errorMessage).toHaveText(expectedError);
          await expect.soft(loginPage.page).toHaveURL(routePattern(ROUTES.login));
          await expect.soft(loginPage.errorButton).toBeVisible();
          await expect.soft(loginPage.usernameInput).toHaveClass(loginPage.inputErrorClass);
          await expect.soft(loginPage.passwordInput).toHaveClass(loginPage.inputErrorClass);
          await expect.soft(loginPage.inputErrorIcons).toHaveCount(2);
        },
      });
    },
  );
});
