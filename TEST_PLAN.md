# Test Plan — saucedemo.com E2E

## 1. Overview

**System under test:** [Swag Labs](https://www.saucedemo.com), Sauce Labs' public e-commerce demo. It has a login screen, a 6-product catalog with sorting and details pages, a cart kept in the browser's `localStorage`, a three-step checkout, and a burger menu with logout and "Reset App State". Several demo accounts are deliberately broken (`problem_user`, `error_user`, `visual_user`, `performance_glitch_user`).

**Approach:** the specs come first, then the tests.
- The Playwright **planner** agent explored the live site and wrote one product-style spec per area ([`specs/`](specs/README.md)): user stories, Given/When/Then acceptance criteria, the UI contract, edge cases and the observed defects.
- Tests assert the **intended** behavior from those specs, not whatever the site happens to do. Every test traces TC → AC → US through its title and its `covers` annotation.
- A known site defect is never an acceptance criterion. It is documented with a `known-issue` annotation, so a full run stays green and the defect is still visible in the report.

**Scope:** the 5 areas of the assignment, with at most 6 tests each, so 30 tests in total. They run on Chromium, Firefox and WebKit (desktop viewports), in parallel, with `retries: 1`. Every test uses `standard_user`, except where a test case lists other accounts.

| Area | Spec | Tests | Folder |
|------|------|-------|--------|
| Login | [01-login.md](specs/01-login.md) | 6 (2 grouped) | `tests/login/` |
| Products | [02-products.md](specs/02-products.md) | 6 | `tests/products/` |
| Cart | [03-cart.md](specs/03-cart.md) | 6 | `tests/cart/` |
| Checkout | [04-checkout.md](specs/04-checkout.md) | 6 (1 grouped) | `tests/checkout/` |
| Logout & Navigation | [05-logout-navigation.md](specs/05-logout-navigation.md) | 6 (1 grouped) | `tests/navigation/` |

`tests/seed.spec.ts` is not a test case. It is the seed the Playwright agents start from, and it only opens the login page. It runs with the suite, so a full run reports 31 tests per browser.

**Priority:** P1 is a core flow that must not break (a release blocker). P2 is important behavior with a workaround. P3 is a detail or a rare path.
**Tags:** `@smoke` is a fast check of the critical path (`npm run test:smoke`). `@regression` is the wider suite (`npm run test:regression`). Some tests carry both tags.

## 2. Grouped verification tests

Each area has a budget of 6 tests. Checks with the same shape (one action, many inputs) are grouped into **one data-driven test**, and each case is still verified on its own:

- Each case runs as its own named `test.step` (`#<n> <case>`), starts from a fresh state, and has its own timeout.
- Checks inside a case are `expect.soft`. If an action throws, the error is recorded against that case and the next case still runs.
- The test fails if any case failed. It attaches a `grouped-summary.md` table (case, status, first error) and a `grouped: N cases, P passed, F failed` annotation.

| Test | Cases | What varies |
|------|-------|-------------|
| TC-LOGIN-02 | 13 | Invalid credentials: locked out, wrong password or user, empty fields, wrong case, spaces, injection-like input |
| TC-LOGIN-04 | 4 | Accepted accounts: `problem_user`, `performance_glitch_user`, `error_user`, `visual_user` |
| TC-CHK-03 | 10 | Cart combinations for item total, tax and total |
| TC-NAV-02 | 12 | 6 protected URLs × 2 session states (never logged in, session cookie removed) |

So the 30 tests verify 65 cases in total: 26 single tests plus 39 grouped cases.

## 3. Test cases

The steps are condensed. The full scenarios are in the spec files. "Badge N" means the cart badge shows N, and badge 0 means it is absent.

### 3.1 Login

All Login tests run as a guest (logged out).

| Test ID | Description | Steps | Expected result | Priority | Tags | ACs | File |
|---------|-------------|-------|-----------------|----------|------|-----|------|
| TC-LOGIN-01 | Standard user logs in successfully | Open `/`; fill `standard_user` / `secret_sauce`; click Login | URL `/inventory.html`; title "Products"; 6 items; no error | P1 | @smoke | AC-LOGIN-01 | `tests/login/standard-user-login.spec.ts` |
| TC-LOGIN-02 | Invalid login attempts show the correct error (grouped, 13 cases) | Per case: open `/`; fill the case's username and password (an empty value leaves the field untouched); click Login | Exact error text for the case; URL still `/`; dismiss (X) button visible; both inputs in the error state with 2 error icons | P1 | @smoke @regression | AC-LOGIN-02..07, 09, 12, 16, 17 | `tests/login/invalid-login-errors.spec.ts` |
| TC-LOGIN-03 | The error can be dismissed and the user can then log in | Click Login with empty fields; click the error's X; log in as `standard_user` | "Username is required" shown, then gone along with the error icons; inventory "Products" reached | P2 | @regression | AC-LOGIN-08 | `tests/login/dismiss-error.spec.ts` |
| TC-LOGIN-04 | All other accepted accounts can log in (grouped, 4 users) | Per user: reset cookies and storage; log in | URL `/inventory.html`; title "Products"; 6 items; no error. `performance_glitch_user` gets a 15 s timeout. Images and prices are not asserted (known per-user defects). | P2 | @regression | AC-LOGIN-15 | `tests/login/accepted-accounts-login.spec.ts` |
| TC-LOGIN-05 | The Enter key submits the login form | Fill valid credentials; press Enter in the password field | URL `/inventory.html`; title "Products" | P2 | @regression | AC-LOGIN-11 | `tests/login/enter-key-submit.spec.ts` |
| TC-LOGIN-06 | Login form initial state | Open `/`; then type the password | Both inputs visible and empty, with placeholders "Username" / "Password"; password is `type="password"`; Login button value "Login"; no error. After typing, the password stays masked and holds the value. | P3 | @regression | AC-LOGIN-10 | `tests/login/login-form-initial-state.spec.ts` |

### 3.2 Products

Products tests start logged in as `standard_user`, with an empty cart.

| Test ID | Description | Steps | Expected result | Priority | Tags | ACs | File |
|---------|-------------|-------|-----------------|----------|------|-----|------|
| TC-PROD-01 | The inventory shows 6 products with exact catalog data | Open the inventory | Title "Products"; 6 products with names and prices in A–Z order; exact descriptions; each image visible, with alt = name and no `sl-404` placeholder; each button "Add to cart"; badge 0 | P1 | @smoke | AC-PROD-01, 02 | `tests/products/inventory-catalog.spec.ts` |
| TC-PROD-02 | Sort dropdown default and options | Open the inventory; inspect the sort dropdown | Value `az`, active option "Name (A to Z)"; 4 options in order with values az / za / lohi / hilo; list in A–Z order | P2 | @regression | AC-PROD-03, 04 | `tests/products/sort-options.spec.ts` |
| TC-PROD-03 | Each sort option orders the products correctly | Select Z–A, price low–high, price high–low, then A–Z | After each: names and prices in the expected order (Bolt T-Shirt before the Red T-Shirt on the $15.99 tie); 6 items; URL unchanged | P1 | @smoke @regression | AC-PROD-05 | `tests/products/sort-order.spec.ts` |
| TC-PROD-04 | Open details by name, return with "Back to products" | Click the Backpack name; check; go back; repeat for the Red T-Shirt | `?id=4`, then `?id=3` (ids don't follow list order); name, price and description from the catalog; real image with alt; "Add to cart" and "Back to products" buttons; back returns to the inventory with 6 items | P1 | @smoke | AC-PROD-06, 08, 09 | `tests/products/details-via-name.spec.ts` |
| TC-PROD-05 | Open details by image | Click the Bike Light image; go back; click the Fleece Jacket image | `?id=0`, then `?id=5`; name, price and description match the catalog; no placeholder image | P2 | @regression | AC-PROD-07, 08 | `tests/products/details-via-image.spec.ts` |
| TC-PROD-06 | Add/remove on the inventory toggles the button and the badge | Add Backpack, add Bike Light, remove both; add the Red T-Shirt (special-character slug) | Button becomes "Remove", badge 1 → 2; the other 4 buttons stay "Add to cart"; badge 1 → 0 on removal; Red T-Shirt shows "Remove", badge 1 | P1 | @smoke | AC-PROD-10, 11 | `tests/products/inventory-add-remove.spec.ts` |

### 3.3 Cart

Cart tests start logged in as `standard_user`, with an empty cart.

| Test ID | Description | Steps | Expected result | Priority | Tags | ACs | File |
|---------|-------------|-------|-----------------|----------|------|-----|------|
| TC-CART-01 | The badge is hidden when the cart is empty and matches the item count | Open the inventory; add all 6 products one by one; open the cart | Badge 0 at first, then 1, 2 … 6 after each add; on `/cart.html` the badge is still 6 | P1 | @smoke | AC-CART-01, 02, 03 | `tests/cart/badge-count.spec.ts` |
| TC-CART-02 | The cart lists items with the correct quantity, name, description and price | Add Backpack and Bike Light; open the cart | Title "Your Cart"; "QTY" and "Description" headers; Continue Shopping and Checkout visible; both rows in order with catalog name, price and description and quantity 1; a Remove button per row; no quantity input or stepper | P1 | @smoke | AC-CART-04, 05, 06 | `tests/cart/cart-contents.spec.ts` |
| TC-CART-03 | Removing from the cart updates the rows, the badge and the inventory | Add 3 items; open the cart; remove Bike Light; Continue Shopping; reopen the cart and remove the rest | 2 rows left without a reload, badge 2; on the inventory Bike Light shows "Add to cart" and the others "Remove"; finally 0 rows, badge 0, headers and buttons still shown | P1 | @smoke | AC-CART-07, 08, 03 | `tests/cart/remove-from-cart.spec.ts` |
| TC-CART-04 | Continue Shopping and a reload keep the cart | Add Fleece Jacket and Onesie; open the cart; reload; Continue Shopping; open a details page; go back; open the cart | Same 2 rows in the same order after the reload; badge 2 throughout; Remove buttons on the inventory and the details page; still 2 rows at the end | P1 | @regression | AC-CART-10, 14 | `tests/cart/cart-persistence.spec.ts` |
| TC-CART-05 | Items appear in add order, including one added from a details page | Add Fleece Jacket, then Backpack; open Bike Light details and add it; open the cart | Badge 3; rows in add order (Fleece Jacket, Backpack, Bike Light), not catalog order | P2 | @regression | AC-CART-13, 16 | `tests/cart/cart-order.spec.ts` |
| TC-CART-06 | Checkout goes to step one, and an item name opens its details | Add Backpack; open the cart; click the item name; return to the cart; click Checkout | Details page `?id=4` with the name and a Remove button; then `/checkout-step-one.html` | P2 | @smoke | AC-CART-11, 15 | `tests/cart/cart-navigation.spec.ts` |

### 3.4 Checkout

Checkout tests start logged in as `standard_user`, with an empty cart. The customer is Jane / Doe / 12345.

| Test ID | Description | Steps | Expected result | Priority | Tags | ACs | File |
|---------|-------------|-------|-----------------|----------|------|-----|------|
| TC-CHK-01 | End-to-end happy path with two items | Add Backpack and Bike Light; cart → Checkout; fill the form; Continue; Finish | Step one: title, empty inputs, no error. Overview: both rows with quantity 1; "Item total: $39.98", "Tax: $3.20", "Total: $43.18". Complete: title, "Thank you for your order!", dispatch text, pony image; badge 0 | P1 | @smoke | AC-CHK-01, 07, 09–13, 15 | `tests/checkout/happy-path.spec.ts` |
| TC-CHK-02 | Step one required-field validation: order, texts and dismiss | Continue with empty fields; fill first name, Continue; fill last name, Continue; dismiss the error; clear the first name, fill the postal code, Continue | The URL stays on step one. Errors appear in order: First Name, Last Name, Postal Code required. After the dismiss the error is gone and Jane / Doe are kept. The first name is validated again before the others. | P1 | @smoke @regression | AC-CHK-02, 03, 04, 05 | `tests/checkout/step-one-validation.spec.ts` |
| TC-CHK-03 | Tax and total are correct for every cart combination (grouped, 10 carts) | Per cart: clear the cart; add the cart's items; check out to the overview | The 3 labels equal the observed values for that cart, **and** independently equal the rule: item total = sum of prices, tax = 8 % rounded half-up to the cent, total = item total + tax (integer cents) | P1 | @regression | AC-CHK-11, 12, 13 | `tests/checkout/tax-and-total.spec.ts` |
| TC-CHK-04 | The overview item list and static info match the cart | Add Fleece Jacket, then Onesie; check out to the overview | Badge 2; rows in add order with quantity 1; payment "SauceCard #31337", shipping "Free Pony Express Delivery!", "Price Total" header; 57.98 / 4.64 / 62.62; Cancel and Finish visible | P2 | @regression | AC-CHK-09, 10 | `tests/checkout/overview-content.spec.ts` |
| TC-CHK-05 | Cancel on step one and on step two keeps the cart | Start checkout with 2 items; Cancel; Checkout again, fill the form, Continue; Cancel on the overview; open the cart | Step-one Cancel → `/cart.html` with 2 rows and badge 2. Overview Cancel → `/inventory.html` (not the cart), badge 2, both Remove buttons. Cart still has 2 rows. | P2 | @regression | AC-CHK-08, 14 | `tests/checkout/cancel.spec.ts` |
| TC-CHK-06 | Complete page, emptied cart and Back Home | Place an order for the Onesie; click Back Home; open the cart | Complete page texts, pony image with alt "Pony Express", button "Back Home", badge 0; then `/inventory.html` with badge 0 and Onesie "Add to cart"; cart has 0 rows | P1 | @smoke | AC-CHK-15, 16, 17 | `tests/checkout/complete-and-back-home.spec.ts` |

### 3.5 Logout & Navigation

| Test ID | Description | Steps | Expected result | Priority | Tags | ACs | File |
|---------|-------------|-------|-----------------|----------|------|-----|------|
| TC-NAV-01 | Logout returns to the login page with empty fields and clears the session cookie | Logged in: open the inventory; menu → Logout | Before: the `session-username` cookie holds the user. After: URL `/`, Login button visible, empty inputs, no error, cookie gone | P1 | @smoke | AC-NAV-05 | `tests/navigation/logout-clears-session.spec.ts` |
| TC-NAV-02 | Protected pages are blocked without a valid session (grouped, 12 cases) | Guest. Per case: reset the browser state; for state B, log in through the form and then delete the session cookie; open the protected URL | Redirect to `/`; exact error "You can only access '<path>' when you are logged in."; Login button visible; no header cart link and no inventory rendered | P1 | @smoke @regression | AC-NAV-06, 12 | `tests/navigation/protected-urls-blocked.spec.ts` |
| TC-NAV-03 | Browser Back/Forward after logout does not expose the inventory | Logged in: open the inventory; Logout; Back; Forward | After Back: login page with the `/inventory.html` access error, no inventory. After Forward: still `/`, login page, no inventory | P1 | @regression | AC-NAV-07 | `tests/navigation/back-forward-after-logout.spec.ts` |
| TC-NAV-04 | Reset App State clears the cart and the badge; buttons revert after a reload | Logged in: add 2 items; menu → Reset App State; reload | Badge 0, `cart-contents` empty, URL unchanged. After the reload: both "Add to cart" buttons, no Remove buttons, badge 0. Defect D1 is recorded as a `known-issue` while it shows. | P2 | @regression | AC-NAV-09, 10 | `tests/navigation/reset-app-state.spec.ts` |
| TC-NAV-05 | The burger menu opens with 5 items and closes with the X button | Logged in: open the menu; close it with X | Closed (`aria-hidden="true"`) → open (`"false"`) with All Items, Dynamic Catalog, About, Logout, Reset App State in order; About links to `https://saucelabs.com/`; closed again, URL unchanged | P2 | @smoke | AC-NAV-01, 02 | `tests/navigation/burger-menu.spec.ts` |
| TC-NAV-06 | All Items returns to the inventory from every page | Logged in: one step each for the cart, details, checkout step one, step two and complete; on each, menu → All Items | Each page is reached; All Items leads to `/inventory.html` with title "Products" | P2 | @regression | AC-NAV-04 | `tests/navigation/all-items-navigation.spec.ts` |

## 4. Covered scenarios

- **Authentication:** a valid login by click and by Enter, every accepted demo account, 13 invalid-input variants with exact error texts and error states, dismissing an error, the form's initial state, logout, and clearing the session cookie.
- **Access control:** all 6 protected URLs, both for a guest who never logged in and for a deleted session cookie; history navigation after logout.
- **Catalog:** exact catalog data (names, prices, descriptions, images), the sort control and all 4 sort orders including the price tie, details pages opened by name and by image, and product ids that don't follow list order.
- **Cart:** the badge rules from 0 to 6, the row contents, removal from the cart page, persistence across navigation and reload, add order across pages, and the cart's links to details and checkout.
- **Checkout:** the end-to-end order, required-field validation order and dismiss, the tax and total rule for 10 carts (in integer cents, checked independently of the observed table), the static overview info, Cancel on both steps, the complete page, and emptying the cart.
- **Navigation:** the burger menu's open and close state and items, All Items from 5 pages, Reset App State.

## 5. Out of scope

### 5.1 Backlog test cases

These are valid candidates from the specs, left out to keep each area at 6 tests. Several are fully or partly covered by a Selected test.

| Test ID | Title | Reason not automated |
|---------|-------|----------------------|
| TC-LOGIN-07 | A second failed attempt replaces the error message | P3. TC-LOGIN-02 already checks each error text from a fresh page. |
| TC-LOGIN-08 | Unauthenticated access to inventory is blocked | Superseded: owned by TC-NAV-02. |
| TC-LOGIN-09 | Logout returns to login with empty fields | Superseded: owned by TC-NAV-01. |
| TC-LOGIN-10 | Whitespace-only, very long and non-ASCII credentials are rejected | P3, not explored live. TC-LOGIN-02 covers spaces, wrong case and injection-like input. |
| TC-PROD-07 | Add/remove on the details page, state kept on return | Budget. Partly covered: TC-CART-05 adds from a details page, and TC-CART-04 checks the details Remove button. |
| TC-PROD-08 | Invalid product id shows ITEM NOT FOUND | Budget (P2). A negative path with no business impact on a valid order. |
| TC-PROD-09 | All 6 details pages match the catalog | Budget. TC-PROD-04/05 cover 4 of the 6 ids through both entry points. |
| TC-PROD-10 | Add all 6, then remove all | Overlaps TC-CART-01 (badge 1..6) and TC-PROD-06 (toggle). |
| TC-PROD-11 | The price sort keeps a stable order on ties | Covered: TC-PROD-03 asserts the exact order, including the $15.99 tie. |
| TC-PROD-12 | `performance_glitch_user` list eventually renders | Partly covered: TC-LOGIN-04 checks 6 items for this user with a 15 s timeout. |
| TC-CART-07 | An empty cart page shows headers and buttons with no rows | Covered by the last step of TC-CART-03. |
| TC-CART-08 | Checkout with an empty cart is blocked | Known defect (expected to fail). Listed in the risks below. |
| TC-CART-09 | The cart page requires login | Superseded: TC-NAV-02 covers `/cart.html`. |
| TC-CART-10 | No quantity input on the cart page | Covered inside TC-CART-02. |
| TC-CART-11 | Six items: badge 6 and six rows with correct prices | Partly covered: TC-CART-01 (badge 6) and TC-CHK-03 cart 10 (all six, totals). |
| TC-CHK-07 | Whitespace-only fields are rejected | Known defect (expected to fail). Listed in the risks below. |
| TC-CHK-08 | Direct access to the complete page without an order | Known defect (expected to fail). Listed in the risks below. |
| TC-CHK-09 | Step two with an empty cart cannot be completed | Known defect (expected to fail). Listed in the risks below. |
| TC-CHK-10 | The error clears after the field is corrected, and Continue succeeds | P3. The successful Continue is covered by every checkout test. |
| TC-CHK-11 | Tax for single items | Merged into TC-CHK-03 (carts 3 and 4). |
| TC-CHK-12 | Names and postal code accept special characters | P3. No validation rule to assert. |
| TC-CHK-13 | `problem_user` last name field does not accept input | Deviation record for a deliberately broken account, not an AC. |
| TC-CHK-14 | `error_user` Finish does nothing | Deviation record for a deliberately broken account, not an AC. |
| TC-CHK-15 | `visual_user` and `performance_glitch_user` totals match | P3. Observed identical to `standard_user`. |
| TC-CHK-16 | Step one initial state | Partly covered: TC-CHK-01 checks the title, empty inputs and no error. |
| TC-NAV-07 | Deleting the session cookie forces a new login | Merged into TC-NAV-02 (session state B). |
| TC-NAV-08 | The cart persists across logout and a new login | Budget. The behavior itself is a risk (the cart is not tied to the user, see below). |
| TC-NAV-09 | About and footer social links have the correct hrefs | P3. The About href is checked in TC-NAV-05. External sites are not followed. |
| TC-NAV-10 | The header logo and cart link work from every page | P3. The cart link is used across the Cart and Checkout tests. |
| TC-NAV-11 | An unknown route does not expose content | P3, known defect (a blank shell instead of a 404). Listed in the risks below. |
| TC-NAV-12 | Logout works for every user type | P3. No per-user logout deviation was found. |
| TC-NAV-13 | The menu opens from the cart, details and checkout pages | Covered: TC-NAV-06 opens the menu on 5 pages. |

### 5.2 Test types not covered

- **Visual regression:** `visual_user` defects are layout and image differences. Screenshot baselines per browser and OS would need a pinned CI image to be stable.
- **API testing:** saucedemo has no public API. The cart and session live in the browser.
- **Accessibility:** no axe or WCAG audit. Role and label checks appear only where the specs need them.
- **Performance and load:** the `performance_glitch_user` delay is tolerated with a timeout, not measured.
- **Mobile viewports and the deliberately broken accounts' full flows:** desktop Chromium, Firefox and WebKit only. Other accounts appear only in TC-LOGIN-04.

## 6. Risks

### 6.1 Known site defects

None of these is asserted as expected behavior. Two of them appear inside the Selected tests as a `known-issue` annotation, which is recorded only while the defect shows.

| ID / area | Defect (observed vs. intended) | Handling |
|-----------|--------------------------------|----------|
| DEF-CHK-SUBTOTAL (Checkout) | Fleece Jacket + Onesie shows "Item total: $57.980000000000004": the float sum is not rounded. Tax and total are correct. | TC-CHK-04 checks the amount to the cent, tolerates only the float noise, and adds a `known-issue`. |
| D1 (Navigation) | Reset App State clears the cart, but the "Remove" buttons stay until a reload. | TC-NAV-04 adds a `known-issue` and asserts the buttons only after the reload. |
| DEF-NAV-MENU-RACE (Navigation, WebKit) | The menu's 500 ms close timer can fire just as it opens, leaving it marked open but hidden. A user has to click again. | `BurgerMenu.open()` detects the stuck state and reopens once. |
| Cart | Checkout can start with an empty cart. | Backlog TC-CART-08. |
| Checkout | Whitespace-only first name, last name or postal code is accepted. | Backlog TC-CHK-07. |
| Checkout | `/checkout-complete.html` shows the confirmation without an order. On step two with an empty cart, Finish succeeds and "Item total" shows `$0`. | Backlog TC-CHK-08/09. |
| Navigation | Unknown routes render a blank shell instead of a 404 page. | Backlog TC-NAV-11. |
| Navigation | The cart survives logout and is not tied to the user. | Backlog TC-NAV-08. |
| `problem_user` | Placeholder images; sorting does nothing; add/remove fails for 3 + 3 products; names open the wrong product (id + 1); the last name field cannot be filled. | Not asserted. Only its login is tested (TC-LOGIN-04). |
| `error_user` | Sorting does nothing; add/remove fails; the last name is dropped without an error; Finish does nothing. | Not asserted. Only its login is tested. |
| `visual_user` | Inventory prices are randomized; the Backpack image is a placeholder. | Not asserted. Only its login is tested. |
| `performance_glitch_user` | The inventory takes about 5 s to render after login. | Tolerated with a 15 s timeout. |

### 6.2 Test risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Site availability.** The suite runs against a public demo site that we don't control. | An outage or a site change fails the whole run, unrelated to the tests. | One retry (`retries: 1`). Failures keep a trace, screenshot and video. The expected texts live in `src/data/`, so a site change is fixed in one place. |
| **Asynchronous redirect and badge.** The protected-URL redirect happens on the client, and the cart badge renders after the page. | An immediate read sees the old URL or no badge. | Only auto-waiting assertions (`toHaveURL`, `toHaveText`, `toHaveCount`). No fixed sleeps. `toHaveCartBadge(0)` first waits for the header, so "absent" cannot pass on a blank page. |
| **`performance_glitch_user` timing.** The inventory takes about 5 s to render. | Default timeouts would fail the login. | `SLOW_RENDER_TIMEOUT` (15 s) for this user. The worker login has its own 60 s budget. |
| **Cart kept in `localStorage`.** The cart is browser state, not server state. | State leaking between tests, or between cases of a grouped test, would hide or fake results. | Every test gets a new browser context. Grouped cases reset their state first (`clearCart`, `resetBrowserState`), and TC-CHK-03 hard-checks badge 0 before each cart. |
| **Burger menu animation (WebKit).** See DEF-NAV-MENU-RACE. | A rare flaky failure when the menu is opened right after a page loads. | The open state is read from `aria-hidden` and the wrapper's visibility, with one reopen when stuck. |
| **Slow machine or site.** A run from a clone under `%TEMP%` on Windows was about 2.5× slower under parallel load, likely from antivirus scanning the per-test video and trace files. TC-NAV-06 timed out there. | Long multi-journey tests can exceed the 30 s test timeout. | TC-NAV-06 (five journeys in one test) uses `test.slow()`. The grouped tests size their own budget from the case count. The README suggests fewer workers on slow machines. |
| **Shared login per worker.** Each worker logs in once and reuses the storage state. | A stale session could mask a login problem. | Auth files are wiped at the start of every run and recreated per worker, project and user. |

## 7. Summary

**Final run:** 2026-11-18, Windows 11, Node 22.19, Playwright 1.65.1, 10 local workers, `retries: 1`, against the live site.

| Run | Command | Chromium | Firefox | WebKit | Total | Flaky / retried | Duration |
|-----|---------|----------|---------|--------|-------|-----------------|----------|
| Full suite | `npm test` | 31 / 31 | 31 / 31 | 31 / 31 | **93 passed** | 0 | 2.1 min |
| Smoke | `npm run test:smoke` | 16 / 16 | 16 / 16 | 16 / 16 | 48 passed | 0 | 1.0 min |
| Regression | `npm run test:regression` | 18 / 18 | 18 / 18 | 18 / 18 | 54 passed | 0 | 1.6 min |
| Fresh clone, no `.env` | `npm install && npm test` | 31 / 31 | 31 / 31 | 31 / 31 | 93 passed | 0 | 1.9 min |

- 31 per browser = the 30 test cases + the agents' seed test. 16 smoke + 18 regression = 30, because 4 tests carry both tags (TC-LOGIN-02, TC-PROD-03, TC-CHK-02, TC-NAV-02).
- **Grouped tests:** every case passed in every browser. TC-LOGIN-02 13/13, TC-LOGIN-04 4/4, TC-CHK-03 10/10, TC-NAV-02 12/12.
- **Known issues observed** (annotated, not failing), in all 3 browsers:
  - DEF-CHK-SUBTOTAL in TC-CHK-04: "Item total: $57.980000000000004".
  - D1 in TC-NAV-04: 2 "Remove" buttons are left until the reload.
- **Reports:** `npm run report` serves the HTML report, and `npm run allure:generate` / `npm run allure:open` build and serve the Allure 3 report.
- **CI:** the GitHub Actions workflow runs typecheck plus one job per browser on every pull request. The result for the delivery PR is recorded in its description.

**Conclusion:** all 30 test cases (65 verified cases) pass on the 3 browsers with no flakiness. The defects found are documented in §6.1. Two of them (DEF-CHK-SUBTOTAL, D1) are visible in every run as annotations, and the others are listed as Backlog candidates written against the intended behavior.
