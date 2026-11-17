# Logout & Navigation — Functional Specification

## Application Overview

## 1. Overview & scope

Swag Labs (https://www.saucedemo.com) is a demo e-commerce SPA-like site. This spec covers site navigation (burger menu, header, footer, cross-page links), logout, session handling and access to protected pages. Verified on 2026-11-17 with standard_user and the four other users.

In scope: burger menu open/close and items; All Items, About, Logout and Reset App State; session cookie; protected-URL blocking; browser Back/Forward after logout; header/footer links; unknown routes.
Out of scope (owned by other specs): login form validation (Login), cart contents (Cart), product list/sorting (Products), checkout form/totals (Checkout).

Conventions: tests use `getByTestId` with testIdAttribute = `data-test`. Base URL https://www.saucedemo.com. Password for all users is `secret_sauce`. Menu item ids use underscores (e.g. `inventory_sidebar_link`), data-test values use hyphens.

## 2. User stories

- US-NAV-01: As a logged-in shopper, I want to open and close the burger menu from any page so I can reach site-level actions.
- US-NAV-02: As a shopper, I want "All Items" to take me back to the product list from any page (cart, details, checkout steps, complete).
- US-NAV-03: As a shopper, I want to log out so that my session ends and the next person on the device cannot use my account.
- US-NAV-04: As the business, I want every protected page to be inaccessible without a session, with a clear message, so unauthenticated users cannot view store data.
- US-NAV-05: As a shopper, I want "Reset App State" to clear my cart so I can start over.
- US-NAV-06: As a shopper, I want an About link and footer social links so I can learn about the company.
- US-NAV-07: As a shopper, I want my session to be identified by a cookie and to be forced to log in again if that session is removed.
- US-NAV-08: As a shopper, I want consistent header (logo, cart link) navigation on all pages.

## 3. Acceptance criteria

- AC-NAV-01 (US-NAV-01): Given I am logged in on /inventory.html, When I click `react-burger-menu-btn`, Then the menu opens and shows, in order, items "All Items", "Dynamic Catalog", "About", "Logout", "Reset App State". The menu wrapper `.bm-menu-wrap` has aria-hidden="true" when closed and "false" when open.
- AC-NAV-02 (US-NAV-01): Given the menu is open, When I click `react-burger-cross-btn` (or press Escape), Then the menu closes (aria-hidden="true") and I stay on the same page.
- AC-NAV-03 (US-NAV-01): Given I am on the cart, a product details page or a checkout page, When I click `react-burger-menu-btn`, Then the menu opens with the same five items.
- AC-NAV-04 (US-NAV-02): Given I am on /cart.html, /inventory-item.html?id=4, /checkout-step-one.html, /checkout-step-two.html or /checkout-complete.html, When I open the menu and click `inventory-sidebar-link` ("All Items"), Then I land on /inventory.html showing the "Products" title.
- AC-NAV-05 (US-NAV-03): Given I am logged in, When I open the menu and click `logout-sidebar-link`, Then I am redirected to `/` (login page), the username and password fields are empty, no error message is shown, and the `session-username` cookie is removed.
- AC-NAV-06 (US-NAV-04): Given I am not logged in (fresh state or after logout), When I navigate directly to any protected URL in the table in section 4, Then access is denied and the login page is shown with the exact error message for that URL; no protected content is rendered.
- AC-NAV-07 (US-NAV-03, US-NAV-04): Given I logged out, When I press the browser Back button, Then I remain on the login page (never see inventory) and the error "Epic sadface: You can only access '/inventory.html' when you are logged in." is displayed; When I press Forward, Then I still do not see protected content.
- AC-NAV-08 (US-NAV-03): Given I added items to the cart and logged out, When I log in again as the same user in the same browser, Then the cart contents are still present (cart is stored client-side in localStorage key `cart-contents`, not cleared on logout). Note the badge renders asynchronously; assert with auto-waiting.
- AC-NAV-09 (US-NAV-05): Given the cart has items, When I open the menu and click `reset-sidebar-link`, Then the cart badge (`shopping-cart-badge`) disappears and `cart-contents` is emptied; the user remains on the same page; the menu stays open (observed).
- AC-NAV-10 (US-NAV-05): Given I clicked Reset App State on /inventory.html, When the page is reloaded, Then every product button reads "Add to cart" (intended: buttons revert; see deviation D1 for the live site without reload).
- AC-NAV-11 (US-NAV-06): Given the menu is open, Then `about-sidebar-link` has href "https://saucelabs.com/". Footer links: `social-x` -> https://x.com/saucelabs, `social-facebook` -> https://www.facebook.com/saucelabs, `social-linkedin` -> https://www.linkedin.com/company/sauce-labs/, all with target="_blank". Footer text: "© 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy".
- AC-NAV-12 (US-NAV-07): Given I am logged in, Then cookie `session-username` (path "/", not httpOnly, SameSite Lax) holds the username. When I delete it and navigate to /cart.html, Then I am redirected to `/` with "Epic sadface: You can only access '/cart.html' when you are logged in."
- AC-NAV-13 (US-NAV-08): Given I am logged in on any page, Then the header shows the logo text "Swag Labs" and `shopping-cart-link`; clicking the cart link navigates to /cart.html from inventory, details and checkout pages.
- AC-NAV-14 (US-NAV-04): Given any state, When I navigate to an unknown route such as /does-not-exist.html, Then no protected content is exposed (see edge cases for observed behavior).
- AC-NAV-15 (US-NAV-03): Logout works identically for all users (standard, problem, error, visual, performance_glitch): returns to `/`, cookie cleared, protected URLs blocked afterwards.

## 4. Business rules & UI contract

### Burger menu
| Item | Label | data-test | element id | href |
|---|---|---|---|---|
| Open button | (Open Menu) | none | react-burger-menu-btn | - |
| Close button | (Close Menu) | none | react-burger-cross-btn | - |
| All Items | All Items | inventory-sidebar-link | inventory_sidebar_link | # |
| Dynamic Catalog | Dynamic Catalog | dynamic-catalog-sidebar-link | dynamic_catalog_sidebar_link | # |
| About | About | about-sidebar-link | about_sidebar_link | https://saucelabs.com/ |
| Logout | Logout | logout-sidebar-link | logout_sidebar_link | # |
| Reset App State | Reset App State | reset-sidebar-link | reset_sidebar_link | # |

The burger open/close buttons have no data-test attribute; use `locator('#react-burger-menu-btn')` / `locator('#react-burger-cross-btn')`. The menu slides in (about 0.5s animation); wait for the item to be visible or aria-hidden="false" before clicking. Menu items stay in the DOM when closed; CSS visibility remains "visible" so rely on aria-hidden on `.bm-menu-wrap`, not toBeHidden on items.

### Protected-URL table (unauthenticated)
| URL | Resulting URL | Exact message (`error` data-test) |
|---|---|---|
| /inventory.html | redirects to `/` | Epic sadface: You can only access '/inventory.html' when you are logged in. |
| /inventory-item.html?id=4 | redirects to `/` | Epic sadface: You can only access '/inventory-item.html' when you are logged in. |
| /cart.html | redirects to `/` | Epic sadface: You can only access '/cart.html' when you are logged in. |
| /checkout-step-one.html | redirects to `/` | Epic sadface: You can only access '/checkout-step-one.html' when you are logged in. |
| /checkout-step-two.html | redirects to `/` | Epic sadface: You can only access '/checkout-step-two.html' when you are logged in. |
| /checkout-complete.html | redirects to `/` | Epic sadface: You can only access '/checkout-complete.html' when you are logged in. |

Note: the message cites the path without the query string. All six routes redirect to `/` on the client side, after the target page has started loading. Reading the URL immediately after `goto` can still show the protected path, so tests must use auto-waiting assertions (`await expect(page).toHaveURL('/')`). This was verified in review on 2026-11-17 in a fresh context per URL; an earlier exploration note saying "stays put" was a timing artifact.

### Session mechanism
- Cookie `session-username` = username, domain www.saucedemo.com, path "/", not httpOnly, not secure, SameSite Lax, ~persistent expiry. Set at login, removed at logout.
- localStorage: `cart-contents` (JSON array of product ids, e.g. "[4]") persists across logout; it is not per user. Also analytics keys `backtrace-guid`, `backtrace-last-active` (ignore).

### Header / footer
- Logo text "Swag Labs" (class app_logo), page title "Products" (data-test `title`) on inventory.
- Cart link `shopping-cart-link`, badge `shopping-cart-badge`. Footer links as in AC-NAV-11 (data-test `social-x`, `social-facebook`, `social-linkedin`). Footer text "© 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy" (the year may change; assert with regex /Sauce Labs\. All Rights Reserved/).
- Page title (document.title) is "Swag Labs" everywhere.
- Cart-page "Continue Shopping" is `continue-shopping`; details page "Back to products" is `back-to-products`.

## 5. Edge cases & negative paths

- Unknown route /does-not-exist.html (logged out and logged in): URL stays; page is the blank Swag Labs shell with no content and no error message (not a 404 page, no redirect). Intended: no protected data exposed. Observed, not an acceptance criterion beyond "nothing sensitive".
- Deleting the session cookie while on a protected page does not immediately log out; the block is applied on the next navigation/reload.
- Logout then Back: stays on login with the inventory error; Forward: still login page.
- Logout from checkout pages is available via the menu and clears the session; the cart survives (AC-NAV-08).
- Cart badge after re-login renders asynchronously; an immediate count may be 0 (flaky for tests; use expect auto-wait).
- After completing an order the `cart-contents` is emptied.
- Pressing Escape closes the menu.
- Double-click open button / clicking All Items while already on inventory: stays on /inventory.html.

## 6. Known deviations per user

- D1 (all users, including standard_user): Reset App State empties the cart and badge but inventory buttons stay as "Remove" until reload (e.g. `remove-sauce-labs-backpack` still present). Intended: buttons revert to "Add to cart". Tests assert the intended behavior only after reload, and may mark the immediate check as a known-issue (test.fail / annotation).
- Menu stays open after Reset App State (all users).
- problem_user, error_user, visual_user, performance_glitch_user: the menu has the same 5 items; logout, reset and protected-URL blocking behaved the same as standard_user in the sampled flow. Adding to cart via the backpack button worked for each in that flow. No per-user logout deviations were found. performance_glitch_user is slower on login only.
- The first sample suggested the cart badge is missing right after re-login; this is a render timing race, not data loss.

## 7. Test candidate summary

| TC ID | AC ref | Title | Priority | Tags | Selected |
|---|---|---|---|---|---|
| TC-NAV-01 | AC-NAV-05 | Logout returns to login page with empty fields and cleared session cookie | P1 | @smoke | yes |
| TC-NAV-02 | AC-NAV-06, AC-NAV-12 | Protected pages are blocked without a valid session (grouped, 6 URLs × 2 session states = 12 cases) | P1 | @smoke @regression | yes |
| TC-NAV-03 | AC-NAV-07 | Browser Back/Forward after logout does not expose inventory | P1 | @regression | yes |
| TC-NAV-04 | AC-NAV-09, AC-NAV-10 | Reset App State clears the cart and badge; buttons revert after reload | P2 | @regression | yes |
| TC-NAV-05 | AC-NAV-01, AC-NAV-02 | Burger menu opens with 5 items and closes with the X button | P2 | @smoke | yes |
| TC-NAV-06 | AC-NAV-04 | All Items returns to inventory from cart, details, and checkout pages | P2 | @regression | yes |
| TC-NAV-07 | AC-NAV-12 | Deleting the session cookie forces re-login on next navigation | P1 | @regression | no (merged into TC-NAV-02, state B) |
| TC-NAV-08 | AC-NAV-08 | Cart contents persist across logout and re-login | P2 | @regression | no |
| TC-NAV-09 | AC-NAV-11 | About link and footer social links have correct hrefs and target | P3 | @regression | no |
| TC-NAV-10 | AC-NAV-13 | Header logo and cart link work from inventory, details and checkout | P3 | @regression | no |
| TC-NAV-11 | AC-NAV-14 | Unknown route does not expose content | P3 | @regression | no |
| TC-NAV-12 | AC-NAV-15 | Logout works for all user types | P3 | @regression | no |
| TC-NAV-13 | AC-NAV-03 | Menu opens from cart, details and checkout pages | P3 | @regression | no |

## Test Scenarios

### 1. Logout & Navigation — Selected

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-NAV-01 Logout returns to login page with empty fields and cleared session cookie

**File:** `tests/navigation/logout-clears-session.spec.ts`

**Steps:**
  1. Log in as standard_user / secret_sauce via username, password, login-button
    - expect: URL is /inventory.html
    - expect: Cookie session-username equals standard_user
  2. Click #react-burger-menu-btn, wait for menu open, click logout-sidebar-link
    - expect: URL is https://www.saucedemo.com/
    - expect: login-button visible
    - expect: username and password inputs have empty values
    - expect: error element not shown
    - expect: Cookie session-username no longer exists

#### 1.2. TC-NAV-02 Protected pages are blocked without a valid session

**File:** `tests/navigation/protected-urls-blocked.spec.ts`

**Type:** grouped verification test (see [specs/README.md](README.md#grouped-verification-tests)). Every URL × session-state combination is one isolated `test.step` that uses soft assertions. If an action throws, the error is caught and recorded against that case, and the test continues with the next case. The test fails at the end if any case failed and passes only if all 12 passed.

**Session states**
- **A: never logged in.** A brand-new browser context with no cookies and no storage. Covers AC-NAV-06.
- **B: session cookie removed.** In a new browser context, log in as `standard_user` and confirm the `session-username` cookie exists. Then remove it (`context.clearCookies({ name: 'session-username' })`). Covers AC-NAV-12.

**URLs** (each is run in state A and in state B):

| # | URL | Expected error text (getByTestId('error')) |
|---|-----|--------------------------------------------|
| 1 | /inventory.html | `Epic sadface: You can only access '/inventory.html' when you are logged in.` |
| 2 | /inventory-item.html?id=4 | `Epic sadface: You can only access '/inventory-item.html' when you are logged in.` |
| 3 | /cart.html | `Epic sadface: You can only access '/cart.html' when you are logged in.` |
| 4 | /checkout-step-one.html | `Epic sadface: You can only access '/checkout-step-one.html' when you are logged in.` |
| 5 | /checkout-step-two.html | `Epic sadface: You can only access '/checkout-step-two.html' when you are logged in.` |
| 6 | /checkout-complete.html | `Epic sadface: You can only access '/checkout-complete.html' when you are logged in.` |

The message names the path without its query string.

**Steps (per case, in its own `test.step` named "<state> <url>", in its own new browser context):**
  1. Prepare the session state (A or B, as above).
  2. Navigate directly to the URL with `page.goto(url)`.
    - expect (soft): URL becomes `https://www.saucedemo.com/` (use the auto-waiting `toHaveURL`, because the redirect is client-side).
    - expect (soft): getByTestId('error') has the row's exact text.
    - expect (soft): getByTestId('login-button') is visible.
    - expect (soft): no protected content is rendered: getByTestId('shopping-cart-link'), which is in the header of every authenticated page, and getByTestId('inventory-container') are not present.
  3. Close the case's browser context. Whatever the outcome, continue with the next case.

**Final verdict:** passes only if all 12 cases passed every check.

#### 1.3. TC-NAV-03 Browser Back/Forward after logout does not expose inventory

**File:** `tests/navigation/back-forward-after-logout.spec.ts`

**Steps:**
  1. Log in as standard_user, open menu, click logout-sidebar-link
    - expect: URL is /
  2. Call page.goBack()
    - expect: login-button visible
    - expect: inventory-container not present
    - expect: error shows "Epic sadface: You can only access '/inventory.html' when you are logged in."
  3. Call page.goForward()
    - expect: login-button visible
    - expect: inventory-container still not present

#### 1.4. TC-NAV-04 Reset App State clears the cart and badge; buttons revert after reload

**File:** `tests/navigation/reset-app-state.spec.ts`

**Steps:**
  1. Log in as standard_user. Click add-to-cart-sauce-labs-backpack and add-to-cart-sauce-labs-bike-light.
    - expect: shopping-cart-badge shows 2.
  2. Click #react-burger-menu-btn, wait for the menu to open, then click reset-sidebar-link.
    - expect: shopping-cart-badge is not present.
    - expect: localStorage `cart-contents` is empty (missing or `[]`).
    - expect: URL is still /inventory.html.
    - Known deviation D1: remove-sauce-labs-backpack is still shown before a reload. Record it as an annotation (`test.info().annotations`, type `known-issue`) instead of asserting it, so the test documents the bug without failing.
  3. Reload the page.
    - expect: add-to-cart-sauce-labs-backpack and add-to-cart-sauce-labs-bike-light are visible, and no `remove-*` buttons are present.
    - expect: shopping-cart-badge is still not present.

#### 1.5. TC-NAV-05 Burger menu opens with 5 items and closes with the X button

**File:** `tests/navigation/burger-menu.spec.ts`

**Steps:**
  1. Log in; assert .bm-menu-wrap aria-hidden is "true"
    - expect: Menu closed
  2. Click #react-burger-menu-btn
    - expect: aria-hidden becomes "false"
    - expect: Items in order via .bm-item-list a: All Items, Dynamic Catalog, About, Logout, Reset App State
    - expect: data-test values inventory-sidebar-link, dynamic-catalog-sidebar-link, about-sidebar-link, logout-sidebar-link, reset-sidebar-link are visible
    - expect: about-sidebar-link href is https://saucelabs.com/
  3. Click #react-burger-cross-btn
    - expect: aria-hidden becomes "true"
    - expect: URL still /inventory.html

#### 1.6. TC-NAV-06 All Items returns to inventory from cart, details, and checkout pages

**File:** `tests/navigation/all-items-navigation.spec.ts`

**Steps:**
  1. Log in; add sauce-labs-backpack (add-to-cart-sauce-labs-backpack); for each page: cart (shopping-cart-link), details (item-4-title-link on inventory), checkout-step-one (cart -> checkout), checkout-step-two (fill firstName a, lastName b, postalCode 1, continue)
    - expect: Each page URL is as expected
  2. On each page open the menu (#react-burger-menu-btn) and click inventory-sidebar-link
    - expect: URL is /inventory.html
    - expect: title data-test shows "Products"

### 2. Logout & Navigation — Backlog

**Seed:** `tests/seed.spec.ts`

#### 2.1. TC-NAV-07 Deleting the session cookie forces re-login on next navigation (merged into TC-NAV-02)

**File:** n/a (covered by `tests/navigation/protected-urls-blocked.spec.ts`, session state B)

**Steps:**
  1. Log in as standard_user, remove the `session-username` cookie, then navigate to any protected URL.
    - expect: Redirected to / with the matching "You can only access" error. All 6 URLs are verified in TC-NAV-02, state B.

#### 2.2. TC-NAV-08 Cart contents persist across logout and re-login

**File:** `tests/navigation/cart-persists-logout.spec.ts`

**Steps:**
  1. Log in, add add-to-cart-sauce-labs-onesie, logout via menu, log in again
    - expect: shopping-cart-badge eventually shows 1 (auto-wait)
    - expect: remove-sauce-labs-onesie visible

#### 2.3. TC-NAV-09 About link and footer social links have correct hrefs and target

**File:** `tests/navigation/external-links.spec.ts`

**Steps:**
  1. Log in; read hrefs of social-x, social-facebook, social-linkedin
    - expect: https://x.com/saucelabs
    - expect: https://www.facebook.com/saucelabs
    - expect: https://www.linkedin.com/company/sauce-labs/
    - expect: target=_blank on each
    - expect: footer text matches /Sauce Labs\. All Rights Reserved/
  2. Open menu and read about-sidebar-link href (do not follow)
    - expect: https://saucelabs.com/

#### 2.4. TC-NAV-10 Header logo and cart link work from inventory, details and checkout

**File:** `tests/navigation/header-links.spec.ts`

**Steps:**
  1. Log in; on inventory, details (item-4-title-link) and checkout-step-one click shopping-cart-link
    - expect: Logo text "Swag Labs" visible on each page
    - expect: URL is /cart.html each time

#### 2.5. TC-NAV-11 Unknown route does not expose content

**File:** `tests/navigation/unknown-route.spec.ts`

**Steps:**
  1. Logged out, go to /does-not-exist.html; then log in and go to it again
    - expect: URL stays /does-not-exist.html
    - expect: no inventory-container, no product data
    - expect: no error message (observed)

#### 2.6. TC-NAV-12 Logout works for all user types

**File:** `tests/navigation/logout-all-users.spec.ts`

**Steps:**
  1. Parameterize over problem_user, error_user, visual_user, performance_glitch_user: log in, open menu, click logout-sidebar-link
    - expect: URL /
    - expect: cookie removed
    - expect: goto /cart.html shows "Epic sadface: You can only access '/cart.html' when you are logged in."

#### 2.7. TC-NAV-13 Menu opens from cart, details and checkout pages

**File:** `tests/navigation/menu-on-all-pages.spec.ts`

**Steps:**
  1. Log in and visit cart, details and checkout-step-one; on each click #react-burger-menu-btn
    - expect: aria-hidden "false" and five items visible on each page
    - expect: Close via #react-burger-cross-btn returns aria-hidden "true" without changing URL
