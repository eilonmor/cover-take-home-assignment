# Checkout — Functional Specification

## Application Overview

## 1. Overview & scope

Area: the checkout flow of Swag Labs (https://www.saucedemo.com), from the cart "Checkout" button to the order confirmation. Explored 2026-11-17 with `standard_user`, then compared with `problem_user`, `error_user`, `visual_user` and `performance_glitch_user`.

Flow: `/cart.html` -> `/checkout-step-one.html` (Checkout: Your Information) -> `/checkout-step-two.html` (Checkout: Overview) -> `/checkout-complete.html` (Checkout: Complete!) -> Back Home -> `/inventory.html`.

In scope: the step one form and its validation, the step two overview (item list, payment and shipping info, item total, tax, total), Cancel on steps one and two, Finish, the complete page, direct URL access to checkout pages, per-user deviations.

Out of scope (owned by other specs): cart page behavior and the cart "checkout" button (Cart spec; checkout with an empty cart is already recorded there as a defect, referenced here only as DEF-CART), login/logout, burger menu, protected-route access without a session.

Conventions: tests use `getByTestId` with testIdAttribute = `data-test`. Money is in USD with 2 decimals. Catalog prices: backpack 29.99, bike-light 9.99, bolt-t-shirt 15.99, fleece-jacket 49.99, onesie 7.99, red t-shirt 15.99. Every cart line has quantity 1 (an item can only be added once, there is no quantity control).

Defect legend: items marked DEF are observed site deviations from intended behavior. The acceptance criteria describe the INTENDED behavior; a test for a DEF criterion is expected to fail against the current site (mark it test.fail or skip with annotation).

## 2. User stories

- US-CHK-01: As a shopper, I provide my first name, last name and postal code so that my order can be shipped.
- US-CHK-02: As a shopper, I get a clear error if I leave required information out, so that I know what to fix.
- US-CHK-03: As a shopper, I can review my order (items, payment, shipping, item total, tax, total) before committing, so that I know what I will be charged.
- US-CHK-04: As a shopper, I can cancel at any step without losing my cart.
- US-CHK-05: As a shopper, I can finish the order and see a confirmation, with my cart emptied.
- US-CHK-06: As a shopper, I can return to the product list after ordering to continue shopping.
- US-CHK-07: As the business, I want checkout to only complete for a valid, non-empty order, reached through the proper steps.

## 3. Acceptance criteria

- AC-CHK-01 (US-CHK-01): Given the cart has items and I am on step one, When the page loads, Then the title is "Checkout: Your Information", there are three empty text inputs (placeholders "First Name", "Last Name", "Zip/Postal Code"), a Cancel button and a Continue button, and no error message is shown.
- AC-CHK-02 (US-CHK-02): Given step one with all fields empty, When I click Continue, Then I stay on /checkout-step-one.html and see "Error: First Name is required".
- AC-CHK-03 (US-CHK-02): Given first name filled, last name and postal code empty, When I click Continue, Then I see "Error: Last Name is required".
- AC-CHK-04 (US-CHK-02): Given first and last name filled and postal code empty, When I click Continue, Then I see "Error: Postal Code is required".
- AC-CHK-05 (US-CHK-02): Given an error is shown, When I click the error dismiss button (`error-button`), Then the message disappears, the red error styling on the inputs is removed, and the values I typed are kept.
- AC-CHK-06 (US-CHK-02): Given fields contain only whitespace, When I click Continue, Then the form is treated as empty and the matching required error is shown (DEF: the site accepts whitespace and moves to step two).
- AC-CHK-07 (US-CHK-01): Given all three fields have valid values, When I click Continue, Then I go to /checkout-step-two.html.
- AC-CHK-08 (US-CHK-04): Given I am on step one with items in the cart, When I click Cancel, Then I go to /cart.html and the cart items and badge are unchanged.
- AC-CHK-09 (US-CHK-03): Given I reached step two with N items, Then the title is "Checkout: Overview", each cart item is listed with its quantity (1), name and price identical to the cart, and the cart badge shows N.
- AC-CHK-10 (US-CHK-03): Given step two, Then "Payment Information:" is followed by "SauceCard #31337", "Shipping Information:" is followed by "Free Pony Express Delivery!", and the summary header reads "Price Total".
- AC-CHK-11 (US-CHK-03): Given step two, Then the subtotal label reads "Item total: $X" where X is the exact sum of the item prices.
- AC-CHK-12 (US-CHK-03): Given step two, Then the tax label reads "Tax: $T" where T = 8% of the item total rounded to 2 decimals (see section 4).
- AC-CHK-13 (US-CHK-03): Given step two, Then the total label reads "Total: $G" where G = item total + tax, 2 decimals.
- AC-CHK-14 (US-CHK-04): Given step two, When I click Cancel, Then I go to /inventory.html (not the cart) and the cart items and badge are unchanged.
- AC-CHK-15 (US-CHK-05): Given step two, When I click Finish, Then I go to /checkout-complete.html with title "Checkout: Complete!", header "Thank you for your order!", text "Your order has been dispatched, and will arrive just as fast as the pony can get there!", and the pony-express image.
- AC-CHK-16 (US-CHK-05): Given the order is finished, Then the cart is empty: no cart badge, /cart.html lists no items, and every product on /inventory.html shows "Add to cart" again.
- AC-CHK-17 (US-CHK-06): Given the complete page, When I click "Back Home" (`back-to-products`), Then I go to /inventory.html.
- AC-CHK-18 (US-CHK-07): Given the cart is empty, When I open /checkout-step-two.html directly or click Finish there, Then I must not get an order confirmation; I should be redirected to the cart or inventory (DEF: the site shows $0 totals and lets Finish succeed; DEF-CART covers the empty-cart checkout button).
- AC-CHK-19 (US-CHK-07): Given I did not finish an order, When I open /checkout-complete.html directly, Then I must not see the confirmation (DEF: the confirmation is shown).
- AC-CHK-20 (US-CHK-03): Given step two, Then if the cart is empty, amounts are shown with two decimals (observed "Item total: $0" with no decimals; minor inconsistency).

## 4. Business rules & UI contract

URLs and titles (data-test `title`):
- Step one: /checkout-step-one.html, "Checkout: Your Information"
- Step two: /checkout-step-two.html, "Checkout: Overview"
- Complete: /checkout-complete.html, "Checkout: Complete!"
- Cancel on step one -> /cart.html. Cancel on step two -> /inventory.html. Back Home -> /inventory.html.

Step one data-test IDs and placeholders: `firstName` ("First Name"), `lastName` ("Last Name"), `postalCode` ("Zip/Postal Code"), `continue` (input type submit, value "Continue"), `cancel` ("Cancel"), `error` (error message container, text prefixed "Error: "), `error-button` (dismiss X, appears only with an error).

Validation order (first failing field wins, one message at a time): 1) First Name -> "Error: First Name is required"; 2) Last Name -> "Error: Last Name is required"; 3) Postal Code -> "Error: Postal Code is required". While an error is shown, the three inputs carry the class `error` (red outline); dismissing removes it. No format rules for the postal code (any non-empty value, e.g. "1" or "abc", is accepted). Intended: whitespace-only counts as empty (DEF, currently accepted).

