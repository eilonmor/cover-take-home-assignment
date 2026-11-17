# Products — Functional Specification

## Application Overview

## 1. Overview & scope

The Products area is the post-login catalog at `/inventory.html` plus the product details page at `/inventory-item.html?id=N`. It lets a shopper browse the 6-item catalog, sort it, open an item, and toggle add/remove from either page.

**In scope**
- Inventory page: title "Products", item count (6), each item's name, description, price, image, add-to-cart button.
- Sort dropdown: 4 options, default, resulting order for each.
- Opening product details via name link and via image link.
- Details page: name, description, price, image consistent with the list; "Back to products".
- Add/remove button toggle on the inventory and details pages (button text/data-test change) and the cart badge as visible feedback only (appears, updates, disappears).
- Invalid product id in the URL ("ITEM NOT FOUND" page).
- Per-user comparison (problem_user, visual_user, error_user, performance_glitch_user).

**Out of scope (other specs)**
- Cart page and cart contents, checkout (Cart spec).
- Login, logout, burger menu (including its "Dynamic Catalog" link), protected-route access.
- Footer/social links.

Test data: standard_user / secret_sauce. baseURL https://www.saucedemo.com, `testIdAttribute = data-test`. Cart state persists in the browser (localStorage) per browser context, so every test must start in a fresh context from the login page.

## 2. User stories

- **US-PROD-01** As a shopper, I want to see all products on the inventory page with name, description, price, image and an add-to-cart button, so that I can decide what to buy.
- **US-PROD-02** As a shopper, I want to sort products by name or price, so that I can find items quickly.
- **US-PROD-03** As a shopper, I want to open a product's details by clicking its name or image, so that I can read about it, and return to the list easily.
- **US-PROD-04** As a shopper, I want to add or remove a product from the list or from its details page and get visible feedback (button text, cart badge), so that I know what I selected.
- **US-PROD-05** As a shopper, I want a clear message if I open a product that does not exist, so that I am not left on a broken page.

## 3. Acceptance criteria

| AC ID | US | Criterion |
|---|---|---|
| AC-PROD-01 | US-PROD-01 | Given I am logged in as standard_user, When the inventory page loads, Then the URL is `/inventory.html`, the header (`title`) reads "Products", and exactly 6 `inventory-item` elements are displayed. |
| AC-PROD-02 | US-PROD-01 | Given the inventory page, When I read each item, Then each shows name, description, price, image (alt text equals the product name) and a button "Add to cart", and the names/prices match the catalog table in section 4. |
| AC-PROD-03 | US-PROD-02 | Given the inventory page, When it first loads, Then the sort dropdown (`product-sort-container`) shows "Name (A to Z)" (value `az`) and items are ordered A to Z. |
| AC-PROD-04 | US-PROD-02 | Given the inventory page, When I open the dropdown, Then it offers exactly 4 options: "Name (A to Z)", "Name (Z to A)", "Price (low to high)", "Price (high to low)". |
| AC-PROD-05 | US-PROD-02 | Given the inventory page, When I select each sort option, Then the 6 items are re-ordered as defined in section 4 (name order, price order numeric ascending/descending; equal prices keep the A-to-Z relative order), the same 6 items are shown, and each price stays attached to its product. |
| AC-PROD-06 | US-PROD-03 | Given the inventory page, When I click an item name (`item-N-title-link`), Then I land on `/inventory-item.html?id=N` showing that product. |
| AC-PROD-07 | US-PROD-03 | Given the inventory page, When I click an item image (`item-N-img-link`), Then I land on the same details page as via the name. |
| AC-PROD-08 | US-PROD-03 | Given a details page, Then name (`inventory-item-name`), description (`inventory-item-desc`), price (`inventory-item-price`) and image equal those in the list, and the button "Add to cart" (`add-to-cart`) and link "Back to products" (`back-to-products`) are present. |
| AC-PROD-09 | US-PROD-03 | Given a details page, When I click "Back to products", Then I return to `/inventory.html` with all 6 products. |
| AC-PROD-10 | US-PROD-04 | Given the inventory page with an empty cart, When I click "Add to cart" on an item, Then that button becomes "Remove" (data-test `remove-<slug>`), and the cart badge (`shopping-cart-badge`) appears showing "1"; adding another item makes it "2" and does not affect other items' buttons. |
| AC-PROD-11 | US-PROD-04 | Given an item showing "Remove" on the inventory page, When I click it, Then the button returns to "Add to cart" (`add-to-cart-<slug>`) and the badge decrements; when the last item is removed the badge disappears. |
| AC-PROD-12 | US-PROD-04 | Given a details page, When I click "Add to cart", Then the button becomes "Remove" (`remove`) and the badge shows "1"; clicking "Remove" reverts to "Add to cart" and the badge disappears. |
| AC-PROD-13 | US-PROD-04 | Given I added an item on its details page, When I click "Back to products", Then that item's inventory button shows "Remove" and the badge still shows "1" (state is consistent between pages). |
| AC-PROD-14 | US-PROD-05 | Given I am logged in, When I open `/inventory-item.html?id=99` (or -1, abc, 6, or no id), Then the page shows "ITEM NOT FOUND" with the text "We're sorry, but your call could not be completed as dialled. Please check your number, and try your call again.", and a working "Back to products" link; no product price/Add button is shown. |

