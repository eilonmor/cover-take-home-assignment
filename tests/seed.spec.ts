import { test, expect } from '@playwright/test';

/**
 * Seed test for the Playwright Test Agents (planner / generator / healer).
 * It only opens the login page via baseURL; each agent prompt adds the
 * login steps it needs, so one seed serves every functional area.
 */
test.describe('Seed', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
});