Step two data-test IDs: `inventory-item` (per row), `item-quantity`, `inventory-item-name`, `inventory-item-desc`, `inventory-item-price`, `payment-info-label` ("Payment Information:"), `payment-info-value` ("SauceCard #31337"), `shipping-info-label` ("Shipping Information:"), `shipping-info-value` ("Free Pony Express Delivery!"), `total-info-label` ("Price Total"), `subtotal-label`, `tax-label`, `total-label`, `cancel`, `finish`. Cart badge: `shopping-cart-badge`. The payment and shipping texts are static and identical for all carts.

Label formats: `subtotal-label` = "Item total: $" + sum (no thousands separator; observed 2 decimals, e.g. "Item total: $39.98"); `tax-label` = "Tax: $" + tax (2 decimals); `total-label` = "Total: $" + total (2 decimals).

Tax rule: tax = 8% of the item total, rounded to 2 decimals; total = item total + tax. Shipping is free and adds nothing. Note on rounding: all catalog prices end in .99/.98 sums so that 8% of any possible cart has a third-decimal remainder of 50 or more of a cent. Therefore round-half-up and always-round-up (ceiling) are indistinguishable with the current catalog; the spec states "round to nearest cent". Do not assert on banker's rounding.

Worked examples (all observed, standard_user):