## 4. Business rules & UI contract

**Catalog (default order A to Z; id = N in the details URL)**

| id | Name | Price | Description (complete text, verified live; assert with exact match) | Image file |
|---|---|---|---|---|
| 4 | Sauce Labs Backpack | $29.99 | "carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection." | sauce-backpack-1200x1500-*.jpg |
| 0 | Sauce Labs Bike Light | $9.99 | "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included." | bike-light-1200x1500-*.jpg |
| 1 | Sauce Labs Bolt T-Shirt | $15.99 | "Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt." | bolt-shirt-1200x1500-*.jpg |
| 5 | Sauce Labs Fleece Jacket | $49.99 | "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office." | sauce-pullover-1200x1500-*.jpg |
| 2 | Sauce Labs Onesie | $7.99 | "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel." | red-onesie-1200x1500-*.jpg |
| 3 | Test.allTheThings() T-Shirt (Red) | $15.99 | "This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton." | red-tatt-1200x1500-*.jpg |

Note: ids are not in alphabetical order; the list order does not equal id order. Two products share $15.99 (Bolt T-Shirt, Test.allTheThings() T-Shirt (Red)). Image filenames have a hash suffix; assert on the prefix, not the full name. The "not found" placeholder image is `sl-404-*.jpg` (alt "ITEM NOT FOUND"); a valid product must never show it.

**Sort options** (`<select data-test="product-sort-container">`)

| Label | value | Expected order (names) | Prices |
|---|---|---|---|
| Name (A to Z) (default) | az | Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red) | 29.99, 9.99, 15.99, 49.99, 7.99, 15.99 |
| Name (Z to A) | za | Test.allTheThings() T-Shirt (Red), Onesie, Fleece Jacket, Bolt T-Shirt, Bike Light, Backpack | 15.99, 7.99, 49.99, 15.99, 9.99, 29.99 |
| Price (low to high) | lohi | Onesie, Bike Light, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Backpack, Fleece Jacket | 7.99, 9.99, 15.99, 15.99, 29.99, 49.99 |
| Price (high to low) | hilo | Fleece Jacket, Backpack, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Bike Light, Onesie | 49.99, 29.99, 15.99, 15.99, 9.99, 7.99 |

(Names above omit the "Sauce Labs " prefix except for the Test.allTheThings() item.) The tie between the two $15.99 items resolves as Bolt before Test.allTheThings() in both price sorts (observed; stable sort). Tests may assert the full order but should note the tie is an observed rather than documented behavior. The active option text is shown in `active-option`.

