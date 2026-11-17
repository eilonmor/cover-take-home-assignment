import { protectedPageError } from './messages';
import type { ProductId } from './products';

/** App routes, relative to `baseURL`. */
export const ROUTES = {
  login: '/',
  inventory: '/inventory.html',
  details: (id: ProductId): string => `/inventory-item.html?id=${id}`,
  cart: '/cart.html',
  checkoutInfo: '/checkout-step-one.html',
  checkoutOverview: '/checkout-step-two.html',
  checkoutComplete: '/checkout-complete.html',
} as const;

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A full-URL pattern for a route, for `toHaveURL`. It works with any base URL.
 * A route with a query string (e.g. `ROUTES.details(4)`) must match it exactly; a route without one
 * accepts any query string. A trailing hash is always allowed.
 */
export function routePattern(route: string): RegExp {
  const [path = route, query] = route.split('?');
  const search = query === undefined ? '(?:\\?[^#]*)?' : escapeRegExp(`?${query}`);
  return new RegExp(`^[a-z]+://[^/]+${escapeRegExp(path)}${search}(?:#.*)?$`);
}

/** A page that requires a session, with the error the login page shows when it is opened without one. */
export interface ProtectedUrl {
  /** The URL to open (may include a query string). */
  readonly url: string;
  /** The path the error message cites (never includes the query string). */
  readonly path: string;
  readonly expectedError: string;
}

const protectedUrl = (url: string): ProtectedUrl => {
  const path = url.split('?')[0] ?? url;
  return { url, path, expectedError: protectedPageError(path) };
};

/** The 6 protected URLs from spec 05 §4. */
export const PROTECTED_URLS: readonly ProtectedUrl[] = [
  protectedUrl(ROUTES.inventory),
  protectedUrl(ROUTES.details(4)),
  protectedUrl(ROUTES.cart),
  protectedUrl(ROUTES.checkoutInfo),
  protectedUrl(ROUTES.checkoutOverview),
  protectedUrl(ROUTES.checkoutComplete),
];

/** How the session is missing in TC-NAV-02. */
export type SessionState = 'never logged in' | 'session cookie removed';

/** Both session states of TC-NAV-02, in run order. */
export const SESSION_STATES: readonly SessionState[] = ['never logged in', 'session cookie removed'];