| Cart | Item total | 8% exact | Tax | Total |
|---|---|---|---|---|
| onesie | 7.99 | 0.6392 | 0.64 | 8.63 |
| bike-light | 9.99 | 0.7992 | 0.80 | 10.79 |
| bolt-t-shirt | 15.99 | 1.2792 | 1.28 | 17.27 |
| fleece-jacket | 49.99 | 3.9992 | 4.00 | 53.99 |
| backpack | 29.99 | 2.3992 | 2.40 | 32.39 |
| backpack + bike-light | 39.98 | 3.1984 | 3.20 | 43.18 |
| bolt-t-shirt + red t-shirt | 31.98 | 2.5584 | 2.56 | 34.54 |
| bike-light + onesie | 17.98 | 1.4384 | 1.44 | 19.42 |
| backpack + bike-light + onesie | 47.97 | 3.8376 | 3.84 | 51.81 |
| all six items | 129.94 | 10.3952 | 10.40 | 140.34 |
| empty cart (DEF) | 0 | 0 | 0.00 | 0.00 |

Order of items in the step two list follows the order in which they were added to the cart. The cart is stored in browser storage (key `cart-contents`) and survives navigation within the session; it is cleared when the order is finished.

Complete page IDs: `title`, `pony-express` (img, alt "Pony Express"), `complete-header` (h2, "Thank you for your order!"), `complete-text` ("Your order has been dispatched, and will arrive just as fast as the pony can get there!"), `back-to-products` ("Back Home"). Observation: the image file name is a checkmark asset although the alt/data-test say pony express; assert on the data-test and alt, not on the file.

## 5. Edge cases & negative paths

- Empty first name with other fields filled: "Error: First Name is required" (first name wins even if others are also empty).
- Only last name empty or only postal code empty: respective errors as in section 4.
- Whitespace-only in all fields: observed accepted, goes to step two (DEF vs AC-CHK-06). Also leading/trailing spaces and special characters (e.g. "O'Brien", "12345-6789", emoji) are accepted without validation; there is no max length enforcement observed.
- After an error, correcting the field and clicking Continue proceeds to step two and the error is gone.
- Step one can be opened directly with an empty cart (observed: form shown; Continue goes to step two). Intended: redirect to cart, same family as DEF-CART.
- Step two with an empty cart: shows "Item total: $0", "Tax: $0.00", "Total: $0.00"; Finish succeeds (DEF, AC-CHK-18).
- Direct /checkout-complete.html with an empty cart or without finishing: confirmation is shown (DEF, AC-CHK-19). This is a session-authenticated user; unauthenticated access belongs to the protected-route spec.
- Reloading the complete page keeps showing it; browser Back from complete returns to step two (observed: cart is empty then). Intended: Finish cannot be repeated on an empty cart (same defect family).
- Cancel on step one preserves entered cart; entered form values are not required to persist after Cancel (not specified).
- Console shows a "Permissions policy violation: unload" error on every page; unrelated to checkout, ignore.

## 6. Known deviations per user

