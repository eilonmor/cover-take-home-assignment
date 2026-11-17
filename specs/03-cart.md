# Cart — Functional Specification

## Application Overview

## 1. Overview & scope

The Cart area covers the header cart icon (`shopping-cart-link`) and badge (`shopping-cart-badge`), the cart page `/cart.html`, and the cart state: contents, order and persistence. The site is https://www.saucedemo.com. All behavior was observed as standard_user, with problem_user and error_user compared.

**In scope**
- Badge visibility and counts (1..6).
- Cart page layout and item data (quantity, name, description, price).
- Removing items on the cart page, and the empty-cart state.
- "Continue Shopping".
- The "Checkout" button navigates only; it is not exercised beyond that.
- Cart item ordering.
- Persistence across navigation and reload.
- Adding from the details page, and the lack of a quantity control.
- Item name links to the details page.
- Access to the cart page when logged out.

**Out of scope (owned by other specs)**
- Add/remove button toggling and the badge on the inventory page: Products spec.
- Checkout form, overview and completion: Checkout spec.
- Logout clearing the cart and the burger menu's "Reset App State": Logout & Navigation spec.

**Test data**
- standard_user / secret_sauce.
- Slugs: sauce-labs-backpack ($29.99), sauce-labs-bike-light ($9.99), sauce-labs-bolt-t-shirt ($15.99), sauce-labs-fleece-jacket ($49.99), sauce-labs-onesie ($7.99), test.allthethings()-t-shirt-(red) ($15.99).
- Details page ids: bike light = 0, bolt t-shirt = 1, onesie = 2, red t-shirt = 3, backpack = 4, fleece = 5.
- Every test starts from a fresh state: a new browser context, or `localStorage.clear()` followed by login.

## 2. User stories

- US-CART-01: As a shopper, I see at a glance how many items are in my cart (badge on the cart icon), and no badge when it is empty.
- US-CART-02: As a shopper, I can open the cart and review each item's quantity, name, description and price, which match the catalog.
- US-CART-03: As a shopper, I can remove items from the cart page and see the cart and badge update immediately.
- US-CART-04: As a shopper, I can see a clear empty-cart state and get back to shopping.
- US-CART-05: As a shopper, I can continue shopping and come back with my cart intact.
- US-CART-06: As a shopper, I can proceed to checkout from the cart.
- US-CART-07: As a shopper, my cart is kept while I navigate and reload, and items appear in the order I added them.
- US-CART-08: As a shopper, I can open an item's details from the cart, and items added from the details page appear in the cart.
- US-CART-09: As the business, only logged-in users can access the cart.

## 3. Acceptance criteria

- AC-CART-01 (US-CART-01): Given a fresh logged-in session with an empty cart, when I view any page with the header, then `shopping-cart-badge` is not present in the DOM.
- AC-CART-02 (US-CART-01): Given an empty cart, when I add N distinct products (N = 1..6), then the badge shows exactly the text N.
- AC-CART-03 (US-CART-01): Given a cart with N items, when I remove one item, then the badge shows N-1. When the last item is removed, the badge disappears.
- AC-CART-04 (US-CART-02): Given items in the cart, when I click `shopping-cart-link`, then the URL is /cart.html, the `title` reads "Your Cart", and the headers `cart-quantity-label` ("QTY") and `cart-desc-label` ("Description") are visible.
- AC-CART-05 (US-CART-02): Given items in the cart, when I view /cart.html, then each `inventory-item` row shows `item-quantity` "1", `inventory-item-name`, `inventory-item-desc`, `inventory-item-price` and a "Remove" button (`remove-<slug>`). The name, description and price equal the inventory values.
- AC-CART-06 (US-CART-02): Given a cart with several items, then the cart page has one `inventory-item` per distinct product, and there is no quantity input or stepper. Quantity is always "1" and cannot be edited. Adding the same product twice is not possible because the button toggles to Remove.
- AC-CART-07 (US-CART-03): Given N items on the cart page, when I click `remove-<slug>` for one, then that row disappears immediately without a reload, the other rows stay, and the badge shows N-1.
- AC-CART-08 (US-CART-03): Given an item removed on the cart page, when I go back to /inventory.html, then that product shows `add-to-cart-<slug>` again and the others still show `remove-<slug>`.
- AC-CART-09 (US-CART-04): Given an empty cart, when I open /cart.html, then no `inventory-item` rows are shown. The headers, `continue-shopping` and `checkout` are still visible. There is no explicit "cart is empty" message.
- AC-CART-10 (US-CART-05): Given items in the cart and the cart page open, when I click `continue-shopping`, then the URL is /inventory.html, the badge count is unchanged and the product buttons reflect the cart.
- AC-CART-11 (US-CART-06): Given at least one item in the cart, when I click `checkout`, then the URL is /checkout-step-one.html. Nothing further is specified here.
- AC-CART-12 (US-CART-06): Given an EMPTY cart, when I click `checkout`, then INTENDED behavior is that checkout is blocked, staying on /cart.html with a message or a disabled button. ACTUAL: the site navigates to /checkout-step-one.html (known defect, see section 5). Do not make the actual behavior an acceptance criterion.
- AC-CART-13 (US-CART-07): Given I add items A, then B, then C, when I open the cart, then the rows appear in the order A, B, C (add order, not catalog order).
- AC-CART-14 (US-CART-07): Given items in the cart, when I reload /cart.html or navigate cart, inventory, details and cart again, then the same items remain in the same order with the same badge count.
- AC-CART-15 (US-CART-08): Given an item in the cart, when I click its `inventory-item-name`, then the URL is /inventory-item.html?id=<n> for that product and its details are shown with a `remove` button.
- AC-CART-16 (US-CART-08): Given a product details page, when I click `add-to-cart` and then open the cart, then the product is listed in the cart (appended last), the badge increments and the details page button becomes `remove`.
- AC-CART-17 (US-CART-09): Given a logged-out browser (new context), when I open /cart.html directly, then the cart is not shown and the login page appears with the error "Epic sadface: You can only access '/cart.html' when you are logged in."

