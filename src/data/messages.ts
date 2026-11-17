/**
 * Exact UI texts from the specs, so no spec file contains them as magic strings.
 */

/** Login error messages (spec 01 §4). */
export const LOGIN_ERRORS = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  noMatch: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
} as const;

/** Error shown on the login page after opening a protected page without a session (spec 05 §4). */
export const protectedPageError = (path: string): string =>
  `Epic sadface: You can only access '${path}' when you are logged in.`;

/** Checkout step one validation messages, in validation order (spec 04 §4). */
export const CHECKOUT_ERRORS = {
  firstName: 'Error: First Name is required',
  lastName: 'Error: Last Name is required',
  postalCode: 'Error: Postal Code is required',
} as const;

/** The `title` data-test text of each logged-in page. */
export const PAGE_TITLES = {
  inventory: 'Products',
  cart: 'Your Cart',
  checkoutInfo: 'Checkout: Your Information',
  checkoutOverview: 'Checkout: Overview',
  checkoutComplete: 'Checkout: Complete!',
} as const;

/** Static texts on the checkout overview and complete pages (spec 04 §4). */
export const CHECKOUT_TEXT = {
  paymentLabel: 'Payment Information:',
  paymentValue: 'SauceCard #31337',
  shippingLabel: 'Shipping Information:',
  shippingValue: 'Free Pony Express Delivery!',
  priceTotal: 'Price Total',
  completeHeader: 'Thank you for your order!',
  completeText: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  backHome: 'Back Home',
  ponyAlt: 'Pony Express',
} as const;

/** Burger menu item labels, in DOM order (spec 05 §4). */
export const MENU_ITEMS: readonly string[] = ['All Items', 'Dynamic Catalog', 'About', 'Logout', 'Reset App State'];

/** Target of the About menu link. */
export const ABOUT_URL = 'https://saucelabs.com/';
