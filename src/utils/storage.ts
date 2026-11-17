import type { BrowserContext, Cookie, Page } from '@playwright/test';

/** localStorage key that holds the cart, as a JSON array of product ids (e.g. "[4,0]"). */
export const CART_STORAGE_KEY = 'cart-contents';

/** Cookie that holds the session (its value is the username). */
export const SESSION_COOKIE = 'session-username';

/**
 * Reads the product ids stored in the cart, in add order. Returns `[]` when the key is missing.
 * The page must be on the app origin.
 */
export async function readCartIds(page: Page): Promise<number[]> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), CART_STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((id): id is number => typeof id === 'number')) {
    throw new Error(`Unexpected "${CART_STORAGE_KEY}" value: ${raw}`);
  }
  return parsed;
}

/**
 * Empties the cart by removing its storage key. The page must be on the app origin.
 * The UI does not notice the change, so the caller navigates (or reloads) afterwards.
 */
export async function clearCart(page: Page): Promise<void> {
  await page.evaluate((key) => window.localStorage.removeItem(key), CART_STORAGE_KEY);
}

/**
 * Resets the page to a logged-out, empty state: clears cookies, opens `/`,
 * then clears localStorage and sessionStorage for the app origin.
 */
export async function resetBrowserState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/** Returns the session cookie, or `undefined` when there is no session. */
export async function getSessionCookie(context: BrowserContext): Promise<Cookie | undefined> {
  const cookies = await context.cookies();
  return cookies.find((cookie) => cookie.name === SESSION_COOKIE);
}

/** Removes only the session cookie, simulating an expired or deleted session. */
export async function removeSessionCookie(context: BrowserContext): Promise<void> {
  await context.clearCookies({ name: SESSION_COOKIE });
}