## 4. Business rules & UI contract

**Badge**
- The element is `shopping-cart-badge`. It is absent when the cart is empty, not "0".
- The text is the number of items (1..6, max 6 since each product can be added once).
- It is visible on all authenticated pages.

**Cart page**
- URL: https://www.saucedemo.com/cart.html.
- `title` = "Your Cart".
- `cart-quantity-label` = "QTY".
- `cart-desc-label` = "Description".
- Containers: `cart-contents-container` and `cart-list`. The cart-list holds the two header divs plus one `inventory-item` per product.
- Row elements: `inventory-item`, `item-quantity` (text "1"), `inventory-item-name`, `inventory-item-desc`, `inventory-item-price` (e.g. "$29.99"), `remove-<slug>` with text "Remove".
- Buttons: `continue-shopping` ("Continue Shopping") and `checkout` ("Checkout").
- Header: `shopping-cart-link` plus the burger menu (`open-menu`).
- Name links: the clickable name is an anchor `item-<id>-title-link` containing `inventory-item-name`. Clicking the `inventory-item-name` text works.

**Rules**
- Quantity is fixed at 1 per product. There is no quantity control.
- Item order is add order, first added is first in the list.
- Prices: backpack $29.99, bike light $9.99, bolt t-shirt $15.99, fleece jacket $49.99, onesie $7.99, red t-shirt $15.99.
- Persistence: the cart is kept in browser storage (per browser profile, not shared across contexts). It survives reload and navigation.
- URLs: /inventory.html, /inventory-item.html?id=<0..5>, /cart.html, /checkout-step-one.html.
- The cart page requires login (see AC-CART-17).

**Notes for test authors**
- After clicking `shopping-cart-link`, wait for the URL (`toHaveURL(/cart\.html/)`) before reading rows. Reading too early returns the inventory page DOM.
- `getByTestId('inventory-item-name')` returns multiple elements on the cart page. Scope it to the row.

## 5. Edge cases & negative paths

- **Empty cart checkout (observed defect)**: clicking `checkout` on an empty cart navigates to /checkout-step-one.html. Intended: blocked, or at least a message. Record as a known product defect, not an AC.
- **Empty cart page**: there is no empty-state message, only the headers and the two buttons.
- **Maximum 6 items**: the badge shows 6, and the cart page lists 6 rows in add order with correct prices.
- **Removing the last item**: the badge disappears. Rows are gone, and the headers and buttons stay.
- **Direct navigation to /cart.html while logged out**: shows the login page with the error text from AC-CART-17.
- **Direct navigation to /cart.html while logged in**: the cart contents are preserved after a reload.
- **Cart not shared between browser contexts**: a new context has an empty cart, because the cart is held in browser storage.
- **No quantity edit**: there is no input, so no negative or zero quantity cases.
- **Item name link**: clicking the name opens the details page. Back to products keeps the cart.
- **Out of scope**: logout clearing the cart and Reset App State.

## 6. Known deviations per user

