import { test, expect, GUEST_STATE } from '@fixtures/index';

/**
 * Seed test for the Playwright Test Agents (planner / generator / healer).
 * It runs as a guest and only opens the login page; each agent prompt adds the
 * login steps it needs, so one seed serves every functional area.
 */
test.use({ storageState: GUEST_STATE });

test.describe('Seed', () => {
  test('seed', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();
  });
});