- standard_user: reference behavior, except the DEFs listed in sections 3 and 5 (whitespace accepted; empty cart reaches step two/complete; direct complete access shows confirmation).
- problem_user: the Last Name input does not accept input (value stays empty after fill and after typing key by key). Continue then fails with "Error: Last Name is required" so the order can never be completed. First name and postal code work. Not an acceptance criterion.
- error_user: Last Name input does not keep its value (empty after typing) yet Continue goes to step two WITHOUT a last name error (validation is bypassed), totals are correct (47.97 / 3.84 / 51.81 for backpack + bike-light + onesie), but clicking Finish does nothing: it stays on /checkout-step-two.html, no message is shown, the cart badge remains. Not an acceptance criterion.
- visual_user: checkout behavior and amounts identical to standard_user in this exploration (47.97 / 3.84 / 51.81, finish works, cart emptied). Visual-only differences (layout, product images/prices on the inventory page) were not observed in the checkout pages.
- performance_glitch_user: same as standard_user for the checkout pages (completed correctly); login/inventory may be slower, so use generous waits.

## 7. Test candidate summary

| TC ID | AC ref | Title | Priority | Tags | Selected |
|---|---|---|---|---|---|
| TC-CHK-01 | AC-CHK-01, 07, 09-13, 15 | End-to-end happy path with two items | P1 | @smoke | yes |
| TC-CHK-02 | AC-CHK-02, 03, 04, 05 | Step one required-field validation order, texts and dismiss | P1 | @smoke @regression | yes |
| TC-CHK-03 | AC-CHK-11, 12, 13 | Tax and total are calculated correctly for every cart combination (grouped, 10 carts) | P1 | @regression | yes |
| TC-CHK-04 | AC-CHK-09, 10 | Overview item list and static payment/shipping info match the cart | P2 | @regression | yes |
| TC-CHK-05 | AC-CHK-08, 14 | Cancel on step one and step two keeps the cart | P2 | @regression | yes |
| TC-CHK-06 | AC-CHK-15, 16, 17 | Complete page, cart emptied and Back Home | P1 | @smoke | yes |
| TC-CHK-07 | AC-CHK-06 | Whitespace-only fields are rejected (expected fail, DEF) | P2 | @regression | no |
| TC-CHK-08 | AC-CHK-19 | Direct access to complete without an order does not show confirmation (expected fail, DEF) | P2 | @regression | no |
| TC-CHK-09 | AC-CHK-18 | Step two with empty cart is not completable (expected fail, DEF) | P2 | @regression | no |
| TC-CHK-10 | AC-CHK-02, 07 | Error clears after correcting field and Continue succeeds | P3 | @regression | no |
| TC-CHK-11 | AC-CHK-12, 13 | Tax for single items fleece-jacket and bolt-t-shirt | P3 | @regression | no (merged into TC-CHK-03, cases 3 and 4) |
| TC-CHK-12 | AC-CHK-07 | Postal code and names accept special characters | P3 | @regression | no |
| TC-CHK-13 | Section 6 | problem_user last name field does not accept input (deviation record) | P3 | @regression | no |
| TC-CHK-14 | Section 6 | error_user Finish does nothing (deviation record) | P3 | @regression | no |
| TC-CHK-15 | AC-CHK-11-13 | visual_user and performance_glitch_user totals match standard_user | P3 | @regression | no |
| TC-CHK-16 | AC-CHK-01 | Step one initial state: placeholders, no error, buttons | P3 | @regression | no |

## Test Scenarios

### 1. Checkout — Selected

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-CHK-01 End-to-end happy path with two items

**File:** `tests/checkout/happy-path.spec.ts`

**Steps:**
  1. Log in as standard_user / secret_sauce (data-test username, password, login-button). Click add-to-cart-sauce-labs-backpack and add-to-cart-sauce-labs-bike-light. Click shopping-cart-link, wait for /cart.html, click checkout.
    - expect: URL is /checkout-step-one.html
    - expect: title reads 'Checkout: Your Information'
    - expect: firstName, lastName, postalCode are empty and error is not present
  2. Fill firstName 'Jane', lastName 'Doe', postalCode '12345', click continue.
    - expect: URL is /checkout-step-two.html
    - expect: title reads 'Checkout: Overview'
  3. Read the overview.
    - expect: 2 inventory-item rows: 'Sauce Labs Backpack' $29.99 and 'Sauce Labs Bike Light' $9.99, each quantity 1
    - expect: subtotal-label is exactly 'Item total: $39.98'
    - expect: tax-label is exactly 'Tax: $3.20'
    - expect: total-label is exactly 'Total: $43.18'
  4. Click finish.
    - expect: URL is /checkout-complete.html
    - expect: title 'Checkout: Complete!'
    - expect: complete-header 'Thank you for your order!'
    - expect: complete-text 'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    - expect: pony-express image visible
    - expect: shopping-cart-badge not present

