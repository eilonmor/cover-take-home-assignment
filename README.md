# saucedemo.com E2E tests: Playwright + TypeScript

End-to-end tests for [Swag Labs](https://www.saucedemo.com), Sauce Labs' public e-commerce demo. It has a login screen, a product catalog, a cart, a checkout flow, and demo accounts with built-in bugs.

The suite has **30 tests**: 6 per area, for Login, Products, Cart, Checkout, and Logout & Navigation. Four of them are data-driven grouped tests, so the suite verifies 65 cases. Every test runs on Chromium, Firefox and WebKit. The tests assert the **intended** behavior written in [`specs/`](specs/README.md), not whatever the site currently does. Known site bugs are reported as annotations and never treated as acceptance criteria.

- **What is tested, and why:** [`TEST_PLAN.md`](TEST_PLAN.md) (test-case table, scope, risks, results).
- **Behavior specs**, with user stories and acceptance criteria per area: [`specs/`](specs/README.md).
- **Latest CI reports** for `main`: [Playwright](https://eilonmor.github.io/cover-take-home-assignment/) and [Allure](https://eilonmor.github.io/cover-take-home-assignment/allure/).
- **How the project was built**, phase by phase: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Prerequisites

- [Node.js](https://nodejs.org/) **22.18 or newer** (developed on Node 22.19), with npm. The floor comes from the Allure 3 CLI.
- [Git](https://git-scm.com/).
- Windows, macOS or Linux. On Linux, the browsers also need system libraries (see below).

## Installation

```bash
git clone https://github.com/eilonmor/cover-take-home-assignment.git
cd cover-take-home-assignment
npm install
```

- `npm install` also downloads the Playwright browsers (Chromium, Firefox, WebKit) through the `postinstall` script.
- **On Linux**, install the browsers' system dependencies once: `npx playwright install --with-deps`.

**Environment (optional).** The site URL and the demo credentials come from environment variables. If there is no `.env` file, the config falls back to [`.env.example`](.env.example) and prints a one-line notice. That file holds only the public demo values shown on the saucedemo login page, so the project runs in three steps: clone → install → test. To use other values, create your own `.env`:

```bash
cp .env.example .env
```

`.env` is git-ignored and always wins over `.env.example`. Variables already set in the shell win over both.

| Variable | Default | Used for |
|----------|---------|----------|
| `BASE_URL` | `https://www.saucedemo.com` | Site under test |
| `STANDARD_USER`, `LOCKED_OUT_USER`, `PROBLEM_USER`, `PERFORMANCE_GLITCH_USER`, `ERROR_USER`, `VISUAL_USER` | the demo usernames | Login per account |
| `PASSWORD` | `secret_sauce` | Shared password |

## Running the tests

Tests run **headless** by default, in parallel, with one retry (`retries: 1`).

| What | Command |
|------|---------|
| All tests, 3 browsers | `npm test` |
| One browser (Chromium) | `npm run test:chromium` |
| A single file | `npx playwright test tests/login/standard-user-login.spec.ts` |
| A single test, by its ID | `npx playwright test -g "TC-LOGIN-01"` |
| One test in one browser | `npx playwright test -g "TC-LOGIN-01" --project=chromium` |
| Smoke suite (`@smoke`) | `npm run test:smoke` |
| Regression suite (`@regression`) | `npm run test:regression` |
| Headed (browser windows visible) | `npm run test:headed` |
| UI mode (watch, time travel) | `npm run test:ui` |
| Debug with the Playwright Inspector | `npm run test:debug -- -g "TC-LOGIN-01" --project=chromium` |
| Type check only | `npm run typecheck` |

Arguments after `--` are passed to Playwright, so the scripts can be combined with filters. For example, `npm run test:headed -- -g "TC-CART-01" --project=firefox`.

A full `npm test` reports **93** results: the 30 tests × 3 browsers, plus `tests/seed.spec.ts` × 3. The seed only opens the login page, and the Playwright agents start from it (see [Design notes](#playwright-test-agents-and-the-seed-test)).

## Reports

**Playwright HTML report** (built in):

```bash
npm run report
```

It opens `playwright-report/` from the last run. Each test shows its steps, its annotations (`covers`, `known-issue`, `grouped`) and its attachments. A failed test also keeps a screenshot, a video and a trace (`retain-on-failure`), and the trace opens in the Trace Viewer from the report.

**Allure Report 3** (optional bonus). Nothing extra needs installing: `npm install` already added the `allure-playwright` reporter and the Allure 3 CLI, which is a Node package and needs no Java (it is what sets the Node 22.18 floor above). Every test run writes raw results to `allure-results/`, and each run starts by clearing the previous results.

```bash
npm run allure:generate   # allure generate allure-results -o allure-report --clean
npm run allure:open       # allure open allure-report (serves the report and opens a browser)
```

How the project's metadata appears in Allure:
- The `@smoke` / `@regression` tags become Allure tags.
- `covers` becomes one **story** per acceptance criterion, under a **feature** per area. The Behaviors tab is grouped by AC.
- `known-issue` adds a `known-issue` tag and a label with the defect text.
- `grouped` becomes a label with the case summary, and each grouped case is an Allure step.

The mapping is done by an automatic fixture, [`allure.fixture.ts`](src/fixtures/allure.fixture.ts), because allure-playwright does not read annotations added while a test runs. It sends the labels as one "Allure Metadata" attachment, which is also visible in the HTML report.

The HTML report never depends on Allure.

## Project structure

```
.
├── .claude/agents/          Playwright Test Agents definitions (planner, generator, healer)
├── .github/workflows/       CI workflow (typecheck, tests per browser, merged reports to Pages)
├── docs/ROADMAP.md          Implementation plan, conventions and per-phase status
├── specs/                   Behavior specs per area: user stories, ACs, UI contract, defects
├── src/
│   ├── data/                Typed test data: products, sort orders, messages, routes, users, login and checkout cases
│   ├── fixtures/            Custom fixtures (auth, page objects, Allure labels), custom matchers, the single `test`/`expect` entry point
│   ├── pages/               Page Object Model
│   │   ├── components/      Shared parts: Header, BurgerMenu, ItemList
│   │   ├── flows/           ShopFlow: multi-page journeys (add to cart → checkout → order)
│   │   └── *.ts             One class per page, plus the BasePage/AppPage bases and the registry
│   ├── utils/               Money (integer cents), grouped runner, storage/session helpers, env, timeouts
│   └── global-setup.ts      Wipes the old auth files and Allure results before each run
├── tests/
│   ├── login/ products/ cart/ checkout/ navigation/    6 specs per area
│   └── seed.spec.ts         Seed test for the Playwright agents
├── playwright.config.ts     Projects, reporters, retries, timeouts, artifacts, .env loading
├── tsconfig.json            Strict TypeScript and the path aliases (@fixtures, @pages, @data, @utils)
├── .env.example             Public demo values (copied to .env if you want to change them)
├── TEST_PLAN.md             Test plan
└── ASSIGNMENT.md            The assignment brief
```

## Design notes

### Fixtures and authentication

Specs import from one place only: `import { test, expect, GUEST_STATE } from '@fixtures/index'`. `test` is `mergeTests(auth, pages, allure)`.

- **Auth fixture** ([`auth.fixture.ts`](src/fixtures/auth.fixture.ts)): each worker logs in **once per project and user**, through the real login form, and saves Playwright `storageState`. Every test then gets a new browser context from that state. It starts logged in with an empty cart, fully isolated from other tests. `globalSetup` deletes the old auth files at the start of each run, so a session is never reused across runs.
- **Guest mode:** `test.use({ storageState: GUEST_STATE })` for logged-out specs, such as all Login tests and the protected-URL test.
- **Another account:** `test.use({ authUser: 'problem' })`, at the top level of a spec file.
- **Page fixtures** ([`pages.fixture.ts`](src/fixtures/pages.fixture.ts)) inject one instance of every page object (`loginPage`, `inventoryPage`, `cartPage`, …) plus `shop`, all bound to the test's `page`.

### Page objects and ShopFlow

- Each page is a class with locators and actions, plus one readiness wait, `waitForLoaded()`, which checks the URL and a key element with auto-waiting `expect`.
- `BasePage` provides `goto()`. `AppPage` adds the `header`, the burger `menu` and the `title` shared by every logged-in page.
- `ItemList` is one component for the three product lists (inventory, cart and checkout overview).
- **Business assertions stay in the specs**, so the same page objects work with both `expect` and `expect.soft`.
- `ShopFlow` composes the pages for multi-page journeys: `addAndOpenCart`, `startCheckout`, `reachOverview` and `placeOrder`. Checkout tests start where they need to be in one line.

### Locator policy

- Locators use `getByTestId`, with `testIdAttribute: 'data-test'`. Selectors live **only** in `src/pages/**`.
- The 4 exceptions, each defined once in a page object with a comment:
  - `#react-burger-menu-btn` and `#react-burger-cross-btn` (BurgerMenu): these buttons have no `data-test`.
  - `.bm-menu-wrap` (BurgerMenu): its `aria-hidden` attribute is the only reliable open/closed signal.
  - `.error_icon` (LoginPage): the error icons inside the login inputs have no `data-test`.
- Ids with special characters, such as `add-to-cart-test.allthethings()-t-shirt-(red)`, are passed as exact strings and never built into CSS.

### Grouped verification tests

Each area has a budget of 6 tests. Checks with the same shape are grouped into one data-driven test with [`runGroupedCases`](src/utils/grouped.ts). TC-LOGIN-02 has 13 invalid logins, TC-LOGIN-04 has 4 accounts, TC-CHK-03 has 10 carts, and TC-NAV-02 has 12 protected-URL cases.

- Every case runs in its own named `test.step` (`#3 Unknown user`), with its own timeout, and starts by resetting its state.
- Checks are `expect.soft`. A thrown error is caught and recorded against that case. Either way, the next case still runs.
- At the end, the runner attaches `grouped-summary.md` (case / status / first error) and adds an annotation `grouped: 13 cases, 13 passed, 0 failed`. If any case failed, it throws one summary error, such as `2 of 13 cases failed: #2 Wrong password, #9 …`.
- **In the HTML report**, a grouped test shows a list of steps named `#1 …` to `#N …`. Each step has a green or red status and its own error message and code location. The `grouped-summary.md` table is attached below them. A failing case is visible at a glance, and the other cases still report their results.
- The runner sizes the test timeout from the number of cases, so no `test.slow()` is needed.

### Custom matchers and the money helper

Three custom matchers are defined in [`matchers.ts`](src/fixtures/matchers.ts). Each one auto-retries (it is built from web-first assertions within one time budget), works with `expect.soft`, and prints a readable message:

- `toHaveCartBadge(header, n)`: the badge shows `n`, and `0` means the badge is absent, checked only once the header has rendered.
- `toShowProducts(list, keys)`: exactly these products, with names and prices in this order.
- `toHaveOrderSummary(overview, summary)`: the three checkout labels ("Item total", "Tax", "Total").

[`money.ts`](src/utils/money.ts) does all price math in **integer cents** with a branded `Cents` type: parsing, formatting, and tax at 8 % rounded half-up. TC-CHK-03 checks each cart against the observed values **and**, independently, against this rule.

### Tags and annotations

- **Tags:** `@smoke` (the critical path) and `@regression` (the wider suite), taken from each spec's candidate table.
- **`covers`:** every test lists the acceptance criteria it verifies, for example `covers: AC-CHK-11, AC-CHK-12, AC-CHK-13`. With the TC ID in the title, this gives the trace TC → AC → user story.
- **`known-issue`:** a site defect is documented, not asserted. Examples are D1 (Reset App State leaves "Remove" buttons until a reload) and DEF-CHK-SUBTOTAL (an unrounded item total). The annotation is added only while the defect shows, so it disappears once the site is fixed, and the run stays green.
- **`grouped`:** the case summary of a grouped test.

### Playwright Test Agents and the seed test

The project was built with the official Playwright Test Agents, set up once with `npx playwright init-agents --loop=claude`. Their definitions are in [`.claude/agents/`](.claude/agents/), and the MCP servers are in [`.mcp.json`](.mcp.json).

1. **Planner:** explored the live site and wrote the specs in [`specs/`](specs/README.md).
2. **Generator:** turned each Selected scenario into a draft test, which was then rewritten onto the fixtures, page objects and test data.
3. **Healer:** debugged failing drafts.

[`tests/seed.spec.ts`](tests/seed.spec.ts) is the agents' starting point: a guest test that only opens the login page through the project fixtures.

## Technologies

| Tool | Purpose |
|------|---------|
| [Playwright Test](https://playwright.dev/) 1.65 | Test runner, browsers, assertions, HTML report, traces |
| [TypeScript](https://www.typescriptlang.org/) 7 (strict) | Typed page objects, data and fixtures |
| [dotenv](https://github.com/motdotla/dotenv) | Loads `.env` / `.env.example` |
| [Allure Report 3](https://allurereport.org/) + `allure-playwright` | Optional rich report with labels by area, AC and known issue |
| Playwright Test Agents + MCP | Spec planning, test generation and healing |
| GitHub Actions + Pages | CI: typecheck, one test job per browser, merged reports published to GitHub Pages |

## Continuous integration

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push to `main` and on every pull request to `main`:

- **Typecheck:** `npm ci --ignore-scripts` → `npm run typecheck`.
- **Tests:** one job per browser (`chromium`, `firefox`, `webkit`), with `fail-fast: false`, so one browser's failure never hides the others. Each job installs only its own browser (`npx playwright install --with-deps <browser>`), then runs `npx playwright test --project=<browser>`. On CI, Playwright uses 2 workers, `forbidOnly` and an extra `blob` reporter, whose file is named per browser.
- **Report:** runs after the three test jobs, even when tests failed. It merges their blob reports into one Playwright HTML report (`npx playwright merge-reports`) and their Allure results into one Allure report. It uploads both as the `reports` artifact (14 days): the Playwright report at the root, the Allure report under `allure/`. To open a downloaded copy, unzip it and run `npx playwright show-report <folder>`.
- **Deploy (pushes to `main` only):** publishes the same reports to GitHub Pages: [Playwright report](https://eilonmor.github.io/cover-take-home-assignment/) and [Allure report](https://eilonmor.github.io/cover-take-home-assignment/allure/). Pull requests don't deploy, so the published report always shows `main`. A one-time repo setting is needed: **Settings → Pages → Source: GitHub Actions**.
- **No secrets:** CI has no `.env`, so it uses the public demo values from `.env.example`.

## Troubleshooting

**Windows: a run hangs at "clear output".** A leftover Node process is holding the `test-results/` folder open. This usually comes from the VS Code Playwright extension or a Playwright MCP session. Close that tool, or write the run's output to another folder:

```powershell
npm test -- --output=test-results-cli
```

(`test-results-cli/` is git-ignored.)

**Timeouts on a slow machine.** The full run takes about 2 minutes with 10 workers. On a slower machine or connection, use fewer workers, for example `npm test -- --workers=2`. On Windows, avoid running from a folder under `%TEMP%`: there the run was about 2.5× slower, likely because antivirus scans the per-test video and trace files.

**`Missing environment variable "…"`.** Both `.env` and `.env.example` are missing, or the variable is empty in your `.env`. Copy `.env.example` to `.env` again.

**Linux: the browsers fail to start.** Run `npx playwright install --with-deps` to install their system libraries.
