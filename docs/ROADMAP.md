# Implementation Roadmap

E2E tests for https://www.saucedemo.com with Playwright + TypeScript.
Source of truth for behavior: [`specs/`](../specs/README.md). Requirements: [`ASSIGNMENT.md`](../ASSIGNMENT.md).
Each phase runs in its own session, on its own branch from an up-to-date `main`, and ends with a PR to `main`. PRs are merged by the owner only.

## Status

| Phase | Branch | PR | Status |
|-------|--------|----|--------|
| 0. Foundation | `feat/foundation` | [#2](https://github.com/eilonmor/cover-take-home-assignment/pull/2) | Merged |
| 1. Login tests | `feat/tests-login` | [#3](https://github.com/eilonmor/cover-take-home-assignment/pull/3) | Merged |
| 2. Products tests | `feat/tests-products` | [#4](https://github.com/eilonmor/cover-take-home-assignment/pull/4) | Merged |
| 3. Cart tests | `feat/tests-cart` | [#5](https://github.com/eilonmor/cover-take-home-assignment/pull/5) | Merged |
| 4. Checkout tests | `feat/tests-checkout` | | In progress |
| 5. Navigation tests | `feat/tests-navigation` | | Not started |
| 6. Docs & delivery | `docs/delivery` | | Not started |

Status values: `Not started` → `In progress` → `In review` (PR open) → `Merged`.

---

## Global conventions (apply to every phase)

**Prerequisites (once per machine)**
- GitHub CLI: run `gh auth login` once. If `gh` is not on PATH in the VS Code terminal, restart VS Code, or call it as `& "C:\Program Files\GitHub CLI\gh.exe"`.
- `.env` copied from `.env.example`.

**Imports**
- Specs import **only** from `@fixtures/index`: `import { test, expect, GUEST_STATE } from '@fixtures/index';`. Test data comes from `@data/*` and helpers from `@utils/*`.
- Code under `src/` uses relative imports, as it does now.

**Locators**
- Use `getByTestId` with `testIdAttribute: 'data-test'`. Selectors live **only** in `src/pages/**`.
- The complete list of exceptions is below. Each one is defined once, in a page object, with a comment:
  - `#react-burger-menu-btn` and `#react-burger-cross-btn` (BurgerMenu): these buttons have no `data-test`.
  - `.bm-menu-wrap` (BurgerMenu): its `aria-hidden` attribute is the only reliable signal that the menu is open or closed.
  - `.error_icon` (LoginPage): the red circle-xmark icons inside the login inputs have no `data-test`.
- The `getByTestId(RegExp)` form is allowed for lists, for example `getByTestId(/-sidebar-link$/)`. A role query scoped to a data-test element is allowed for native children, for example the sort `<option>`s.
- Slugs with special characters, such as `test.allthethings()-t-shirt-(red)`, are passed as exact strings to `getByTestId` and never built into CSS.

**Page objects**
- A page object holds locators and actions, plus a single readiness wait, `waitForLoaded()`, which uses auto-waiting `expect` on the URL and a key element.
- Business assertions stay in the specs, so the same page objects work with `expect` or `expect.soft`.

**Test shape**
```ts
test.describe('Login', () => {
  test('TC-LOGIN-01 Standard user logs in successfully',
    { tag: ['@smoke'], annotation: { type: 'covers', description: 'AC-LOGIN-01' } },
    async ({ loginPage, inventoryPage }) => { /* ... */ });
});
```
- **Title:** starts with the spec TC ID.
- **Tags:** taken from the spec's candidate table.
- **`covers` annotation:** lists the ACs, giving the trace TC → AC → US.

**Modes**
- **Default (authenticated):** each test gets a new context from the worker's storageState. It starts logged in with an empty cart, on `about:blank`, so the first action is `xxxPage.goto()`.
- **Guest:** `test.use({ storageState: GUEST_STATE })`.
- **Another user:** `test.use({ authUser: 'problem' })`, only at the top level of the file.

**Known site bugs**
- A known site bug is never an acceptance criterion.
- Document it with `test.info().annotations.push({ type: 'known-issue', description })`, or write the test with `test.fail()` against the intended behavior, so a full run stays green.

**Waiting**
- Use auto-waiting assertions only. No `waitForTimeout`, no fixed sleeps.
- No `test.describe.serial` and no shared state between tests.
- `performance_glitch_user` gets `SLOW_RENDER_TIMEOUT` (15 s).

**Git**
- Conventional Commits, one commit per task.
- Each phase: a branch from an up-to-date `main` → a PR to `main` → stop. Never merge.

**Windows**
- If `npx playwright test` hangs at "clear output", a leftover node process is holding `test-results/`.
- Report it to the owner. Do not kill processes.
- Workaround (approved in Phase 1): run tests with `--output=test-results-cli` (git-ignored), for example `npm test -- --output=test-results-cli`. The Playwright MCP generator and the VS Code extension leave workers holding `test-results/`, and a separate output folder avoids waiting on them.

**Common Definition of done (every phase)**
- [ ] `npm run typecheck` passes.
- [ ] The phase's tests pass on their own (`npx playwright test tests/<area>`), then in a full `npm test` on chromium, firefox and webkit.
- [ ] `npm run test:smoke` passes. Phase 0 is excluded, because it has no tagged tests yet.
- [ ] No fixed sleeps, no `test.only`, no dependencies between tests, and no `describe.serial`.
- [ ] `/code-review` has run on the branch and its findings are fixed or answered in the PR.

**Common review checklist**
- [ ] Locators follow the UI contract (`data-test` IDs from the spec). The only exceptions are the 4 listed above.
- [ ] No selectors outside `src/pages/**`. No duplicated selectors.
- [ ] Strict typing: no `any`, no `as unknown as`, no non-null `!` without a comment.
- [ ] Spec TC IDs are in the test titles, and each test has its `covers` annotation and tags.
- [ ] Soft assertions are used where several independent checks follow one action. A hard assertion guards each navigation the rest of the test depends on.
- [ ] Test data comes from `src/data/`. No magic strings for products, prices or messages.
- [ ] Known bugs are handled with `known-issue` / `test.fail()` and are never asserted as expected behavior.

---

## Phase 0: Foundation

**Branch:** `feat/foundation` (from up-to-date `main`). **Target:** `main`. **Depends on:** nothing. The roadmap PR (`docs/roadmap`) should be merged first so the roadmap file is on `main`.

### Design

#### 0.A Test data (`src/data/`)

`src/data/products.ts` serves TC-PROD-01..06, TC-CART-*, TC-CHK-* and TC-NAV-04/06.
```ts
export type ProductKey = 'backpack' | 'bikeLight' | 'boltTShirt' | 'fleeceJacket' | 'onesie' | 'redTShirt';
export type ProductId = 0 | 1 | 2 | 3 | 4 | 5;
export interface Product {
  readonly key: ProductKey;
  readonly id: ProductId;          // id in /inventory-item.html?id=N and in item-N-title-link / item-N-img-link
  readonly slug: string;           // add-to-cart-<slug>, remove-<slug>, inventory-item-<slug>-img, item-<slug>-img
  readonly name: string;
  readonly price: string;          // display text, e.g. "$29.99"
  readonly priceCents: Cents;      // 2999
  readonly description: string;    // exact text from spec 02 §4
  readonly imagePrefix: string;    // e.g. "sauce-backpack-1200x1500"
}
export const PRODUCTS: Readonly<Record<ProductKey, Product>>;
/** Default list order, Name (A to Z). Ids do NOT follow this order: 4, 0, 1, 5, 2, 3. */
export const CATALOG_AZ: readonly ProductKey[]; // backpack, bikeLight, boltTShirt, fleeceJacket, onesie, redTShirt
export const PLACEHOLDER_IMAGE = /sl-404/;
```
- The ids are backpack 4, bikeLight 0, boltTShirt 1, fleeceJacket 5, onesie 2 and redTShirt 3.
- The red t-shirt's slug is the exact string `test.allthethings()-t-shirt-(red)`.

`src/data/sort-options.ts` serves TC-PROD-02/03.
```ts
export type SortValue = 'az' | 'za' | 'lohi' | 'hilo';
export interface SortOption { readonly value: SortValue; readonly label: string; readonly expectedOrder: readonly ProductKey[] }
export const SORT_OPTIONS: readonly SortOption[];   // in dropdown order, the orders from spec 02 §4 (Bolt before Red on price ties)
export const DEFAULT_SORT: SortValue;               // 'az'
```

`src/data/messages.ts` holds the exact UI texts, so none of them are magic strings in specs.
```ts
export const LOGIN_ERRORS: { readonly lockedOut; readonly noMatch; readonly usernameRequired; readonly passwordRequired };
export const protectedPageError: (path: string) => string;   // "Epic sadface: You can only access '<path>' when you are logged in."
export const CHECKOUT_ERRORS: { readonly firstName; readonly lastName; readonly postalCode };
export const PAGE_TITLES: { readonly inventory: 'Products'; readonly cart: 'Your Cart'; readonly checkoutInfo: 'Checkout: Your Information'; readonly checkoutOverview: 'Checkout: Overview'; readonly checkoutComplete: 'Checkout: Complete!' };
export const CHECKOUT_TEXT: { paymentLabel; paymentValue; shippingLabel; shippingValue; priceTotal; completeHeader; completeText; backHome; ponyAlt };
export const MENU_ITEMS: readonly string[];  // All Items, Dynamic Catalog, About, Logout, Reset App State
export const ABOUT_URL: 'https://saucelabs.com/';
```

`src/data/routes.ts` serves TC-NAV-02, TC-NAV-06 and the URL assertions everywhere.
```ts
export const ROUTES: { login: '/'; inventory: '/inventory.html'; details: (id: ProductId) => string; cart: '/cart.html'; checkoutInfo: '/checkout-step-one.html'; checkoutOverview: '/checkout-step-two.html'; checkoutComplete: '/checkout-complete.html' };
export interface ProtectedUrl { readonly url: string; readonly path: string; readonly expectedError: string }
export const PROTECTED_URLS: readonly ProtectedUrl[];        // the 6 URLs from spec 05 §4 (path has no query string)
export type SessionState = 'never logged in' | 'session cookie removed';
export const SESSION_STATES: readonly SessionState[];
```

`src/data/login-cases.ts` serves TC-LOGIN-02/04. The values are built lazily from `getUser()`, so they always match `.env`.
```ts
export interface InvalidLoginCase { readonly name: string; readonly username: string; readonly password: string; readonly expectedError: string; readonly covers: string }
export function invalidLoginCases(): readonly InvalidLoginCase[];   // the 13 rows of spec 01 TC-LOGIN-02 ('' = leave untouched)
export interface AcceptedAccountCase { readonly name: string; readonly user: UserKey; readonly timeout?: number }
export const ACCEPTED_ACCOUNTS: readonly AcceptedAccountCase[];      // problem, performanceGlitch (SLOW_RENDER_TIMEOUT), error, visual
```

`src/data/checkout.ts` serves TC-CHK-01..06 and TC-NAV-06.
```ts
export interface CheckoutInfo { readonly firstName: string; readonly lastName: string; readonly postalCode: string }
export const CUSTOMER: CheckoutInfo;                                  // Jane / Doe / 12345
export interface CheckoutCartCase { readonly name: string; readonly items: readonly ProductKey[]; readonly expected: { readonly itemTotal: string; readonly tax: string; readonly total: string } }
export const CHECKOUT_CARTS: readonly CheckoutCartCase[];             // the 10 carts of TC-CHK-03 with the observed "$x.xx" values
```

#### 0.B Money helper (`src/utils/money.ts`): TC-CHK-01/03/04, `toHaveOrderSummary`
```ts
export type Cents = number & { readonly __brand: 'Cents' };
export function cents(value: number): Cents;                  // throws unless a safe non-negative integer
export function parseMoney(text: string): Cents;              // "$29.99", "Item total: $39.98", "Total: $0" → cents; throws if no amount
export function formatMoney(value: Cents): string;            // 3998 → "$39.98"
export const TAX_RATE_PERCENT = 8;
export function taxFor(itemTotal: Cents): Cents;              // integer half-up: Math.floor((itemTotal * 8 + 50) / 100)
export interface OrderSummary { readonly itemTotal: Cents; readonly tax: Cents; readonly total: Cents }
export function summarize(prices: readonly Cents[]): OrderSummary;
export function summaryLabels(s: OrderSummary): { subtotal: string; tax: string; total: string }; // "Item total: $..", "Tax: $..", "Total: $.."
```
- All the math is done in integer cents, so there is no floating-point drift.
- TC-CHK-03 checks two things independently: the observed table and the rule.

#### 0.C Other utils
- `src/utils/timeouts.ts`: `export const SLOW_RENDER_TIMEOUT = 15_000;`.
- `src/utils/storage.ts`, which serves TC-CHK-03, TC-NAV-01/02/04 and TC-LOGIN-04:
  ```ts
  export const CART_STORAGE_KEY = 'cart-contents';
  export const SESSION_COOKIE = 'session-username';
  export async function readCartIds(page: Page): Promise<number[]>;             // [] when the key is missing
  export async function clearCart(page: Page): Promise<void>;                   // needs the app origin; removes the key (caller navigates after)
  export async function resetBrowserState(page: Page): Promise<void>;           // clearCookies → goto('/') → localStorage + sessionStorage clear
  export async function getSessionCookie(context: BrowserContext): Promise<Cookie | undefined>;
  export async function removeSessionCookie(context: BrowserContext): Promise<void>; // context.clearCookies({ name: SESSION_COOKIE })
  ```

#### 0.D Page objects (`src/pages/`)

| File | Class | Key members | Serves |
|------|-------|-------------|--------|
| `BasePage.ts` | `abstract BasePage` | `constructor(readonly page: Page)`, `abstract readonly path: string`, `goto(): Promise<void>` (goto + `waitForLoaded`), `abstract waitForLoaded(): Promise<void>` | all |
| `AppPage.ts` | `abstract AppPage extends BasePage` | `readonly header: Header`, `readonly menu: BurgerMenu`, `readonly title: Locator` (`title`) | all logged-in pages |
| `components/Header.ts` | `Header` | `cartLink` (`shopping-cart-link`), `cartBadge` (`shopping-cart-badge`), `openCart()` (click + wait `/cart.html`) | CART-*, PROD-06, CHK-*, NAV-* |
| `components/BurgerMenu.ts` | `BurgerMenu` | `openButton` (`#react-burger-menu-btn`), `closeButton` (`#react-burger-cross-btn`), `wrapper` (`.bm-menu-wrap`), `items` (`getByTestId(/-sidebar-link$/)`), `allItemsLink`, `dynamicCatalogLink`, `aboutLink`, `logoutLink`, `resetLink`; `open()` (click + wait `aria-hidden="false"`), `close()` (click + wait `"true"`), `goToAllItems()`, `logout()`, `resetAppState()` | NAV-01..06 |
| `components/ItemList.ts` | `ItemList` | `constructor(root: Locator)`; `items` (`inventory-item`), `names`, `descriptions`, `prices`, `quantities` (`item-quantity`), `row(key)` (filter on exact name), `nameIn(key)`, `priceIn(key)`, `quantityIn(key)` | inventory, cart, overview lists |
| `LoginPage.ts` (extend) | `LoginPage extends BasePage` | path `/`; existing `usernameInput`, `passwordInput`, `loginButton`, `errorMessage`; **new:** `errorButton` (`error-button`), `inputErrorIcons` (`.error_icon`), `fillCredentials(c: Partial<UserCredentials>)` (fills only non-empty values), `submit()`, `submitWithEnter()` (press Enter in password), `loginAs(key: UserKey)`, `dismissError()`. Keep `login(creds)`, which the auth fixture uses. | LOGIN-01..06, NAV-01/02/03 |
| `InventoryPage.ts` | `InventoryPage extends AppPage` | path `/inventory.html`; `container`, `list: ItemList` (`inventory-list`), `sortSelect` (`product-sort-container`), `sortOptions` (`sortSelect.getByRole('option')`), `activeSortOption` (`active-option`); `addButton(key)` / `removeButton(key)` (slug), `titleLink(key)` (`item-${id}-title-link`), `imageLink(key)` (`item-${id}-img-link`), `image(key)` (`inventory-item-${slug}-img`); `addToCart(...keys)` (click, then wait for the remove button), `removeFromCart(...keys)`, `sortBy(value: SortValue)`, `openDetailsByName(key)`, `openDetailsByImage(key)`; `waitForLoaded()` uses `SLOW_RENDER_TIMEOUT` | PROD-01..06, CART-*, CHK-*, NAV-* |
| `ProductDetailsPage.ts` | `ProductDetailsPage extends AppPage` | path `/inventory-item.html`; `open(key)` (goto `?id=N` + wait), `name`, `description`, `price` (scoped to `inventory-item`), `image(key)` (`item-${slug}-img`), `addButton` (`add-to-cart`), `removeButton` (`remove`), `backButton` (`back-to-products`); `addToCart()`, `removeFromCart()`, `backToProducts()`, `waitForLoaded(key?)` | PROD-04/05, CART-04/05/06, NAV-06 |
| `CartPage.ts` | `CartPage extends AppPage` | path `/cart.html`; `list: ItemList` (`cart-list`), `quantityLabel` (`cart-quantity-label`), `descriptionLabel` (`cart-desc-label`), `continueShoppingButton`, `checkoutButton`, `removeButton(key)`; `remove(...keys)`, `continueShopping()`, `checkout()`, `openItem(key)` | CART-01..06, CHK-05, NAV-06 |
| `CheckoutInfoPage.ts` | `CheckoutInfoPage extends AppPage` | path `/checkout-step-one.html`; `firstName`, `lastName`, `postalCode`, `continueButton`, `cancelButton`, `error`, `errorButton`; `fill(info: Partial<CheckoutInfo>)`, `continue()`, `submit(info)`, `cancel()`, `dismissError()` | CHK-01..06, NAV-06 |
| `CheckoutOverviewPage.ts` | `CheckoutOverviewPage extends AppPage` | path `/checkout-step-two.html`; `list: ItemList` (`cart-list`, verify the id live), `paymentLabel`/`paymentValue`, `shippingLabel`/`shippingValue`, `totalInfoLabel`, `subtotalLabel`, `taxLabel`, `totalLabel`, `cancelButton`, `finishButton`; `readSummary(): Promise<OrderSummary>`, `cancel()`, `finish()` | CHK-01/03/04/05/06, NAV-06 |
| `CheckoutCompletePage.ts` | `CheckoutCompletePage extends AppPage` | path `/checkout-complete.html`; `completeHeader`, `completeText`, `ponyExpressImage`, `backHomeButton` (`back-to-products`); `backHome()` | CHK-01/06, NAV-06 |
| `flows/ShopFlow.ts` | `ShopFlow` | `constructor(pages: Pages)`; `addAndOpenCart(keys)`, `startCheckout(keys)` (→ step one), `reachOverview(keys, info = CUSTOMER)` (→ step two), `placeOrder(keys, info = CUSTOMER)` (→ complete) | CHK-*, CART-06, NAV-06 |
| `index.ts` | registry | `export interface Pages { loginPage; inventoryPage; productDetailsPage; cartPage; checkoutInfoPage; checkoutOverviewPage; checkoutCompletePage }`, `export function createPages(page: Page): Pages` | fixture |

Notes:
- The `item-N-*` ids come from `PRODUCTS[key].id`, never from the list position.
- Read row values only after `waitForLoaded()`. Reading the cart before the URL changes returns the inventory DOM.
- `CheckoutCompletePage` uses `completeHeader`, not `header`, because `header` is already the `Header` component.

#### 0.E Fixtures
- `src/fixtures/pages.fixture.ts`:
  ```ts
  export interface PageFixtures extends Pages { shop: ShopFlow }
  export const test = base.extend<PageFixtures>({ loginPage: async ({ page }, use) => { await use(new LoginPage(page)); }, /* … */ shop: async ({ loginPage, inventoryPage, /* … */ }, use) => { await use(new ShopFlow({ /* pages */ })); } });
  ```
- `src/fixtures/matchers.ts` (bonus). It uses `expect.extend` on the base `expect`. Every matcher is auto-retrying (it delegates to a built-in web-first assertion with `timeout`), works with `expect.soft`, and returns a readable `message()`.
  ```ts
  toHaveCartBadge(header: Header, count: number, options?: { timeout?: number })   // 0 → badge absent (toHaveCount(0)); n → text "n"
  toShowProducts(list: ItemList, keys: readonly ProductKey[], options?)             // names AND prices in exact order; count === keys.length
  toHaveOrderSummary(page: CheckoutOverviewPage, summary: OrderSummary, options?)   // the 3 labels equal summaryLabels(summary)
  ```
  `.not` is not supported, and using it throws a clear error.
- `src/fixtures/index.ts`:
  ```ts
  export const test = mergeTests(authTest, pagesTest);
  export { expect } from './matchers';      // extended expect (mergeExpects if another extension is ever added)
  export { GUEST_STATE } from './auth.fixture';
  export type { AuthWorkerFixtures } from './auth.fixture';
  export type { PageFixtures } from './pages.fixture';
  ```

#### 0.F Grouped verification runner (`src/utils/grouped.ts`): TC-LOGIN-02, TC-LOGIN-04, TC-NAV-02, TC-CHK-03
```ts
export interface GroupedCase { readonly name: string }
export interface GroupedOptions<C extends GroupedCase> {
  /** Runs one case. It must start by establishing its own fresh state (e.g. goto('/'), resetBrowserState, clearCart). */
  readonly run: (testCase: C, index: number) => Promise<void>;
  /** Per-case step timeout, default 30_000. */
  readonly stepTimeout?: number;
}
export interface CaseResult { readonly title: string; readonly status: 'passed' | 'failed'; readonly errors: readonly string[] }
export async function runGroupedCases<C extends GroupedCase>(cases: readonly C[], options: GroupedOptions<C>): Promise<readonly CaseResult[]>;
```

How it works:
1. **Test budget:** it raises the test timeout to at least `cases.length × stepTimeout + 15 s`, using `test.setTimeout`. A grouped test then never needs `test.slow()`.
2. **One step per case:** each case runs in `test.step(`#${i + 1} ${c.name}`, () => run(c, i), { timeout: stepTimeout })`. The HTML report (and Allure) therefore shows every case as its own named step, with its own status and error.
3. **Soft failures:** before each step it records `test.info().errors.length`. Afterwards, any new entries are that case's `expect.soft` failures, and Playwright attributes them to the step.
4. **Hard errors:** the `test.step` call is wrapped in `try/catch`. A thrown error, such as a locator timeout or the per-step timeout, marks the step as failed in the report, is recorded for the case, and is **not** rethrown, so the loop moves on to the next case.
5. **Isolation:** every case starts by resetting its state, through its `run` callback, inside the same fixture `page`. Cases share no state with each other.
   - The reset is done in the same `page`, not in a new context, so trace, video and screenshot on failure keep working for the whole grouped test.
   - The reset helpers are `resetBrowserState`, `clearCart` and `loginPage.goto()`.
6. **Verdict:**
   - At the end the runner attaches `grouped-summary.md` (a table of case / status / first error) and adds an annotation `grouped: N cases, P passed, F failed`.
   - If any case failed, it throws `Error('F of N cases failed: #2 Wrong password, #9 …')`.
   - The test passes only if all cases passed. Soft failures already fail the test, and the final error adds a single readable summary.
   - With `retries: 1`, a failing grouped test reruns all of its cases.

### Tasks
- [x] **0.1** Add the product catalog and sort options: `src/data/products.ts`, `src/data/sort-options.ts` (+ `Cents` from 0.2: do 0.2 first if preferred) → `feat(data): add typed product catalog and sort options`
- [x] **0.2** Add the money helper `src/utils/money.ts` → `feat(utils): add cents-based money helper`
- [x] **0.3** Add messages, routes and protected URLs: `src/data/messages.ts`, `src/data/routes.ts` → `feat(data): add UI messages, routes and protected URLs`
- [x] **0.4** Add the login cases, accepted accounts and checkout carts: `src/data/login-cases.ts`, `src/data/checkout.ts` → `feat(data): add login cases and checkout cart data`
- [x] **0.5** Add the storage, session and timeout helpers: `src/utils/storage.ts`, `src/utils/timeouts.ts` → `feat(utils): add storage, session and timeout helpers`
- [x] **0.6** Add the base pages and components: `BasePage`, `AppPage`, `Header`, `BurgerMenu`, `ItemList` → `feat(pages): add base pages, header, burger menu and item list`
- [x] **0.7** Extend `LoginPage` (BasePage, errorButton, `.error_icon`, fillCredentials, submit, submitWithEnter, loginAs, dismissError). The auth fixture keeps working. → `feat(pages): extend LoginPage with error handling and Enter submit`
- [x] **0.8** Add `InventoryPage` and `ProductDetailsPage` → `feat(pages): add inventory and product details page objects`
- [x] **0.9** Add `CartPage` and the 3 checkout pages. Verify the `cart-list` id on step two with Playwright MCP. → `feat(pages): add cart and checkout page objects`
- [x] **0.10** Add the `src/pages/index.ts` registry and `ShopFlow` → `feat(pages): add page registry and shop flow`
- [x] **0.11** Add the pages fixture and merge it into `src/fixtures/index.ts` → `feat(fixtures): add pages fixture merged with auth via mergeTests`
- [x] **0.12** Add the custom matchers `src/fixtures/matchers.ts` and export them from index → `feat(fixtures): add cart badge, product list and order summary matchers`
- [x] **0.13** Add the grouped runner `src/utils/grouped.ts` → `feat(utils): add grouped verification test runner`
- [x] **0.14** Move `tests/seed.spec.ts` onto `@fixtures/index`: guest mode, `loginPage.goto()`. This proves the `@fixtures/*` alias resolves at runtime under TS 7 (no `baseUrl`). If it does not resolve, fix it in tsconfig/config and say so in the PR. → `chore(seed): use project fixtures in the agent seed test`
- [x] **0.15** Check the foundation with a throwaway spec that is **not committed** (`tests/_scratch.spec.ts`, deleted before the PR). It must:
  - log in, then walk inventory → details → cart → checkout → complete through `shop`;
  - exercise the 3 matchers;
  - run `runGroupedCases` with 3 cases, where 1 fails on purpose, and confirm in the HTML report that 3 steps are shown, the failing step is red, the others run, a summary is attached, and the test is red;
  - then flip the failing case to pass and confirm the test is green.

  Write the result in the PR description. There is no commit for this task.

### Definition of done
- The common checklist, with `test:smoke` as N/A.
- `npx playwright test tests/seed.spec.ts` passes on all 3 projects.
- The task 0.15 check is described in the PR.

### Review checklist (phase-specific)
- [ ] Every `data-test` id in the page objects matches spec §4 tables; the 4 exceptions only, each commented.
- [ ] Public members have JSDoc. Page objects contain no business assertions, only `waitForLoaded`.
- [ ] `PRODUCTS` matches spec 02 §4 exactly: ids, slugs, prices, descriptions.
- [ ] The money helper uses integers only, and `taxFor` gives the values in spec 04 §4 (0.64, 0.80, 1.28, 4.00, 2.40, 3.20, 2.56, 1.44, 3.84, 10.40).
- [ ] The grouped runner never swallows a failure silently: each case is shown as a step, and the test fails at the end.
- [ ] The matchers are typed, auto-retrying and soft-compatible.
- [ ] `auth.fixture.ts` behavior is unchanged: per worker, project and user, and globalSetup wipes the folder.

### Execution prompt
```text
Phase 0 (Foundation) of docs/ROADMAP.md. Windows machine; use PowerShell or Git Bash.
1. git checkout main; git pull; git checkout -b feat/foundation.
2. Read docs/ROADMAP.md (Global conventions + Phase 0 in full), specs/README.md, all 5 specs' "Business rules & UI contract" sections, ASSIGNMENT.md §04, and every file in src/, playwright.config.ts, tsconfig.json, tests/seed.spec.ts, and MEMORY.md.
3. Set Phase 0 status to "In progress" in ROADMAP's status table (include it in the first commit).
4. Implement tasks 0.1–0.15 in order, one at a time, with exactly the files, names and signatures in the Phase 0 design. Verify any data-test id you are unsure of with the Playwright MCP browser (read-only exploration). After each task: npm run typecheck, then commit with the task's Conventional Commit message (append the Co-Authored-By trailer if one is configured).
5. Run the Definition of done (typecheck; npx playwright test tests/seed.spec.ts; npm test). If a run hangs at "clear output", a leftover node process holds test-results/: report it and stop; do not kill processes.
6. Run /code-review on the branch; fix findings (one fix commit per logical fix, `fix: …` or `refactor: …`).
7. Tick Phase 0 checkboxes in docs/ROADMAP.md, set status "In review", commit `docs(roadmap): mark phase 0 in review`.
8. git push -u origin feat/foundation; open a PR to main with gh (if `gh` is not on PATH use & "C:\Program Files\GitHub CLI\gh.exe"; if it is not authenticated, stop and ask me to run `gh auth login`). PR body: summary, task list, the 0.15 smoke-check result, DoD results. Then put the PR link in the status table, commit `docs(roadmap): link phase 0 PR`, push. Stop for my review. Never merge.
```

---

## Phase 1: Login tests

**Branch:** `feat/tests-login` (from up-to-date `main`). **Target:** `main`. **Depends on:** Phase 0 merged.
Spec: [`specs/01-login.md`](../specs/01-login.md). Folder: `tests/login/`. **Mode:** every file is **guest**: `test.use({ storageState: GUEST_STATE })` at the top of the file. Describe: `Login`.

### Tasks
- [x] **1.1 TC-LOGIN-01 Standard user logs in successfully.** `tests/login/standard-user-login.spec.ts`. Tags `@smoke`. Covers AC-LOGIN-01. Not grouped.
  - Steps: `loginPage.goto()` → `fillCredentials(getUser('standard'))` → `submit()` → `inventoryPage.waitForLoaded()`.
  - Expect: the URL is `/inventory.html`, `title` = `PAGE_TITLES.inventory`, `list.items` has 6, and `loginPage.errorMessage` has 0.
  → `test(login): add TC-LOGIN-01 standard user login`
- [x] **1.2 TC-LOGIN-02 Invalid login attempts display the correct error message.** `tests/login/invalid-login-errors.spec.ts`. Tags `@smoke @regression`. Covers AC-LOGIN-02..07, 09, 12, 16, 17. **Grouped** over `invalidLoginCases()` (13 cases).
  - Each case: `loginPage.goto()` (fresh state) → `fillCredentials` (empty values are left untouched) → `submit()`.
  - Soft checks: the error has the exact text, the URL is still `/`, `errorButton` is visible, both inputs `toHaveClass(/\berror\b/)`, and `inputErrorIcons` has 2.
  → `test(login): add TC-LOGIN-02 grouped invalid login errors`
- [x] **1.3 TC-LOGIN-03 Error message can be dismissed and the user can then log in.** `tests/login/dismiss-error.spec.ts`. Tags `@regression`. Covers AC-LOGIN-08. Not grouped.
  - Submit empty → `LOGIN_ERRORS.usernameRequired` and the error button is visible → `dismissError()`.
  - Expect: the error has 0, `inputErrorIcons` has 0.
  - Then log in as standard → inventory "Products".
  → `test(login): add TC-LOGIN-03 dismiss error then log in`
- [x] **1.4 TC-LOGIN-04 All other accepted accounts can log in.** `tests/login/accepted-accounts-login.spec.ts`. Tags `@regression`. Covers AC-LOGIN-15. **Grouped** over `ACCEPTED_ACCOUNTS` (4 users).
  - Each case: `resetBrowserState(page)` (clears the previous case's session) → `loginPage.loginAs(user)`.
  - Soft checks: the URL is `/inventory.html`, the title is "Products", 6 items, no error. Use `timeout: SLOW_RENDER_TIMEOUT` for `performanceGlitch`.
  - Do not assert images or prices: these users have known catalog defects.
  → `test(login): add TC-LOGIN-04 grouped accepted accounts login`
- [x] **1.5 TC-LOGIN-05 Enter key submits the login form.** `tests/login/enter-key-submit.spec.ts`. Tags `@regression`. Covers AC-LOGIN-11.
  - `fillCredentials(standard)` → `submitWithEnter()` → the URL is `/inventory.html` and the title is "Products".
  → `test(login): add TC-LOGIN-05 Enter key submits login`
- [x] **1.6 TC-LOGIN-06 Login form initial state.** `tests/login/login-form-initial-state.spec.ts`. Tags `@regression`. Covers AC-LOGIN-10.
  - Soft checks: username and password are visible, empty (`toHaveValue('')`) and have the placeholders `Username` / `Password`; password has `type="password"`; the login button has value `Login`; the error has 0.
  - Then fill the password → it still has `type="password"` and value = `ENV.password`.
  → `test(login): add TC-LOGIN-06 login form initial state`

Known issues: none in the Selected set. The `performance_glitch_user` slowness is handled with a timeout, not asserted.

### Definition of done
The common checklist. Login has exactly 6 tests, so the full run has 18 login results (6 × 3 browsers).

### Review checklist (phase-specific)
- [x] The 13 + 4 cases come from `src/data/login-cases.ts`, with no inline credentials. The usernames come from `getUser()`.
- [x] The grouped tests use `runGroupedCases`, and every check inside a case is `expect.soft`, except one hard guard per case (the error is shown / the inventory URL is reached). The guard makes a broken case fail fast inside its own step, so it cannot time out the step and skip the cases after it.
- [x] Empty fields are left untouched, not filled with `''`, as the spec says.
- [x] No test depends on the worker auth. Every file is guest.

### Execution prompt
```text
Phase 1 (Login tests) of docs/ROADMAP.md. Windows machine.
1. git checkout main; git pull; git checkout -b feat/tests-login.
2. Read docs/ROADMAP.md (Global conventions + Phase 1), specs/README.md, specs/01-login.md (all of it), src/fixtures/*, src/pages/*, src/data/*, src/utils/grouped.ts, src/utils/storage.ts, and MEMORY.md. Set Phase 1 status "In progress".
3. For each task 1.1–1.6, one at a time:
   a. Launch the playwright-test-generator agent with the spec's "Login — Selected" scenario for that TC (test-suite "Login — Selected", test name, the file path from the task, seed tests/seed.spec.ts, and the scenario body verbatim).
   b. Rewrite the generated draft onto our framework: import only from @fixtures/index, use page-object fixtures/methods and src/data, title "TC-LOGIN-0N <spec title>", tags + covers annotation from the task, guest mode, runGroupedCases for grouped tasks. No raw selectors in the spec file.
   c. Run it alone: npx playwright test <file> --project=chromium, then all 3 projects. If it fails, launch the playwright-test-healer agent on it, then re-apply our conventions to its fix.
   d. npm run typecheck; commit with the task's message.
4. Definition of done: npx playwright test tests/login; npm test; npm run test:smoke; npm run typecheck. If a run hangs at "clear output", report the leftover node process holding test-results/ and stop; do not kill processes.
5. Run /code-review on the branch; fix findings.
6. Tick Phase 1 checkboxes, status "In review"; commit `docs(roadmap): mark phase 1 in review`.
7. Push; open PR to main with gh (fallback & "C:\Program Files\GitHub CLI\gh.exe"; if unauthenticated ask me to run gh auth login). PR body: TC list, DoD results (counts per browser). Add the PR link to the status table, commit, push. Stop for my review. Never merge.
```

---

## Phase 2: Products tests

**Branch:** `feat/tests-products`. **Target:** `main`. **Depends on:** Phase 1 merged.
Spec: [`specs/02-products.md`](../specs/02-products.md). Folder: `tests/products/`. **Mode:** authenticated (default, standard user). Every test starts with `inventoryPage.goto()`. Describe: `Products`. None of these tests uses the grouped runner. Sequential sub-checks use `test.step` + `expect.soft`.

### Tasks
- [x] **2.1 TC-PROD-01 Inventory shows 6 products with exact catalog data.** `tests/products/inventory-catalog.spec.ts`. Tags `@smoke`. Covers AC-PROD-01, 02.
  - `title` "Products".
  - `expect(inventoryPage.list).toShowProducts(CATALOG_AZ)`.
  - `list.descriptions` `toHaveText` the catalog descriptions.
  - For each product, soft: `image(key)` is visible, `alt` = name, `src` does not match `PLACEHOLDER_IMAGE`; `addButton(key)` has text "Add to cart".
  - `toHaveCartBadge(0)`.
  → `test(products): add TC-PROD-01 inventory catalog data`
- [x] **2.2 TC-PROD-02 Sort dropdown default and options.** `tests/products/sort-options.spec.ts`. Tags `@regression`. Covers AC-PROD-03, 04.
  - `sortSelect` `toHaveValue('az')`; `activeSortOption` "Name (A to Z)".
  - `sortOptions` `toHaveText(SORT_OPTIONS.map(label))`, and each option `toHaveAttribute('value', …)`.
  - `toShowProducts(CATALOG_AZ)`.
  → `test(products): add TC-PROD-02 sort dropdown default and options`
- [x] **2.3 TC-PROD-03 Each sort option orders products correctly.** `tests/products/sort-order.spec.ts`. Tags `@smoke @regression`. Covers AC-PROD-05.
  - For za, lohi, hilo, then az, in a `test.step` each: `sortBy(value)` → soft `toShowProducts(option.expectedOrder)` (names + prices), `list.items` has 6, and the URL is still `/inventory.html`.
  - Comment on the observed tie, Bolt before Red, in the price sorts.
  → `test(products): add TC-PROD-03 sort orders`
- [x] **2.4 TC-PROD-04 Open details via name and return with Back to products.** `tests/products/details-via-name.spec.ts`. Tags `@smoke`. Covers AC-PROD-06, 08, 09.
  - `openDetailsByName('backpack')`. Expect: the URL is `?id=4`; name, price and description from `PRODUCTS`; image visible with alt and not a placeholder; the add button reads "Add to cart"; the back button reads "Back to products".
  - `backToProducts()` → `/inventory.html` with 6 items.
  - Repeat for `redTShirt` (id 3). This checks that the ids don't follow list order.
  → `test(products): add TC-PROD-04 details via name`
- [x] **2.5 TC-PROD-05 Open details via image.** `tests/products/details-via-image.spec.ts`. Tags `@regression`. Covers AC-PROD-07, 08.
  - `openDetailsByImage('bikeLight')` → `?id=0`; data matches; not a placeholder.
  - Back → `openDetailsByImage('fleeceJacket')` → `?id=5`; data matches.
  → `test(products): add TC-PROD-05 details via image`
- [x] **2.6 TC-PROD-06 Add/remove toggle on inventory page.** `tests/products/inventory-add-remove.spec.ts`. Tags `@smoke`. Covers AC-PROD-10, 11.
  - Badge 0.
  - Add backpack → its remove button reads "Remove", badge 1.
  - Add bikeLight → badge 2; the other 4 add buttons are still "Add to cart".
  - Remove backpack → badge 1. Remove bikeLight → badge 0 (absent).
  - Add `redTShirt` (the special slug) → its remove button is visible, badge 1.
  - The badge is feedback only. CART owns the count rules.
  → `test(products): add TC-PROD-06 inventory add/remove toggle`

Known issues: none for standard_user. The deviations of problem_user, visual_user and error_user are out of scope (Backlog).

### Review checklist (phase-specific)
- [x] Expected orders come from `SORT_OPTIONS`, and catalog values come from `PRODUCTS`. No hard-coded name lists in specs.
- [x] Item links are built from `PRODUCTS[key].id`, never from the list index.
- [x] The special slug only goes through `getByTestId` exact strings.
- [x] `toShowProducts` / `toHaveCartBadge` are used instead of hand-rolled loops where they apply.

### Execution prompt
```text
Phase 2 (Products tests) of docs/ROADMAP.md. Windows machine.
1. git checkout main; git pull; git checkout -b feat/tests-products.
2. Read docs/ROADMAP.md (Global conventions + Phase 2), specs/README.md, specs/02-products.md, src/fixtures/*, src/pages/*, src/data/*, src/utils/*, and MEMORY.md. Set Phase 2 status "In progress".
3. For each task 2.1–2.6, one at a time:
   a. Launch playwright-test-generator with the "Products — Selected" scenario for that TC (suite "Products — Selected", the task's file path, seed tests/seed.spec.ts, scenario body verbatim; tell it to log in as standard_user first).
   b. Rewrite onto our framework: @fixtures/index only, authenticated default mode (start with inventoryPage.goto(); remove the generated UI login), page objects + src/data + custom matchers, title "TC-PROD-0N …", tags + covers annotation.
   c. Run alone on chromium then all 3 projects; on failure use playwright-test-healer, then re-apply our conventions.
   d. npm run typecheck; commit with the task's message.
4. Definition of done: npx playwright test tests/products; npm test; npm run test:smoke; npm run typecheck. If a run hangs at "clear output", report the node process holding test-results/ and stop; do not kill processes.
5. /code-review on the branch; fix findings.
6. Tick Phase 2 checkboxes, status "In review"; commit `docs(roadmap): mark phase 2 in review`.
7. Push; PR to main with gh (fallback full path; if unauthenticated ask me). Add PR link to the status table, commit, push. Stop for my review. Never merge.
```

---

## Phase 3: Cart tests

**Branch:** `feat/tests-cart`. **Target:** `main`. **Depends on:** Phase 2 merged.
Spec: [`specs/03-cart.md`](../specs/03-cart.md). Folder: `tests/cart/`. **Mode:** authenticated (default). A new context from the worker state starts with an empty cart. Describe: `Cart`. None of these tests uses the grouped runner.

### Tasks
- [x] **3.1 TC-CART-01 Cart badge hidden when empty and matches item count.** `tests/cart/badge-count.spec.ts`. Tags `@smoke`. Covers AC-CART-01, 02, 03.
  - `inventoryPage.goto()` → `toHaveCartBadge(0)`.
  - Add the 6 products in the spec's order (backpack, bikeLight, boltTShirt, fleeceJacket, onesie, redTShirt), asserting the badge 1..6 after each add.
  - `header.openCart()` → `/cart.html`, badge 6.
  → `test(cart): add TC-CART-01 badge count`
- [x] **3.2 TC-CART-02 Cart page lists items with correct quantity, name, description and price.** `tests/cart/cart-contents.spec.ts`. Tags `@smoke`. Covers AC-CART-04, 05, 06.
  - Add backpack and bikeLight → badge 2 → `openCart()`.
  - Expect:
    - `title` "Your Cart", `quantityLabel` "QTY", `descriptionLabel` "Description";
    - the continue and checkout buttons are visible;
    - `toShowProducts(['backpack','bikeLight'])`;
    - the quantities are `['1','1']` and the descriptions equal `PRODUCTS`;
    - the remove buttons for both are visible;
    - there is no quantity control: `cartPage.quantityInputs(key)` (row-scoped role query for textbox, spinbutton, slider and combobox, hidden ones included) has 0, after a hard guard that the row exists; and `cartPage.rowButtons(key)` (row buttons except the name link) is exactly `["Remove"]`, so a +/- stepper is caught.
  → `test(cart): add TC-CART-02 cart contents`
- [x] **3.3 TC-CART-03 Removing from the cart page updates rows, badge and inventory state.** `tests/cart/remove-from-cart.spec.ts`. Tags `@smoke`. Covers AC-CART-07, 08, 03.
  - `shop.addAndOpenCart(['backpack','bikeLight','onesie'])` → 3 rows, badge 3.
  - `remove('bikeLight')` → `toShowProducts(['backpack','onesie'])`, badge 2.
  - `continueShopping()` → the bikeLight add button and the backpack and onesie remove buttons are visible.
  - `openCart()` → remove the other 2 → 0 rows, badge 0; the labels and buttons are still visible.
  → `test(cart): add TC-CART-03 remove from cart`
- [x] **3.4 TC-CART-04 Continue Shopping and reload preserve the cart.** `tests/cart/cart-persistence.spec.ts`. Tags `@regression`. Covers AC-CART-10, 14.
  - `addAndOpenCart(['fleeceJacket','onesie'])` → `page.reload()` → same order, badge 2.
  - `continueShopping()` → badge 2, both remove buttons visible.
  - `openDetailsByName('fleeceJacket')` → the remove button is visible → `backToProducts()` → `openCart()` → 2 rows, badge 2.
  → `test(cart): add TC-CART-04 cart persistence`
- [x] **3.5 TC-CART-05 Cart items appear in add order, including one added from the details page.** `tests/cart/cart-order.spec.ts`. Tags `@regression`. Covers AC-CART-13, 16.
  - Add fleeceJacket, then backpack → badge 2.
  - `productDetailsPage.open('bikeLight')` (id 0) → `addToCart()` → the remove button is visible, badge 3.
  - `openCart()` → `toShowProducts(['fleeceJacket','backpack','bikeLight'])` (not catalog order).
  → `test(cart): add TC-CART-05 cart add order`
- [x] **3.6 TC-CART-06 Checkout button goes to checkout step one and item name opens details.** `tests/cart/cart-navigation.spec.ts`. Tags `@smoke`. Covers AC-CART-11, 15.
  - `addAndOpenCart(['backpack'])` → `openItem('backpack')` → the URL is `?id=4`, the name is shown, the remove button is visible.
  - `openCart()` → `checkout()` → the URL is `/checkout-step-one.html` only. Don't assert the form.
  → `test(cart): add TC-CART-06 cart navigation`

Known issues: none in the Selected set. The empty-cart checkout defect (TC-CART-08) is Backlog and goes into TEST_PLAN out of scope / risks.

### Review checklist (phase-specific)
- [x] Row values are read only after the `/cart.html` URL wait, inside `waitForLoaded`.
- [x] Order assertions use `toShowProducts`, which compares in exact order.
- [x] No test asserts the inventory's add/remove toggle beyond what the Cart ACs need (PROD owns it).

### Execution prompt
```text
Phase 3 (Cart tests) of docs/ROADMAP.md. Windows machine.
1. git checkout main; git pull; git checkout -b feat/tests-cart.
2. Read docs/ROADMAP.md (Global conventions + Phase 3), specs/README.md, specs/03-cart.md, src/fixtures/*, src/pages/*, src/data/*, src/utils/*, and MEMORY.md. Set Phase 3 status "In progress".
3. For each task 3.1–3.6, one at a time:
   a. Launch playwright-test-generator with the "Cart — Selected" scenario for that TC (suite "Cart — Selected", task file path, seed tests/seed.spec.ts, scenario verbatim; log in as standard_user first).
   b. Rewrite onto our framework: @fixtures/index only, authenticated default mode, page objects/shop flow/src/data/matchers, title "TC-CART-0N …", tags + covers annotation.
   c. Run alone (chromium, then all 3); on failure use playwright-test-healer, then re-apply conventions.
   d. npm run typecheck; commit with the task's message.
4. Definition of done: npx playwright test tests/cart; npm test; npm run test:smoke; npm run typecheck. If a run hangs at "clear output", report the node process holding test-results/ and stop; do not kill processes.
5. /code-review on the branch; fix findings.
6. Tick Phase 3 checkboxes, status "In review"; commit `docs(roadmap): mark phase 3 in review`.
7. Push; PR to main with gh (fallback full path; if unauthenticated ask me). Add PR link, commit, push. Stop for my review. Never merge.
```

---

## Phase 4: Checkout tests

**Branch:** `feat/tests-checkout`. **Target:** `main`. **Depends on:** Phase 3 merged.
Spec: [`specs/04-checkout.md`](../specs/04-checkout.md). Folder: `tests/checkout/`. **Mode:** authenticated (default). Describe: `Checkout`.

### Tasks
- [ ] **4.1 TC-CHK-01 End-to-end happy path with two items.** `tests/checkout/happy-path.spec.ts`. Tags `@smoke`. Covers AC-CHK-01, 07, 09–13, 15.
  - `shop.startCheckout(['backpack','bikeLight'])` → step one: title, 3 empty inputs, error 0.
  - `submit(CUSTOMER)` → step two: title, `toShowProducts`, quantities `['1','1']`.
  - `toHaveOrderSummary(summarize([...prices]))`, and the exact labels `Item total: $39.98` / `Tax: $3.20` / `Total: $43.18` (from `summaryLabels`).
  - `finish()` → complete: title, header, text and pony image from `CHECKOUT_TEXT`; badge 0.
  → `test(checkout): add TC-CHK-01 happy path`
- [ ] **4.2 TC-CHK-02 Step one required-field validation order, texts and dismiss.** `tests/checkout/step-one-validation.spec.ts`. Tags `@smoke @regression`. Covers AC-CHK-02..05.
  - `startCheckout(['backpack'])`.
  - Continue with empty fields → the URL is unchanged, `CHECKOUT_ERRORS.firstName`.
  - Fill first → `lastName` error. Fill last → `postalCode` error.
  - `dismissError()` → the error has 0; the values Jane/Doe are kept.
  - Clear first + fill postal → the `firstName` error again.
  - Each validation state is a `test.step`, with soft text checks and a hard URL check.
  → `test(checkout): add TC-CHK-02 step one validation`
- [ ] **4.3 TC-CHK-03 Tax and total are correct for every cart combination.** `tests/checkout/tax-and-total.spec.ts`. Tags `@regression`. Covers AC-CHK-11, 12, 13. **Grouped** over `CHECKOUT_CARTS` (10 cases); the runner sizes the timeout, so no `test.slow()`.
  - Each case: `inventoryPage.goto()` → `clearCart(page)` → `inventoryPage.goto()` → hard `toHaveCartBadge(0)` (isolation guard: never run on a leftover cart) → `shop.reachOverview(items)`.
  - Soft checks:
    - the 3 labels equal the row's observed strings;
    - **and** independently, `toHaveOrderSummary(summarize(items.map(priceCents)))`.
  → `test(checkout): add TC-CHK-03 grouped tax and total`
- [ ] **4.4 TC-CHK-04 Overview item list and static info match the cart.** `tests/checkout/overview-content.spec.ts`. Tags `@regression`. Covers AC-CHK-09, 10.
  - `reachOverview(['fleeceJacket','onesie'])` → badge 2.
  - `toShowProducts` in add order; quantities 1.
  - The payment and shipping labels and values and the "Price Total" header come from `CHECKOUT_TEXT`.
  - The summary is 57.98 / 4.64 / 62.62 (`summarize`); the cancel and finish buttons are visible.
  → `test(checkout): add TC-CHK-04 overview content`
- [ ] **4.5 TC-CHK-05 Cancel on step one and step two keeps the cart.** `tests/checkout/cancel.spec.ts`. Tags `@regression`. Covers AC-CHK-08, 14.
  - `startCheckout(['backpack','bikeLight'])` → `cancel()` → `/cart.html`, 2 rows, badge 2.
  - `checkout()` → `submit(CUSTOMER)` → overview `cancel()` → `/inventory.html` (not the cart), badge 2, both remove buttons visible.
  - `openCart()` → 2 rows.
  → `test(checkout): add TC-CHK-05 cancel keeps cart`
- [ ] **4.6 TC-CHK-06 Complete page, cart emptied and Back Home.** `tests/checkout/complete-and-back-home.spec.ts`. Tags `@smoke`. Covers AC-CHK-15, 16, 17.
  - `shop.placeOrder(['onesie'])` → complete-page texts; pony image alt "Pony Express"; back button "Back Home"; badge 0.
  - `backHome()` → `/inventory.html`, badge 0, the onesie add button is visible.
  - `openCart()` → 0 rows.
  → `test(checkout): add TC-CHK-06 complete page and back home`

Known issues: none in the Selected set. The whitespace-input, direct-complete and empty step-two defects are Backlog (TC-CHK-07/08/09) and go into the TEST_PLAN risks.

### Review checklist (phase-specific)
- [ ] All money is compared through `src/utils/money.ts` in integer cents, plus the exact label strings. No `parseFloat` in specs.
- [ ] TC-CHK-03 asserts both the observed table and the rule, independently, each with `expect.soft`.
- [ ] The customer data comes from `CUSTOMER`, and the checkout texts come from `CHECKOUT_TEXT` / `CHECKOUT_ERRORS`.
- [ ] Cart reset per grouped case goes only through `clearCart`, with no leftovers between cases.

### Execution prompt
```text
Phase 4 (Checkout tests) of docs/ROADMAP.md. Windows machine.
1. git checkout main; git pull; git checkout -b feat/tests-checkout.
2. Read docs/ROADMAP.md (Global conventions + Phase 4), specs/README.md, specs/04-checkout.md, src/fixtures/*, src/pages/*, src/data/*, src/utils/* (money.ts, grouped.ts, storage.ts), and MEMORY.md. Set Phase 4 status "In progress".
3. For each task 4.1–4.6, one at a time:
   a. Launch playwright-test-generator with the "Checkout — Selected" scenario for that TC (suite "Checkout — Selected", task file path, seed tests/seed.spec.ts, scenario verbatim; log in as standard_user first). For TC-CHK-03 generate a single cart (row 6) as the draft.
   b. Rewrite onto our framework: @fixtures/index only, authenticated default mode, shop flow + page objects + src/data + money helper + matchers, runGroupedCases for TC-CHK-03, title "TC-CHK-0N …", tags + covers annotation.
   c. Run alone (chromium, then all 3); on failure use playwright-test-healer, then re-apply conventions.
   d. npm run typecheck; commit with the task's message.
4. Definition of done: npx playwright test tests/checkout; npm test; npm run test:smoke; npm run typecheck. If a run hangs at "clear output", report the node process holding test-results/ and stop; do not kill processes.
5. /code-review on the branch; fix findings.
6. Tick Phase 4 checkboxes, status "In review"; commit `docs(roadmap): mark phase 4 in review`.
7. Push; PR to main with gh (fallback full path; if unauthenticated ask me). Add PR link, commit, push. Stop for my review. Never merge.
```

---

## Phase 5: Logout & Navigation tests

**Branch:** `feat/tests-navigation`. **Target:** `main`. **Depends on:** Phase 4 merged.
Spec: [`specs/05-logout-navigation.md`](../specs/05-logout-navigation.md). Folder: `tests/navigation/`. Describe: `Logout & Navigation`.

### Tasks
- [ ] **5.1 TC-NAV-01 Logout returns to login page with empty fields and cleared session cookie.** `tests/navigation/logout-clears-session.spec.ts`. Authenticated. Tags `@smoke`. Covers AC-NAV-05.
  - `inventoryPage.goto()` → `getSessionCookie(context)` value = `getUser('standard').username`.
  - `menu.logout()` → the URL is `/`; the login button is visible; username and password `toHaveValue('')`; the error has 0; `getSessionCookie` is `undefined`. Use `expect.poll` for the cookie checks.
  → `test(navigation): add TC-NAV-01 logout clears session`
- [ ] **5.2 TC-NAV-02 Protected pages are blocked without a valid session.** `tests/navigation/protected-urls-blocked.spec.ts`. **Guest**. Tags `@smoke @regression`. Covers AC-NAV-06, 12. **Grouped** over `SESSION_STATES × PROTECTED_URLS` (12 cases, named `<state> <url>`).
  - Each case starts with `resetBrowserState(page)`.
  - State B also does `loginPage.loginAs('standard')` → `inventoryPage.waitForLoaded()` → hard check that the cookie exists → `removeSessionCookie(context)`.
  - Then `page.goto(url)`. Soft checks: `toHaveURL('/')` (the redirect is client-side and auto-waited), the error has the exact `expectedError`, the login button is visible, and `header.cartLink` and `inventoryPage.container` have 0.
  → `test(navigation): add TC-NAV-02 grouped protected URLs`
- [ ] **5.3 TC-NAV-03 Browser Back/Forward after logout does not expose inventory.** `tests/navigation/back-forward-after-logout.spec.ts`. Authenticated. Tags `@regression`. Covers AC-NAV-07.
  - `inventoryPage.goto()` → `menu.logout()` → `page.goBack()` → the login button is visible, the inventory container has 0, and the error is `protectedPageError('/inventory.html')`.
  - `page.goForward()` → the login button is visible and the container has 0.
  → `test(navigation): add TC-NAV-03 back/forward after logout`
- [ ] **5.4 TC-NAV-04 Reset App State clears the cart and badge; buttons revert after reload.** `tests/navigation/reset-app-state.spec.ts`. Authenticated. Tags `@regression`. Covers AC-NAV-09, 10.
  - Add backpack and bikeLight → badge 2.
  - `menu.resetAppState()` → badge 0; `expect.poll(readCartIds)` equals `[]`; the URL is still `/inventory.html`.
  - **Known issue D1:**
    - Push `{ type: 'known-issue', description: 'D1: Reset App State leaves "Remove" buttons until reload' }`.
    - Do **not** assert the buttons before the reload.
  - `page.reload()` → both add buttons are visible, `getByTestId(/^remove-/)` has 0 (as the page object locator `inventoryPage.removeButtons`), and the badge is 0.
  → `test(navigation): add TC-NAV-04 reset app state`
- [ ] **5.5 TC-NAV-05 Burger menu opens with 5 items and closes with the X button.** `tests/navigation/burger-menu.spec.ts`. Authenticated. Tags `@smoke`. Covers AC-NAV-01, 02.
  - `menu.wrapper` `aria-hidden="true"`.
  - `open()` → `"false"`; `menu.items` `toHaveText(MENU_ITEMS)` in order; each is visible; `aboutLink` href = `ABOUT_URL`.
  - `close()` → `"true"`; the URL is still `/inventory.html`.
  → `test(navigation): add TC-NAV-05 burger menu open/close`
- [ ] **5.6 TC-NAV-06 All Items returns to inventory from cart, details and checkout pages.** `tests/navigation/all-items-navigation.spec.ts`. Authenticated. Tags `@regression`. Covers AC-NAV-04.
  - A `test.step` per page: cart, details (`item-4`), checkout step one, step two, and complete. Complete is included because AC-NAV-04 lists it.
  - Each step reaches the page through the shop flow or page objects, asserts the URL, then `menu.goToAllItems()` → `/inventory.html` and title "Products". Use soft checks.
  → `test(navigation): add TC-NAV-06 All Items from every page`

### Review checklist (phase-specific)
- [ ] The menu is opened and closed only through `BurgerMenu` (exceptions `#react-burger-*` and `.bm-menu-wrap`). Its state is read from `aria-hidden`, not from item visibility.
- [ ] TC-NAV-02 has 12 named steps, state B uses a real UI login, and each case resets state.
- [ ] D1 is an annotation, not an assertion, and the test stays green.
- [ ] Cookie and storage checks go through `src/utils/storage.ts` with `expect.poll`.

### Execution prompt
```text
Phase 5 (Logout & Navigation tests) of docs/ROADMAP.md. Windows machine.
1. git checkout main; git pull; git checkout -b feat/tests-navigation.
2. Read docs/ROADMAP.md (Global conventions + Phase 5), specs/README.md, specs/05-logout-navigation.md, src/fixtures/*, src/pages/* (BurgerMenu, Header), src/data/*, src/utils/* (grouped.ts, storage.ts), and MEMORY.md. Set Phase 5 status "In progress".
3. For each task 5.1–5.6, one at a time:
   a. Launch playwright-test-generator with the "Logout & Navigation — Selected" scenario for that TC (suite "Logout & Navigation — Selected", task file path, seed tests/seed.spec.ts, scenario verbatim). For TC-NAV-02 generate one URL in each state as the draft.
   b. Rewrite onto our framework: @fixtures/index only, the task's mode (authenticated or guest), page objects + storage helpers + src/data, runGroupedCases for TC-NAV-02, known-issue annotation for D1 in TC-NAV-04, title "TC-NAV-0N …", tags + covers annotation.
   c. Run alone (chromium, then all 3); on failure use playwright-test-healer, then re-apply conventions.
   d. npm run typecheck; commit with the task's message.
4. Definition of done: npx playwright test tests/navigation; npm test; npm run test:smoke; npm run typecheck. If a run hangs at "clear output", report the node process holding test-results/ and stop; do not kill processes.
5. /code-review on the branch; fix findings.
6. Tick Phase 5 checkboxes, status "In review"; commit `docs(roadmap): mark phase 5 in review`.
7. Push; PR to main with gh (fallback full path; if unauthenticated ask me). Add PR link, commit, push. Stop for my review. Never merge.
```

---

## Phase 6: Docs & delivery

**Branch:** `docs/delivery`. **Target:** `main`. **Depends on:** Phase 5 merged (all 30 tests on `main`).

### Tasks
- [ ] **6.1 Three-step run.** The assignment requires the project to run in three steps: `clone → install → test`.
  - If `.env` is missing, `playwright.config.ts` loads `.env.example` and prints a one-line notice. The values are the public demo credentials. `.env` still overrides.
  - `globalSetup` also wipes `allure-results/` (prepared for 6.4).
  → `feat(config): fall back to .env.example when .env is missing`
- [ ] **6.2 `TEST_PLAN.md` at the repo root.**
  - Overview of the site and the scope.
  - A test-case table built from the 5 Selected suites, 30 rows. Columns: Test ID, description, steps (condensed), expected result, priority, tags, ACs, file.
  - A note on grouped tests, with their case counts: 13, 4, 10 and 12.
  - Covered scenarios.
  - Out of scope: every Backlog TC with the reason, plus visual regression, API and accessibility.
  - Risks: the known-defects table from specs/README, site availability, the async redirect and badge, the performance_glitch_user timing, the cart kept in localStorage.
  - Summary: the final run results from 6.6.
  → `docs: add TEST_PLAN.md`
- [ ] **6.3 `README.md` rewrite.**
  - Project and site description; prerequisites (Node ≥ 20, npm, Git).
  - Installation: `git clone` → `npm install` (postinstall downloads the browsers; on Linux, `npx playwright install --with-deps`) → optionally `cp .env.example .env`.
  - Running:
    - all tests, a single file, a single test with `-g "TC-LOGIN-01"`;
    - one browser with `npm run test:chromium`;
    - headed, UI and debug modes;
    - `test:smoke` / `test:regression`.
  - Reports: `npm run report` (HTML) and the Allure commands.
  - Project structure, with each folder explained.
  - Design notes:
    - the auth fixture (per worker, project and user storageState; guest and `authUser` overrides);
    - the page objects and the `ShopFlow`;
    - the locator policy and its 4 exceptions;
    - the grouped verification runner, with a report screenshot description;
    - the custom matchers and the money helper;
    - tags and annotations (`covers`, `known-issue`);
    - the Playwright agents (planner, generator, healer) and the seed test.
  - Technologies; CI; the troubleshooting note on the Windows "clear output" hang.
  → `docs: rewrite README with setup, run, report and design notes`
- [ ] **6.4 Allure 3.**
  - devDependencies `allure-playwright` and `allure` (the Allure 3 CLI, no Java).
  - Reporter `['allure-playwright', { resultsDir: 'allure-results' }]`, next to list and HTML.
  - Scripts `allure:generate` (`allure generate allure-results -o allure-report`) and `allure:open`. Confirm the Allure 3 CLI syntax against its docs.
  - Map the `covers` and `known-issue` annotations to Allure labels or links where supported. Grouped steps show up as Allure steps.
  → `feat(report): integrate Allure 3 reporter`
- [ ] **6.5 GitHub Actions workflow `.github/workflows/playwright.yml`.**
  - Triggers: push to `main` and `pull_request` to `main`.
  - Job `typecheck`: `npm ci --ignore-scripts` → `npm run typecheck`.
  - Job `test`: a matrix of `chromium`, `firefox` and `webkit`, with `fail-fast: false`, Node LTS and npm cache.
    - Steps: `npm ci --ignore-scripts` → `npx playwright install --with-deps ${{ matrix.project }}` → `npx playwright test --project=${{ matrix.project }}`. `CI=true` gives 2 workers and `forbidOnly`; `.env` falls back per 6.1.
    - `actions/upload-artifact` uploads `playwright-report/` and `allure-results/` for each project, with `if: always()` and 14-day retention.
  - The report is a downloadable bonus. Reviewers still run the tests locally.
  → `ci: add GitHub Actions Playwright workflow`
- [ ] **6.6 Final run.**
  - Run `npm run typecheck`, `npm test` (3 browsers), `npm run test:smoke`, `npm run test:regression`, then `npm run report` and `npm run allure:generate`.
  - Record the totals per browser (expected: 30 tests × 3 = 90 passed, 0 flaky) and any `known-issue` annotations in TEST_PLAN's Summary.
  - Confirm the CI run on the PR is green.
  → `docs(test-plan): record final run results`

### Definition of done
- The common checklist.
- A fresh clone in a temp folder runs green with `npm install && npm test`, without creating `.env`.
- The HTML report opens with `npm run report`, and the Allure report generates and opens.
- CI is green on the PR, with the artifacts uploaded.
- `.gitignore` still covers `node_modules`, `test-results`, `playwright-report`, `.env`, `allure-results` and `allure-report`.

### Review checklist (phase-specific)
- [ ] The README covers every item in ASSIGNMENT §05, and every command in it was actually run.
- [ ] Every Selected TC appears in TEST_PLAN exactly once. The Backlog is listed as out of scope, and the known defects are listed as risks.
- [ ] No secrets in CI. Only the public demo values from `.env.example` are used.
- [ ] Allure is optional for a reviewer: the HTML report works without it.

### Execution prompt
```text
Phase 6 (Docs & delivery) of docs/ROADMAP.md. Windows machine.
1. git checkout main; git pull; git checkout -b docs/delivery.
2. Read docs/ROADMAP.md (all, especially Global conventions + Phase 6), ASSIGNMENT.md, specs/README.md and every spec's "Test candidate summary" and Selected/Backlog suites, playwright.config.ts, package.json, src/**, tests/**, .gitignore, .env.example, and MEMORY.md. Set Phase 6 status "In progress".
3. Implement tasks 6.1–6.6 in order, one at a time; npm run typecheck and commit after each with the task's message. Verify every README command by running it. For 6.4 check the current allure-playwright / Allure 3 docs before writing scripts.
4. Definition of done, including a fresh clone into a temp folder (outside the repo) with npm install && npm test and no .env. If a run hangs at "clear output", report the node process holding test-results/ and stop; do not kill processes.
5. /code-review on the branch; fix findings.
6. Tick Phase 6 checkboxes, status "In review"; commit `docs(roadmap): mark phase 6 in review`.
7. Push; PR to main with gh (fallback full path; if unauthenticated ask me). Wait for the CI run on the PR and report its result. Add the PR link to the status table, commit, push. Stop for my review. Never merge.
```