#### 1.2. TC-CHK-02 Step one required-field validation order, texts and dismiss

**File:** `tests/checkout/step-one-validation.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-backpack, open the cart, click checkout.
    - expect: On /checkout-step-one.html
  2. Click continue with all fields empty.
    - expect: Stay on /checkout-step-one.html
    - expect: error text is exactly 'Error: First Name is required'
  3. Fill firstName 'Jane', click continue.
    - expect: Stay on step one
    - expect: error text is exactly 'Error: Last Name is required'
  4. Fill lastName 'Doe', click continue.
    - expect: Stay on step one
    - expect: error text is exactly 'Error: Postal Code is required'
  5. Click error-button.
    - expect: error is no longer present
    - expect: firstName still has value 'Jane' and lastName 'Doe'
  6. Clear firstName, fill postalCode '12345', click continue.
    - expect: error is 'Error: First Name is required' (first name is validated before the others)

#### 1.3. TC-CHK-03 Tax and total are calculated correctly for every cart combination

**File:** `tests/checkout/tax-and-total.spec.ts`

**Type:** grouped verification test (see [specs/README.md](README.md#grouped-verification-tests)). Each cart is one isolated `test.step` that uses soft assertions. If an action throws, the error is caught and recorded against that cart, and the test continues with the next cart. The test fails at the end if any cart failed and passes only if all 10 passed. Mark the test `test.slow()`: 10 checkout passes need more than the default 30 s timeout.

**Carts** (all values observed live, see section 4):

| # | Items (slugs) | Item total | Tax | Total |
|---|---------------|-----------|-----|-------|
| 1 | sauce-labs-onesie | $7.99 | $0.64 | $8.63 |
| 2 | sauce-labs-bike-light | $9.99 | $0.80 | $10.79 |
| 3 | sauce-labs-bolt-t-shirt | $15.99 | $1.28 | $17.27 |
| 4 | sauce-labs-fleece-jacket | $49.99 | $4.00 | $53.99 |
| 5 | sauce-labs-backpack | $29.99 | $2.40 | $32.39 |
| 6 | sauce-labs-backpack, sauce-labs-bike-light | $39.98 | $3.20 | $43.18 |
| 7 | sauce-labs-bolt-t-shirt, test.allthethings()-t-shirt-(red) | $31.98 | $2.56 | $34.54 |
| 8 | sauce-labs-bike-light, sauce-labs-onesie | $17.98 | $1.44 | $19.42 |
| 9 | sauce-labs-backpack, sauce-labs-bike-light, sauce-labs-onesie | $47.97 | $3.84 | $51.81 |
| 10 | all six items | $129.94 | $10.40 | $140.34 |

**Steps:**
  1. Log in once as standard_user (the session is shared by all cases; only the cart is reset per case).
  2. For every row, in its own `test.step` named "#<n> <items>":
     1. Reset to an empty cart: remove the `cart-contents` key from localStorage, then open /inventory.html.
        - expect: shopping-cart-badge is not present.
     2. Click `add-to-cart-<slug>` for each of the row's items. Open shopping-cart-link, wait for /cart.html, then click checkout. Fill Jane / Doe / 12345 and click continue.
        - expect: URL is /checkout-step-two.html.
     3. Read the price summary.
        - expect (soft): subtotal-label is exactly `Item total: <row item total>`.
        - expect (soft): tax-label is exactly `Tax: <row tax>`.
        - expect (soft): total-label is exactly `Total: <row total>`.
        - expect (soft): the business rule holds independently of the table. Item total = the sum of the catalog prices of the row's items; tax = round(item total × 0.08, 2); total = item total + tax. Compare in integer cents to avoid floating-point error.
     4. Whatever the outcome, continue with the next row.

**Final verdict:** passes only if all 10 carts passed every check.

#### 1.4. TC-CHK-04 Overview item list and static info match the cart

**File:** `tests/checkout/overview-content.spec.ts`

**Steps:**
  1. Log in as standard_user. Add sauce-labs-fleece-jacket then sauce-labs-onesie. Open the cart and note names and prices. Click checkout, fill Jane / Doe / 12345, continue.
    - expect: On /checkout-step-two.html
    - expect: cart badge shows 2
  2. Inspect the overview.
    - expect: 2 inventory-item rows in the order added: 'Sauce Labs Fleece Jacket' $49.99 then 'Sauce Labs Onesie' $7.99, item-quantity '1' for each
    - expect: payment-info-label 'Payment Information:' and payment-info-value 'SauceCard #31337'
    - expect: shipping-info-label 'Shipping Information:' and shipping-info-value 'Free Pony Express Delivery!'
    - expect: total-info-label 'Price Total'
    - expect: subtotal 'Item total: $57.98', tax 'Tax: $4.64', total 'Total: $62.62'
    - expect: cancel and finish buttons are visible

#### 1.5. TC-CHK-05 Cancel on step one and step two keeps the cart

**File:** `tests/checkout/cancel.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-backpack and sauce-labs-bike-light, open the cart, click checkout.
    - expect: On /checkout-step-one.html
  2. Click cancel on step one.
    - expect: URL is /cart.html
    - expect: 2 items listed (Backpack, Bike Light)
    - expect: shopping-cart-badge shows 2
  3. Click checkout, fill Jane / Doe / 12345, continue, then click cancel on step two.
    - expect: URL is /inventory.html (not the cart)
    - expect: shopping-cart-badge still shows 2
    - expect: remove-sauce-labs-backpack and remove-sauce-labs-bike-light buttons are shown on the inventory page
  4. Click shopping-cart-link.
    - expect: /cart.html still lists the 2 items

