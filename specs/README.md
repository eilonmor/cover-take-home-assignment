# Specs — Functional Specifications for saucedemo.com

The Playwright **planner** agent wrote these specs by exploring the live site through MCP (`npx playwright init-agents --loop=claude`). They describe the **intended (expected) behavior** of each area in a product-manager style. Automated tests assert against these specs, not against whatever the site currently does.

Each test must trace back to an acceptance criterion: TC → AC → US.

## Areas

| # | Spec | Prefix | Selected (≤ 6) | Backlog | Test folder |
|---|------|--------|----------------|---------|-------------|
| 1 | [01-login.md](01-login.md) | LOGIN | 6 (2 grouped) | 4 | `tests/login/` |
| 2 | [02-products.md](02-products.md) | PROD | 6 | 6 | `tests/products/` |
| 3 | [03-cart.md](03-cart.md) | CART | 6 | 5 | `tests/cart/` |
| 4 | [04-checkout.md](04-checkout.md) | CHK | 6 (1 grouped) | 10 (1 merged) | `tests/checkout/` |
| 5 | [05-logout-navigation.md](05-logout-navigation.md) | NAV | 6 (1 grouped) | 7 (1 merged) | `tests/navigation/` |

## Structure of every spec

The overview part has seven sections:

1. **Overview & scope**: what is in and out of scope for the area.
2. **User stories**: `US-<PREFIX>-NN`, written as "As a…, I want…, so that…".
3. **Acceptance criteria**: `AC-<PREFIX>-NN`, written as Given / When / Then, each linked to a US.
4. **Business rules & UI contract**: exact texts, `data-test` IDs, URLs, sort orders and price math.
5. **Edge cases & negative paths**.
6. **Known deviations per user**: bugs we observed. These are **never** acceptance criteria.
7. **Test candidate summary**: `TC-<PREFIX>-NN` with priority (P1–P3), tags (`@smoke` / `@regression`) and a Selected flag.

After that come the test scenarios, in two suites:

- **"<Area> — Selected"** holds the up to 6 tests per area that we automate. These are the input for the `playwright-test-generator` agent and for `TEST_PLAN.md`.
- **"<Area> — Backlog"** holds valid candidates that are not automated now. They are listed as out of scope in `TEST_PLAN.md`.

## Conventions

- **Locators:** use `getByTestId(...)`. `testIdAttribute` is `data-test` in [playwright.config.ts](../playwright.config.ts). The only exceptions are the burger-menu buttons, `#react-burger-menu-btn` and `#react-burger-cross-btn`, which have no `data-test`.
- **Fresh state:** every scenario starts from the login page in a new browser context. The cart persists in the `cart-contents` key in `localStorage`, and the session is held in the `session-username` cookie.
- **Waiting:** use auto-waiting assertions only, never fixed sleeps. Several behaviors are asynchronous:
  - the client-side redirect from protected URLs;
  - the cart badge render;
  - the burger-menu slide-in, about 0.5 s;
  - `performance_glitch_user` takes about 5 s before the inventory renders.

## Grouped verification tests

Each area has a budget of 6 tests. Checks with the same shape (same action, different inputs) are grouped into **one data-driven test**, while each case is still verified in isolation:

- Each case is its own `test.step` and starts from a fresh state.
- Every check uses `expect.soft`. An error thrown inside a case is caught and recorded against that case. Either way, the test moves on to the next case.
- The test **fails** if at least one check in any case failed, and **passes** only if all cases passed. The HTML report shows each case as a separate step.

Currently grouped:

| Test | Cases |
|------|-------|
| TC-LOGIN-02 | 13 invalid-login inputs |
| TC-LOGIN-04 | 4 accepted accounts |
| TC-NAV-02 | 6 protected URLs × 2 session states (never logged in, session cookie removed). Absorbs TC-NAV-07 (previously TC-NAV-04). |
| TC-CHK-03 | 10 cart combinations for tax and total. Absorbs TC-CHK-11. |

## Cross-spec decisions (from the review)

| Topic | Owner | Notes |
|-------|-------|-------|
| Protected-URL access and logout | NAV (TC-NAV-01/02) | LOGIN backlog TC-LOGIN-08/09 and CART backlog TC-CART-09 are **superseded**. |
| Cart badge | CART (TC-CART-01) owns the count rules | TC-PROD-06 asserts the badge only as feedback for the button toggle. PROD backlog TC-PROD-10 overlaps CART-01/11. |
| Empty-cart checkout | CART (TC-CART-08, backlog) | Checkout specs only reference it. |
| Protected-URL redirect | NAV | **Verified in review:** all 6 protected URLs redirect to `/` with `Epic sadface: You can only access '<path>' when you are logged in.` The redirect happens on the client. An earlier "stays on URL" observation was a timing artifact. |

## Known defects found during exploration

These are inputs for the risk section of `TEST_PLAN.md`. If any of them is automated, it is written as `test.fail()` against the intended behavior.

| Area | Defect (observed vs. intended) |
|------|-------------------------------|
| Cart | Checkout can start with an empty cart. |
| Checkout | Whitespace-only first name, last name or postal code is accepted. |
| Checkout | `/checkout-complete.html` shows the order confirmation without an order. On step two with an empty cart, Finish succeeds, and "Item total" shows `$0` with no decimals. |
| Navigation | Reset App State clears the cart, but the "Remove" buttons stay until a reload. |
| Navigation | Unknown routes render a blank shell instead of a 404 page. |
| Navigation | The cart survives logout and is not tied to the user. |
| problem_user | Placeholder images; sorting does nothing; add/remove fails for 3+3 products; names open the wrong product (id+1); the last name field can't be filled. |
| error_user | Sorting does nothing; add/remove fails; the last name value is dropped without an error; Finish does nothing. |
| visual_user | Inventory prices are randomized; the Backpack image is a placeholder. |
| performance_glitch_user | The inventory takes about 5 s to render after login. |

## Next steps

1. Build the POM classes and custom fixtures. Then generate the **Selected** scenarios with the `playwright-test-generator` agent, refactored onto the POM.
2. Derive `TEST_PLAN.md`, with its Test ID / steps / expected result / priority table, from the Selected suites.