**data-test IDs (verified)**
- Inventory: `title` ("Products"), `inventory-container`, `inventory-list`, `inventory-item` (x6), `inventory-item-name`, `inventory-item-desc`, `inventory-item-price`, `product-sort-container`, `active-option`, `shopping-cart-link`, `shopping-cart-badge` (only present when cart is non-empty).
- Per-item links: `item-N-title-link`, `item-N-img-link` (N = product id above). Images: `inventory-item-<slug>-img`, e.g. `inventory-item-sauce-labs-backpack-img`.
- Buttons: `add-to-cart-<slug>` / `remove-<slug>` where slug = lowercase, hyphenated name: `sauce-labs-backpack`, `sauce-labs-bike-light`, `sauce-labs-bolt-t-shirt`, `sauce-labs-fleece-jacket`, `sauce-labs-onesie`, `test.allthethings()-t-shirt-(red)` (the last contains dots and parentheses; use getByTestId with the exact string, not CSS).
- Details page: `back-to-products` ("Back to products"), `inventory-item`, `inventory-item-name`, `inventory-item-desc`, `inventory-item-price`, `item-<slug>-img` (e.g. `item-sauce-labs-backpack-img`; note: different from the list's `inventory-item-<slug>-img`), `add-to-cart` / `remove` (no slug on the details page).
- Not found page: `inventory-item` container, image `item-item-not-found-img`, `back-to-products`.
- Standard-user: the list item's `inventory-item` element holds name, description, price, button and links.

**URLs**: `/inventory.html`; `/inventory-item.html?id=N` with N in 0-5.

**Other rules**: sorting is client-side (URL does not change). No catalog item shows a quantity. Clicking the add button on the list does not navigate. Cart badge is a count of distinct added items.

## 5. Edge cases & negative paths

- Invalid ids: `id=99`, `id=-1`, `id=abc`, `id=6`, missing id all show "ITEM NOT FOUND" (observed identical page, HTTP page still renders, URL unchanged). Back to products works.
- Two products with equal price ($15.99): verify sort stability (Bolt before Test.allTheThings() in both price sorts).
- Add all 6 items: badge shows 6; remove all: badge disappears.
- Add on details page, return to list: button state preserved ("Remove").
- Sort selection then open details and go back: sort selection is not asserted (observed to reset to default on return; treat as non-contractual).
- Direct-URL access to details while logged in works without visiting the list.
- Item with special characters in its slug (`test.allthethings()-t-shirt-(red)`): add/remove must work.
- Repeated rapid click on add/remove must not drive the badge negative or double count.

## 6. Known deviations per user

Observed; NOT acceptance criteria.

**problem_user**
- All 6 list images show the same placeholder `sl-404-*.jpg` instead of product images (details page images are correct for valid ids).
- Sorting does nothing: selecting za/lohi/hilo leaves the order and the dropdown value reverts to "az".
- Add to cart does not work for Bolt T-Shirt, Fleece Jacket, Test.allTheThings() T-Shirt (button stays "Add to cart", badge not updated). Remove does not work for Backpack, Bike Light, Onesie (button stays "Remove" and badge stays). Details page "Remove" also did not remove.
- Clicking a list item name leads to the wrong product: item id N opens `id=N+1` (Bike Light opens Bolt T-Shirt, ... Fleece Jacket (id 5) opens id=6 showing "ITEM NOT FOUND" with price "$√-1").
- Backpack's details (id=4) appear correct when reached via the link of id 3.

**visual_user**
- Prices on the list are wrong and randomized on each render (e.g. Backpack $96.54, Bike Light $17.02; different values after each sort/reload), so sort by price is not meaningful; the details page shows the correct prices.
- Backpack image on the list is the `sl-404` placeholder; layout/alignment differences were seen in styling (not asserted).
- Sorting by name works; add/remove and badge work.

**error_user**
- Sorting does nothing (order and dropdown revert to "az"), same as problem_user (a JavaScript error or alert is raised; not investigated in detail).
- Add to cart fails for Bolt T-Shirt, Fleece Jacket, Test.allTheThings() T-Shirt; remove fails for Backpack, Bike Light, Onesie (same pattern as problem_user).
- Details pages navigate to the correct ids, but the description was not found by `inventory-item-desc` in the check (unverified; may be a timing issue).

**performance_glitch_user**
- After login the product list takes about 5 seconds to render (observed ~5.1 s). Afterwards sorting, details and add/remove behave as for standard_user. Tests must wait for `inventory-item` rather than a fixed timeout.

**Other observations (standard_user)**
- The first page load logs a console error (not investigated; no visible effect).
- The burger menu contains an extra "Dynamic Catalog" item (`dynamic-catalog-sidebar-link`), out of scope here.

## 7. Test candidate summary

| TC ID | AC ref | Title | Priority | Tags | Selected |
|---|---|---|---|---|---|
| TC-PROD-01 | AC-PROD-01, 02 | Inventory shows 6 products with exact names, prices, descriptions, images and Add to cart buttons | P1 | @smoke | yes |
| TC-PROD-02 | AC-PROD-03, 04 | Sort dropdown default is Name (A to Z) and offers 4 options | P2 | @regression | yes |
| TC-PROD-03 | AC-PROD-05 | Each of the 4 sort options orders the products correctly (names and prices) | P1 | @smoke @regression | yes |
| TC-PROD-04 | AC-PROD-06, 08, 09 | Open details via name; details match list; Back to products returns | P1 | @smoke | yes |
| TC-PROD-05 | AC-PROD-07, 08 | Open details via image shows the same product with matching data | P2 | @regression | yes |
| TC-PROD-06 | AC-PROD-10, 11 | Add/remove on the inventory page toggles button text and cart badge | P1 | @smoke | yes |
| TC-PROD-07 | AC-PROD-12, 13 | Add/remove on the details page toggles button and badge; state kept on return | P2 | @regression | no |
| TC-PROD-08 | AC-PROD-14 | Invalid product id shows ITEM NOT FOUND with working Back to products | P2 | @regression | no |
| TC-PROD-09 | AC-PROD-08 | All 6 details pages match the catalog (data-driven by id 0-5) | P2 | @regression | no |
| TC-PROD-10 | AC-PROD-10 | Adding all 6 items gives badge 6; removing all hides the badge | P3 | @regression | no |
| TC-PROD-11 | AC-PROD-05 | Price sort keeps stable order for the two $15.99 items | P3 | @regression | no |
| TC-PROD-12 | AC-PROD-01 | performance_glitch_user product list eventually renders all 6 items | P3 | @regression | no |

## Appendix: assumptions
Every test starts in a fresh browser context at the login page and logs in as standard_user. Cart state is stored in the browser, so fresh contexts are required for badge assertions.

## Test Scenarios

### 1. Products — Selected

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-PROD-01 Inventory shows 6 products with exact catalog data

**File:** `tests/products/inventory-catalog.spec.ts`

**Steps:**
  1. Go to / and log in as standard_user / secret_sauce using getByTestId username, password, login-button
    - expect: URL is https://www.saucedemo.com/inventory.html
  2. Read the title and count the inventory-item elements
    - expect: title (data-test=title) has text 'Products'
    - expect: exactly 6 inventory-item elements
  3. For each item read inventory-item-name, inventory-item-price, inventory-item-desc, the img and the button
    - expect: Names/prices in order: Sauce Labs Backpack $29.99; Sauce Labs Bike Light $9.99; Sauce Labs Bolt T-Shirt $15.99; Sauce Labs Fleece Jacket $49.99; Sauce Labs Onesie $7.99; Test.allTheThings() T-Shirt (Red) $15.99
    - expect: Each description is non-empty and equals the catalog text in the spec
    - expect: Each image is visible, its src does not contain 'sl-404', and its alt equals the product name
    - expect: Each button has text 'Add to cart' and the data-test add-to-cart-<slug> exists
    - expect: shopping-cart-badge is not present

#### 1.2. TC-PROD-02 Sort dropdown default and options

**File:** `tests/products/sort-options.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page loaded
  2. Inspect product-sort-container
    - expect: Selected value is 'az' and active-option text is 'Name (A to Z)'
    - expect: Exactly 4 options with labels 'Name (A to Z)', 'Name (Z to A)', 'Price (low to high)', 'Price (high to low)' and values az, za, lohi, hilo
  3. Read item names
    - expect: Order is A to Z: Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, Test.allTheThings() T-Shirt (Red)

#### 1.3. TC-PROD-03 Each sort option orders products correctly

**File:** `tests/products/sort-order.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page loaded
  2. Select 'Name (Z to A)' via selectOption on product-sort-container
    - expect: Names: Test.allTheThings() T-Shirt (Red), Sauce Labs Onesie, Sauce Labs Fleece Jacket, Sauce Labs Bolt T-Shirt, Sauce Labs Bike Light, Sauce Labs Backpack
    - expect: Prices: $15.99, $7.99, $49.99, $15.99, $9.99, $29.99
    - expect: Still 6 items
  3. Select 'Price (low to high)'
    - expect: Names: Onesie, Bike Light, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Backpack, Fleece Jacket
    - expect: Prices: $7.99, $9.99, $15.99, $15.99, $29.99, $49.99
  4. Select 'Price (high to low)'
    - expect: Names: Fleece Jacket, Backpack, Bolt T-Shirt, Test.allTheThings() T-Shirt (Red), Bike Light, Onesie
    - expect: Prices: $49.99, $29.99, $15.99, $15.99, $9.99, $7.99
  5. Select 'Name (A to Z)'
    - expect: Order returns to the default A to Z order with matching prices; URL remains /inventory.html

#### 1.4. TC-PROD-04 Open details via name and return with Back to products

**File:** `tests/products/details-via-name.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page loaded
  2. Click item-4-title-link (Sauce Labs Backpack)
    - expect: URL is /inventory-item.html?id=4
    - expect: inventory-item-name 'Sauce Labs Backpack'
    - expect: inventory-item-price '$29.99'
    - expect: inventory-item-desc equals the Backpack description from the catalog
    - expect: Image visible, alt 'Sauce Labs Backpack', src not containing sl-404
    - expect: add-to-cart button text 'Add to cart'
    - expect: back-to-products text 'Back to products'
  3. Click back-to-products
    - expect: URL is /inventory.html
    - expect: 6 inventory-item elements visible
  4. Repeat for Test.allTheThings() T-Shirt (Red) via item-3-title-link
    - expect: URL is /inventory-item.html?id=3 with name 'Test.allTheThings() T-Shirt (Red)' and price '$15.99'

#### 1.5. TC-PROD-05 Open details via image

**File:** `tests/products/details-via-image.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page loaded
  2. Click item-0-img-link (Sauce Labs Bike Light image)
    - expect: URL is /inventory-item.html?id=0
    - expect: Name 'Sauce Labs Bike Light', price '$9.99', description equals catalog text, image src does not contain sl-404
  3. Go back to products and click item-5-img-link
    - expect: URL is /inventory-item.html?id=5
    - expect: Name 'Sauce Labs Fleece Jacket', price '$49.99', description equals catalog text

#### 1.6. TC-PROD-06 Add/remove toggle on inventory page updates button and badge

**File:** `tests/products/inventory-add-remove.spec.ts`

**Steps:**
  1. Log in as standard_user (fresh context, empty cart)
    - expect: shopping-cart-badge not present
  2. Click add-to-cart-sauce-labs-backpack
    - expect: Button is replaced by remove-sauce-labs-backpack with text 'Remove'
    - expect: shopping-cart-badge text '1'
  3. Click add-to-cart-sauce-labs-bike-light
    - expect: remove-sauce-labs-bike-light shown with text 'Remove'
    - expect: Badge text '2'
    - expect: Other four items still show 'Add to cart'
  4. Click remove-sauce-labs-backpack
    - expect: Button returns to 'Add to cart' (add-to-cart-sauce-labs-backpack)
    - expect: Badge text '1'
  5. Click remove-sauce-labs-bike-light
    - expect: Button returns to 'Add to cart'
    - expect: shopping-cart-badge is not present
  6. Click add-to-cart-test.allthethings()-t-shirt-(red) using getByTestId with that exact string
    - expect: Button becomes 'Remove' (remove-test.allthethings()-t-shirt-(red)), badge '1'

### 2. Products — Backlog

**Seed:** `tests/seed.spec.ts`

#### 2.1. TC-PROD-07 Add/remove on details page and state on return

**File:** `tests/products/details-add-remove.spec.ts`

**Steps:**
  1. Log in as standard_user and open /inventory-item.html?id=4 via item-4-title-link
    - expect: Button 'Add to cart' (add-to-cart), no badge
  2. Click add-to-cart
    - expect: Button 'Remove' (data-test remove)
    - expect: Badge '1'
  3. Click back-to-products
    - expect: remove-sauce-labs-backpack with text 'Remove' on the list
    - expect: Badge '1'
  4. Open the Backpack details again and click remove
    - expect: Button 'Add to cart', badge not present

#### 2.2. TC-PROD-08 Invalid product id shows ITEM NOT FOUND

**File:** `tests/products/invalid-product-id.spec.ts`

**Steps:**
  1. Log in as standard_user, then page.goto('/inventory-item.html?id=99')
    - expect: Text 'ITEM NOT FOUND' visible
    - expect: Text contains 'We're sorry, but your call could not be completed as dialled.'
    - expect: No inventory-item-price and no add-to-cart button
  2. Repeat for id=-1, id=abc, id=6 and no id
    - expect: Same ITEM NOT FOUND page each time
  3. Click back-to-products
    - expect: URL is /inventory.html with 6 items

#### 2.3. TC-PROD-09 All details pages match the catalog

**File:** `tests/products/details-all-products.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: Inventory page loaded
  2. For id 0..5 go to /inventory-item.html?id=N
    - expect: Name, price, description and image prefix match the catalog row with that id; image alt equals name

#### 2.4. TC-PROD-10 Add all six then remove all

**File:** `tests/products/add-all-remove-all.spec.ts`

**Steps:**
  1. Log in as standard_user and click every add-to-cart-<slug> button in turn
    - expect: Badge increments 1..6; every button shows 'Remove'
  2. Click every remove-<slug> button
    - expect: Badge decrements and disappears after the last; all buttons 'Add to cart'

#### 2.5. TC-PROD-11 Price sort tie keeps stable order

**File:** `tests/products/price-sort-tie.spec.ts`

**Steps:**
  1. Log in as standard_user and select 'Price (low to high)'
    - expect: The two $15.99 items appear as Sauce Labs Bolt T-Shirt then Test.allTheThings() T-Shirt (Red)
  2. Select 'Price (high to low)'
    - expect: Same relative order of the two $15.99 items (Bolt first)

#### 2.6. TC-PROD-12 performance_glitch_user list eventually renders

**File:** `tests/products/performance-glitch-render.spec.ts`

**Steps:**
  1. Log in as performance_glitch_user / secret_sauce
    - expect: Waiting for inventory-item (timeout 15s) succeeds; roughly 5 s delay is tolerated
  2. Count items and read names/prices
    - expect: 6 items with catalog names and prices; sorting by 'Price (low to high)' gives the standard order