#### 1.6. TC-CHK-06 Complete page, cart emptied and Back Home

**File:** `tests/checkout/complete-and-back-home.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-onesie, open cart, checkout, fill Jane / Doe / 12345, continue, click finish.
    - expect: URL is /checkout-complete.html
    - expect: title 'Checkout: Complete!'
    - expect: complete-header 'Thank you for your order!'
    - expect: complete-text 'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    - expect: pony-express image visible with alt 'Pony Express'
    - expect: back-to-products button reads 'Back Home'
    - expect: shopping-cart-badge is not present
  2. Click back-to-products.
    - expect: URL is /inventory.html
    - expect: no cart badge
    - expect: add-to-cart-sauce-labs-onesie is shown again (no remove button)
  3. Click shopping-cart-link.
    - expect: URL is /cart.html with zero inventory-item rows

### 2. Checkout — Backlog

**Seed:** `tests/seed.spec.ts`

#### 2.1. TC-CHK-07 Whitespace-only fields are rejected (expected to fail: DEF)

**File:** `tests/checkout/whitespace-input.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-backpack, open cart, checkout. Fill firstName, lastName and postalCode each with two spaces, click continue.
    - expect: Intended: stay on step one with 'Error: First Name is required'
    - expect: Observed: navigates to /checkout-step-two.html (defect, annotate as expected failure)

#### 2.2. TC-CHK-08 Direct access to complete without an order does not show confirmation (expected to fail: DEF)

**File:** `tests/checkout/direct-complete.spec.ts`

**Steps:**
  1. Log in as standard_user with an empty cart. Navigate directly to /checkout-complete.html.
    - expect: Intended: redirect to /cart.html or /inventory.html and no 'Thank you for your order!'
    - expect: Observed: the confirmation is displayed (defect)

#### 2.3. TC-CHK-09 Step two with empty cart is not completable (expected to fail: DEF)

**File:** `tests/checkout/direct-step-two-empty.spec.ts`