- **problem_user**: the inventory add/remove buttons only work for some products. In the exploration, clicking add on all 6 products produced a badge of 3, with Backpack, Bike Light and Onesie in the cart. The cart page then rendered those 3 items and Remove on the cart page worked for each, leaving an empty cart with no badge. Other cart-page behavior was not found to deviate. Expect deviations in the inventory interactions, not the cart page itself. Details and item images are also known to differ for this user (Products spec).
- **error_user**: same observed result as problem_user: only 3 of the 6 adds took effect, and the 3 items could be removed on the cart page. Errors may surface on some actions (the console showed errors).
- **visual_user**: not exercised. Only visual or layout differences are expected.
- **standard_user**: the baseline. There are no deviations except the empty-cart checkout defect, which applies to every user.

These are NOT acceptance criteria. Automated tests run as standard_user.

## 7. Test candidate summary

| TC ID | AC ref | Title | Priority | Tags | Selected |
|---|---|---|---|---|---|
| TC-CART-01 | AC-CART-01, 02, 03 | Cart badge hidden when empty, matches item count 1..6 | P1 | @smoke | yes |
| TC-CART-02 | AC-CART-04, 05, 06 | Cart page lists items with correct qty, name, description and price | P1 | @smoke | yes |
| TC-CART-03 | AC-CART-07, 08, 03 | Remove from cart page updates rows, badge and inventory state | P1 | @smoke | yes |
| TC-CART-04 | AC-CART-10, 14 | Continue Shopping and reload preserve the cart | P1 | @regression | yes |
| TC-CART-05 | AC-CART-13, 16 | Items appear in add order, including one added from the details page | P2 | @regression | yes |
| TC-CART-06 | AC-CART-11, 15 | Checkout button goes to checkout step one, and an item name opens details | P2 | @smoke | yes |
| TC-CART-07 | AC-CART-09 | Empty cart page shows headers and buttons with no rows | P2 | @regression | no |
| TC-CART-08 | AC-CART-12 | Checkout with an empty cart is blocked (expected to fail, known defect) | P2 | @regression | no |
| TC-CART-09 | AC-CART-17 | Cart page requires login | P3 | @regression | no |
| TC-CART-10 | AC-CART-06 | No quantity input on the cart page | P3 | @regression | no |
| TC-CART-11 | AC-CART-02, 05 | Six items added: badge 6 and six rows with correct prices | P3 | @regression | no |

## Appendix: guidance
Each test starts from a new context and logs in with standard_user / secret_sauce via `username`, `password` and `login-button`.

## Test Scenarios

### 1. Cart — Selected

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-CART-01 Cart badge hidden when empty and matches item count

**File:** `tests/cart/badge-count.spec.ts`

**Steps:**
  1. Log in as standard_user / secret_sauce
    - expect: URL is /inventory.html
  2. Check shopping-cart-badge
    - expect: Badge has count 0 (not in the DOM)
  3. Click add-to-cart-<slug> one by one for backpack, bike-light, bolt-t-shirt, fleece-jacket, onesie, test.allthethings()-t-shirt-(red); after each click read the badge
    - expect: The badge text is 1, 2, 3, 4, 5, 6 in turn
  4. Click shopping-cart-link
    - expect: URL is /cart.html
    - expect: Badge still shows 6

#### 1.2. TC-CART-02 Cart page lists items with correct quantity, name, description and price

**File:** `tests/cart/cart-contents.spec.ts`

**Steps:**
  1. Log in as standard_user. On the inventory page record name, description and price of the backpack and the bike light, then add both
    - expect: Badge shows 2
  2. Click shopping-cart-link and wait for URL /cart.html
    - expect: title reads "Your Cart"
    - expect: cart-quantity-label reads "QTY" and cart-desc-label reads "Description"
    - expect: continue-shopping and checkout are visible
  3. Inspect the 2 inventory-item rows
    - expect: Rows are Sauce Labs Backpack then Sauce Labs Bike Light
    - expect: Each item-quantity is "1"
    - expect: Prices are "$29.99" and "$9.99"
    - expect: Names, descriptions and prices equal the recorded inventory values
    - expect: Each row has a "Remove" button (remove-sauce-labs-backpack, remove-sauce-labs-bike-light)
    - expect: There is no input element for quantity

#### 1.3. TC-CART-03 Removing from the cart page updates rows, badge and inventory state

**File:** `tests/cart/remove-from-cart.spec.ts`