**Steps:**
  1. Log in as standard_user with an empty cart. Navigate directly to /checkout-step-two.html.
    - expect: Intended: redirected away, Finish not available
    - expect: Observed: page shows 'Item total: $0', 'Tax: $0.00', 'Total: $0.00' and Finish leads to the confirmation (defect; see also DEF-CART)

#### 2.4. TC-CHK-10 Error clears after correcting the field and Continue succeeds

**File:** `tests/checkout/error-recovery.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-bike-light, open cart, checkout. Click continue with empty fields.
    - expect: 'Error: First Name is required'
  2. Fill all three fields with Jane / Doe / 12345 and click continue.
    - expect: URL /checkout-step-two.html
    - expect: no error element on the page
    - expect: subtotal 'Item total: $9.99', tax 'Tax: $0.80', total 'Total: $10.79'

#### 2.5. TC-CHK-11 Tax for single items fleece-jacket and bolt-t-shirt (merged into TC-CHK-03)

**File:** n/a (covered by `tests/checkout/tax-and-total.spec.ts`, cases 3 and 4)

**Steps:**
  1. Log in as standard_user, add only sauce-labs-fleece-jacket, checkout with Jane / Doe / 12345, continue.
    - expect: 'Item total: $49.99'
    - expect: 'Tax: $4.00'
    - expect: 'Total: $53.99'
  2. Fresh state, add only sauce-labs-bolt-t-shirt, repeat.
    - expect: 'Item total: $15.99'
    - expect: 'Tax: $1.28'
    - expect: 'Total: $17.27'

#### 2.6. TC-CHK-12 Names and postal code accept special characters

**File:** `tests/checkout/special-characters.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-backpack, checkout. Fill firstName "Jean-Luc", lastName "O'Brien", postalCode "SW1A 1AA", click continue.
    - expect: URL /checkout-step-two.html
    - expect: no error shown

#### 2.7. TC-CHK-13 problem_user last name field does not accept input (deviation record)

**File:** `tests/checkout/problem-user.spec.ts`

**Steps:**
  1. Log in as problem_user, add sauce-labs-backpack, checkout, fill firstName 'Jane', lastName 'Doe', postalCode '12345', click continue.
    - expect: Intended: step two is reached
    - expect: Observed: lastName stays empty and 'Error: Last Name is required' appears, so the order cannot be completed (annotate as known issue)

#### 2.8. TC-CHK-14 error_user Finish does nothing (deviation record)

**File:** `tests/checkout/error-user.spec.ts`

**Steps:**
  1. Log in as error_user, add sauce-labs-backpack, sauce-labs-bike-light, sauce-labs-onesie, checkout, fill the form, continue.
    - expect: Intended: step two with 'Item total: $47.97', 'Tax: $3.84', 'Total: $51.81' (observed identical, even though lastName stayed empty)
  2. Click finish.
    - expect: Intended: /checkout-complete.html
    - expect: Observed: stays on /checkout-step-two.html, no message, cart badge remains 3 (annotate as known issue)

#### 2.9. TC-CHK-15 visual_user and performance_glitch_user totals match standard_user

**File:** `tests/checkout/other-users-totals.spec.ts`

**Steps:**
  1. For each of visual_user and performance_glitch_user: log in, add sauce-labs-backpack, sauce-labs-bike-light, sauce-labs-onesie, checkout with Jane / Doe / 12345, continue (use generous timeouts for performance_glitch_user).
    - expect: 'Item total: $47.97'
    - expect: 'Tax: $3.84'
    - expect: 'Total: $51.81'
  2. Click finish.
    - expect: URL /checkout-complete.html with 'Thank you for your order!' and no cart badge

#### 2.10. TC-CHK-16 Step one initial state

**File:** `tests/checkout/step-one-initial-state.spec.ts`

**Steps:**
  1. Log in as standard_user, add sauce-labs-backpack, open cart, click checkout.
    - expect: title 'Checkout: Your Information'
    - expect: firstName placeholder 'First Name', lastName placeholder 'Last Name', postalCode placeholder 'Zip/Postal Code', all empty
    - expect: cancel visible with text 'Cancel', continue visible with value 'Continue'
    - expect: error element is not present