**Steps:**
  1. Log in as standard_user. Add backpack, bike-light and onesie. Open /cart.html
    - expect: 3 rows, badge 3
  2. Click remove-sauce-labs-bike-light
    - expect: The bike light row disappears without a reload
    - expect: 2 rows remain: Backpack, Onesie
    - expect: Badge shows 2
  3. Click Continue Shopping
    - expect: URL is /inventory.html
    - expect: add-to-cart-sauce-labs-bike-light is visible
    - expect: remove-sauce-labs-backpack and remove-sauce-labs-onesie are visible
  4. Open the cart again, remove the remaining two items
    - expect: 0 inventory-item rows
    - expect: shopping-cart-badge is not in the DOM
    - expect: Headers, continue-shopping and checkout are still visible

#### 1.4. TC-CART-04 Continue Shopping and reload preserve the cart

**File:** `tests/cart/cart-persistence.spec.ts`

**Steps:**
  1. Log in as standard_user. Add fleece-jacket and onesie. Open /cart.html
    - expect: 2 rows, badge 2
  2. Reload the page
    - expect: Same 2 rows (Fleece Jacket, Onesie) in the same order
    - expect: Badge 2
  3. Click continue-shopping
    - expect: URL is /inventory.html
    - expect: Badge 2
    - expect: remove-sauce-labs-fleece-jacket and remove-sauce-labs-onesie are visible
  4. Click an item name to open the details page, then back-to-products, then shopping-cart-link
    - expect: Details page shows the remove button for that item
    - expect: The cart still has 2 rows and badge 2

#### 1.5. TC-CART-05 Cart items appear in add order, including one added from the details page

**File:** `tests/cart/cart-order.spec.ts`

**Steps:**
  1. Log in as standard_user. On the inventory page add fleece-jacket, then backpack
    - expect: Badge 2
  2. Navigate to /inventory-item.html?id=0 (Sauce Labs Bike Light) and click add-to-cart
    - expect: The button becomes remove
    - expect: Badge 3
  3. Click shopping-cart-link and wait for /cart.html
    - expect: The rows are in this exact order: Sauce Labs Fleece Jacket, Sauce Labs Backpack, Sauce Labs Bike Light, not catalog order
    - expect: Prices are $49.99, $29.99, $9.99

#### 1.6. TC-CART-06 Checkout button goes to checkout step one and item name opens details

**File:** `tests/cart/cart-navigation.spec.ts`

**Steps:**
  1. Log in as standard_user. Add the backpack. Open /cart.html
    - expect: 1 row
  2. Click the inventory-item-name "Sauce Labs Backpack"
    - expect: URL is /inventory-item.html?id=4
    - expect: The name is shown with a remove button
  3. Click shopping-cart-link, then click checkout
    - expect: URL is /checkout-step-one.html
    - expect: Do not assert the form beyond the URL (Checkout spec)

### 2. Cart — Backlog

**Seed:** `tests/seed.spec.ts`

#### 2.1. TC-CART-07 Empty cart page shows headers and buttons with no rows

**File:** `tests/cart/empty-cart.spec.ts`

**Steps:**
  1. Log in as standard_user and click shopping-cart-link
    - expect: URL is /cart.html
    - expect: Title "Your Cart"
    - expect: 0 inventory-item rows
    - expect: continue-shopping and checkout are visible
    - expect: No badge

#### 2.2. TC-CART-08 Checkout with an empty cart is blocked (expected to FAIL, known defect)

**File:** `tests/cart/empty-cart-checkout.spec.ts`

**Steps:**
  1. Log in as standard_user, open /cart.html with an empty cart, click checkout
    - expect: INTENDED: stays on /cart.html with an error or disabled button
    - expect: ACTUAL: navigates to /checkout-step-one.html. Mark with test.fail() or skip, and report as a defect

#### 2.3. TC-CART-09 Cart page requires login

**File:** `tests/cart/cart-auth.spec.ts`

**Steps:**
  1. In a fresh context open /cart.html directly without logging in
    - expect: The login form is shown
    - expect: Error reads "Epic sadface: You can only access '/cart.html' when you are logged in."
    - expect: No cart rows

#### 2.4. TC-CART-10 No quantity input on the cart page

**File:** `tests/cart/no-quantity-control.spec.ts`

**Steps:**
  1. Log in as standard_user, add the backpack, open /cart.html
    - expect: item-quantity text is "1"
    - expect: The row has no input, plus or minus control
    - expect: Only the Remove button is present

#### 2.5. TC-CART-11 Six items added shows badge 6 and six rows with correct prices

**File:** `tests/cart/cart-six-items.spec.ts`

**Steps:**
  1. Log in as standard_user, add all 6 products in this order: onesie, backpack, bike-light, bolt-t-shirt, fleece-jacket, red t-shirt. Open /cart.html
    - expect: Badge 6
    - expect: 6 rows in the same add order
    - expect: Prices $7.99, $29.99, $9.99, $15.99, $49.99, $15.99
