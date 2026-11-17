# Login — Functional Specification

## Application Overview

## 1. Overview & scope

Swag Labs (https://www.saucedemo.com) is a demo e-commerce site. The Login area is the entry point at `/` (page title "Swag Labs"). It has a single form (accessible name "Login") with a username field, a password field and a Login button. Below the form the page lists the accepted usernames (`standard_user`, `locked_out_user`, `problem_user`, `performance_glitch_user`, `error_user`, `visual_user`) and the text "Password for all users:" with `secret_sauce`.

**In scope**
- Successful login for each of the six listed users and landing on `/inventory.html`.
- Rejected logins: locked-out user, wrong password, unknown user, empty username, empty password, both empty.
- Error message container, its dismiss (X) button, red error styling and icons on the inputs.
- Masked password field, Enter-key submission, whitespace and case sensitivity of credentials.
- Per-user differences (slow login, broken images) recorded as known deviations.

**Out of scope**
- Inventory, cart, checkout, sorting, product detail behavior (other spec areas). Only the landing page markers are checked here.
- Access control for protected URLs and logout. AC-LOGIN-13/14 are kept for reference, but they are owned and tested by the Logout & Navigation spec (TC-NAV-01/02).
- Visual/pixel layout testing, accessibility audits, cross-browser, security/penetration testing, performance benchmarking beyond the rough measurement of `performance_glitch_user`.

**Test data:** password for all users is `secret_sauce`. Every test starts from a fresh browser context on the login page (baseURL = https://www.saucedemo.com).

## 2. User stories

- **US-LOGIN-01** As a registered shopper (`standard_user`), I want to log in with my username and password, so that I can reach the product catalog and start shopping.
- **US-LOGIN-02** As a shopper whose account is locked, I want to be told clearly that I am locked out, so that I understand why I cannot log in and can contact support.
- **US-LOGIN-03** As a shopper who mistyped credentials, I want a clear error that my credentials do not match, so that I can correct them (without the site revealing which field was wrong).
- **US-LOGIN-04** As a shopper who forgot to fill a field, I want to be told which required field is missing, so that I can complete the form.
- **US-LOGIN-05** As a shopper, I want to dismiss an error message and retry, so that I can recover from a failed attempt without reloading the page.
- **US-LOGIN-06** As a shopper, I want my password hidden while typing and the form submittable with Enter, so that my credentials stay private and entry is fast.
- **US-LOGIN-07** As the business owner, I want the catalog to be inaccessible without logging in, so that only authenticated users reach the shop.
- **US-LOGIN-08** As a user of any of the supported accounts (problem, performance, error, visual), I want login to succeed and land on the catalog, so that I can use the site (specific defects per user are tracked in section 6).

## 3. Acceptance criteria

- **AC-LOGIN-01** (US-LOGIN-01) Given the login page, When I enter `standard_user` / `secret_sauce` and click Login, Then the URL becomes `https://www.saucedemo.com/inventory.html`, the page title element (`data-test="title"`) reads "Products", and 6 inventory items are shown; no error is displayed.
- **AC-LOGIN-02** (US-LOGIN-02) Given the login page, When I enter `locked_out_user` / `secret_sauce` and click Login, Then I stay on `https://www.saucedemo.com/` and the error shows "Epic sadface: Sorry, this user has been locked out."
- **AC-LOGIN-03** (US-LOGIN-03) Given the login page, When I enter a valid username with a wrong password, Then I stay on `/` and the error shows "Epic sadface: Username and password do not match any user in this service".
- **AC-LOGIN-04** (US-LOGIN-03) Given the login page, When I enter a non-existent username with any password, Then the same error as AC-LOGIN-03 is shown (no user enumeration).
- **AC-LOGIN-05** (US-LOGIN-04) Given the login page, When I leave the username empty (password filled) and click Login, Then the error shows "Epic sadface: Username is required".
- **AC-LOGIN-06** (US-LOGIN-04) Given the login page, When I fill the username and leave the password empty and click Login, Then the error shows "Epic sadface: Password is required".
- **AC-LOGIN-07** (US-LOGIN-04) Given the login page, When both fields are empty and I click Login, Then the error shows "Epic sadface: Username is required" (username is validated first).
- **AC-LOGIN-08** (US-LOGIN-05) Given an error is displayed, When I click the error dismiss button (`error-button`), Then the error container disappears and the red error styling/icons on both inputs are removed; I can then enter valid credentials and log in successfully.
- **AC-LOGIN-09** (US-LOGIN-05) Given a failed attempt, When it fails, Then both inputs get red error styling (class `input_error form_input error`, red bottom border rgb(226, 35, 26)) and each input shows a red circle-xmark icon.
- **AC-LOGIN-10** (US-LOGIN-06) Given the login page, When I type in the password field, Then the field has `type="password"` (characters masked); placeholders are "Username" and "Password"; the button value is "Login".
- **AC-LOGIN-11** (US-LOGIN-06) Given valid credentials typed, When I press Enter in the password field, Then the form submits exactly as if Login was clicked (landing on `/inventory.html`).
- **AC-LOGIN-12** (US-LOGIN-03) Given the login page, When the username has different case (`STANDARD_USER`), or leading/trailing whitespace (` standard_user`, `standard_user `), or the password has different case (`SECRET_SAUCE`) or trailing whitespace, Then login is rejected with the "do not match" error (credentials are case-sensitive and not trimmed).
- **AC-LOGIN-13** (US-LOGIN-07) Given I am not logged in, When I navigate directly to `/inventory.html`, Then I am redirected to `/` and the error shows "Epic sadface: You can only access '/inventory.html' when you are logged in."
- **AC-LOGIN-14** (US-LOGIN-01) Given I am logged in, When I open the burger menu (`#react-burger-menu-btn`) and click Logout (`logout-sidebar-link`), Then I return to `/` with empty username and password fields, and navigating directly to `/inventory.html` is rejected again (AC-LOGIN-13). Reloading `/inventory.html` while logged in keeps me logged in.
- **AC-LOGIN-15** (US-LOGIN-08) Given the login page, When I log in as `problem_user`, `performance_glitch_user`, `error_user` or `visual_user` with `secret_sauce`, Then I land on `/inventory.html` showing "Products" and 6 items (the login itself succeeds even though catalog defects exist per section 6).
- **AC-LOGIN-16** (US-LOGIN-03) Given the login page, When the locked-out username is used with a wrong password, Then the generic "do not match" error is shown (not the locked-out message).
- **AC-LOGIN-17** (US-LOGIN-03) Given the login page, When I submit injection-like input (e.g. `' OR 1=1 --`), Then login is rejected with the "do not match" error and no crash occurs.

## 4. Business rules & UI contract

**URLs**
- Login page: `https://www.saucedemo.com/` (title "Swag Labs", logo text "Swag Labs").
- Landing page after successful login: `https://www.saucedemo.com/inventory.html` (header `data-test="title"` = "Products").
- Failed login never changes the URL.

**data-test IDs**
| Element | data-test | Notes |
|---|---|---|
| Username input | `username` | id `user-name`, type text, placeholder "Username", aria-label "Username", no autocomplete attr |
| Password input | `password` | id `password`, type `password`, placeholder "Password", aria-label "Password" |
| Login button | `login-button` | input submit, value "Login" |
| Error message | `error` | `<h3 role="alert">` inside `.error-message-container`; only present after a failed attempt |
| Error dismiss (X) button | `error-button` | aria-label "Dismiss error", inside the error h3 |
| Inventory title | `title` | "Products" |
| Inventory item | `inventory-item` | 6 items |
| Logout link | `logout-sidebar-link` | in burger menu (button `#react-burger-menu-btn`) |

**Exact error messages (prefix "Epic sadface: " always included)**
| Condition | Text |
|---|---|
| Username empty (also both empty) | Epic sadface: Username is required |
| Password empty (username filled) | Epic sadface: Password is required |
| Wrong password, unknown user, case/whitespace mismatch, locked user with wrong password | Epic sadface: Username and password do not match any user in this service |
| `locked_out_user` with correct password | Epic sadface: Sorry, this user has been locked out. |
| Unauthenticated access to /inventory.html | Epic sadface: You can only access '/inventory.html' when you are logged in. |

Note: the `error` element's text content is the message only (the X button has no text).

**Validation order:** username required, then password required, then credential match, then locked-out check.

**Field behaviors**
- Credentials are case-sensitive and not trimmed.
- Password is masked.
- Enter key in a field submits the form.
- On a failed attempt, the entered values stay in the fields (observed: not cleared by an error; not specified as a requirement beyond the error being shown).
- On error, both inputs receive classes `input_error form_input error` (red bottom border rgb(226, 35, 26)) and a red `circle-xmark` SVG icon appears in each input group (3 SVGs total including the X button).
- Dismiss: clicking `error-button` removes the error container, removes the red icons and the red border (class becomes `input_error form_input`, border color becomes rgb(237, 237, 237)). The residual `input_error` class is a non-visual implementation detail; do not assert on it.
- Error appears immediately for validation failures (client-side, no loading time).
- Logout returns to `/` with empty fields.

## 5. Edge cases & negative paths

- Empty username, empty password, both empty (AC-LOGIN-05..07).
- Unknown user vs wrong password produce identical messages (AC-LOGIN-04).
- Case-sensitivity: `STANDARD_USER`, `SECRET_SAUCE` rejected. Leading/trailing whitespace in username or password rejected (AC-LOGIN-12).
- Injection-like input `' OR 1=1 --` rejected with generic error (AC-LOGIN-17).
- Locked user with a wrong password shows the generic error, not "locked out" (AC-LOGIN-16).
- Re-submitting after dismissing an error and then succeeding (AC-LOGIN-08).
- Second failed attempt replaces the error message (no stacking): to be verified by tests with a single `error` element.
- Direct navigation to `/inventory.html` unauthenticated, and after logout (AC-LOGIN-13/14).
- Browser Back after logout does not return to the inventory page (observed: stays on `/`).
- Whitespace-only username/password: not explored; treated as "do not match" candidate in backlog (unverified).
- Very long input and non-ASCII input: not explored.

## 6. Known deviations per user

Intended behavior: every valid user logs in quickly and sees the same correct catalog.

- **standard_user**: no deviations. Login ~50-100 ms to inventory; images are product-specific (e.g. `sauce-backpack-...jpg`).
- **locked_out_user**: login intentionally rejected (this is intended behavior, AC-LOGIN-02), not a defect.
- **problem_user**: logs in, but all product images in the catalog are the same placeholder `sl-404-...jpg` (observed on the first items). Defect: product images wrong. Other defects (cart, sorting, checkout) are out of scope here.
- **performance_glitch_user**: login succeeds but takes roughly 5 seconds (observed ~5.1 s from click until the first inventory item is visible, versus ~0.1 s for standard_user). URL change to `/inventory.html` occurred quickly; the delay is in content rendering. Defect: slow login. Tests must use a generous timeout (e.g. 15 s) and not assert a speed SLA as acceptance.
- **error_user**: login succeeds with correct catalog images. Defects appear later on (e.g. cart/checkout actions) and are not covered here.
- **visual_user**: login succeeds; the first product (Backpack) shows the `sl-404` placeholder image while the others are correct. Layout/visual defects are expected on the catalog; out of scope here.

Surprising: validation errors are instant, so no slowness for failed logins; the 8 s figures during exploration were only polling timeouts.

## 7. Test candidate summary

**Design decision: grouped verification tests.** The area has a budget of 6 tests, so checks with the same shape are grouped into one data-driven test instead of one test each. Each case still runs and is reported in isolation:

- **Isolation:** each case is its own `test.step` and starts from a fresh login page (`goto('/')`). No state from the previous case carries over.
- **Continue on failure:** every check inside a case uses a soft assertion (`expect.soft`). If an action inside a case throws (for example, a locator timeout), the error is caught and recorded against that case. Either way, the test moves on to the next case.
- **Verdict:** the test **fails** at the end if at least one check in any case failed, and **passes** only if every check in every case passed. The HTML report lists each case as a separate step, with its own pass/fail result and failure message.

| TC ID | AC ref | Title | Priority | Tags | Selected |
|---|---|---|---|---|---|
| TC-LOGIN-01 | AC-LOGIN-01 | Standard user logs in successfully | P1 | @smoke | yes |
| TC-LOGIN-02 | AC-LOGIN-02..07, 09, 12, 16, 17 | Invalid login attempts display the correct error message (grouped, 13 cases) | P1 | @smoke @regression | yes |
| TC-LOGIN-03 | AC-LOGIN-08 | Error message can be dismissed and the user can then log in | P2 | @regression | yes |
| TC-LOGIN-04 | AC-LOGIN-15 | All other accepted accounts can log in (grouped, 4 users) | P2 | @regression | yes |
| TC-LOGIN-05 | AC-LOGIN-11 | Enter key submits the login form | P2 | @regression | yes |
| TC-LOGIN-06 | AC-LOGIN-10 | Login form initial state: fields, placeholders, masked password, no error | P3 | @regression | yes |
| TC-LOGIN-07 | — | A second failed attempt replaces the error message (no stacking) | P3 | @regression | no |
| TC-LOGIN-08 | AC-LOGIN-13 | Unauthenticated access to inventory is blocked | P1 | @regression | no (owned by NAV: TC-NAV-02) |
| TC-LOGIN-09 | AC-LOGIN-14 | Logout returns to login with empty fields | P2 | @regression | no (owned by NAV: TC-NAV-01) |
| TC-LOGIN-10 | — | Whitespace-only, very long and non-ASCII credentials are rejected | P3 | @regression | no |


## Test Scenarios

### 1. Login — Selected

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC-LOGIN-01 Standard user logs in successfully

**File:** `tests/login/standard-user-login.spec.ts`

**Steps:**
  1. Open the login page (https://www.saucedemo.com/) in a fresh context.
    - expect: The fields with data-test `username` and `password` and the button `login-button` are visible.
  2. Fill getByTestId('username') with `standard_user` and getByTestId('password') with `secret_sauce`.
  3. Click getByTestId('login-button').
    - expect: URL is https://www.saucedemo.com/inventory.html.
    - expect: getByTestId('title') has text `Products`.
    - expect: getByTestId('inventory-item') count is 6.
    - expect: getByTestId('error') is not present.

#### 1.2. TC-LOGIN-02 Invalid login attempts display the correct error message

**File:** `tests/login/invalid-login-errors.spec.ts`

**Type:** grouped verification test (see section 7). Every row below is one isolated `test.step` that uses soft assertions. The test fails if any row fails.

| # | Case | Username | Password | Expected error text (getByTestId('error')) | AC |
|---|------|----------|----------|-------------------------------------------|----|
| 1 | Locked-out user | `locked_out_user` | `secret_sauce` | `Epic sadface: Sorry, this user has been locked out.` | AC-LOGIN-02 |
| 2 | Wrong password | `standard_user` | `wrong_password` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-03 |
| 3 | Unknown user | `unknown_user` | `secret_sauce` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-04 |
| 4 | Empty username | *(empty)* | `secret_sauce` | `Epic sadface: Username is required` | AC-LOGIN-05 |
| 5 | Empty password | `standard_user` | *(empty)* | `Epic sadface: Password is required` | AC-LOGIN-06 |
| 6 | Both fields empty | *(empty)* | *(empty)* | `Epic sadface: Username is required` | AC-LOGIN-07 |
| 7 | Username wrong case | `STANDARD_USER` | `secret_sauce` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-12 |
| 8 | Password wrong case | `standard_user` | `SECRET_SAUCE` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-12 |
| 9 | Username leading space | ` standard_user` | `secret_sauce` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-12 |
| 10 | Username trailing space | `standard_user ` | `secret_sauce` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-12 |
| 11 | Password trailing space | `standard_user` | `secret_sauce ` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-12 |
| 12 | Locked-out user + wrong password | `locked_out_user` | `wrong_password` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-16 |
| 13 | Injection-like input | `' OR 1=1 --` | `x` | `Epic sadface: Username and password do not match any user in this service` | AC-LOGIN-17 |

**Steps (repeated for every row, each in its own `test.step` named "#<n> <case>"):**
  1. Navigate to the login page (`/`) so the case starts from a fresh state.
    - expect: getByTestId('error') is not present.
  2. Fill getByTestId('username') and getByTestId('password') with the row's values (leave the field untouched when the row says empty), then click getByTestId('login-button').
    - expect (soft): getByTestId('error') is visible with the row's exact text.
    - expect (soft): URL is still https://www.saucedemo.com/ (no navigation happened).
    - expect (soft): getByTestId('error-button') (the dismiss X) is visible.
    - expect (soft): both inputs show the red error state (class contains `error`, with a red circle-xmark icon in each input group). This covers AC-LOGIN-09.
  3. Whatever the outcome of steps 1–2, the test continues with the next row.

**Final verdict:** the test passes only if all 13 rows passed every check. Otherwise it fails, and the report lists every failed row with its message.

#### 1.3. TC-LOGIN-03 Error message can be dismissed and the user can then log in

**File:** `tests/login/dismiss-error.spec.ts`

**Steps:**
  1. Open the login page and click login-button with both fields empty.
    - expect: getByTestId('error') has text `Epic sadface: Username is required`.
    - expect: getByTestId('error-button') is visible.
  2. Click getByTestId('error-button').
    - expect: getByTestId('error') is not present/visible.
    - expect: The red circle-xmark icons next to the inputs are gone.
  3. Fill username `standard_user` and password `secret_sauce`, then click login-button.
    - expect: URL is https://www.saucedemo.com/inventory.html.
    - expect: getByTestId('title') has text `Products`.

#### 1.4. TC-LOGIN-04 All other accepted accounts can log in

**File:** `tests/login/accepted-accounts-login.spec.ts`

**Type:** grouped verification test (see section 7). One isolated `test.step` per user, using soft assertions.

| # | Username | Note |
|---|----------|------|
| 1 | `problem_user` | Catalog defects exist (section 6). Do not assert images. |
| 2 | `performance_glitch_user` | Content renders after about 5 s. Use a 15 s timeout for this case's assertions; there is no speed SLA. |
| 3 | `error_user` | — |
| 4 | `visual_user` | Visual defects exist. Do not assert images or prices. |

**Steps (per row, each in a fresh browser context or after clearing cookies and localStorage):**
  1. Open the login page, fill the row's username with `secret_sauce`, and click login-button.
    - expect (soft): URL is https://www.saucedemo.com/inventory.html.
    - expect (soft): getByTestId('title') has text `Products`.
    - expect (soft): getByTestId('inventory-item') count is 6.
    - expect (soft): getByTestId('error') is not present.

**Final verdict:** passes only if all 4 users logged in successfully.

#### 1.5. TC-LOGIN-05 Enter key submits the login form

**File:** `tests/login/enter-key-submit.spec.ts`

**Steps:**
  1. Open the login page and fill `standard_user` / `secret_sauce`.
  2. Press Enter in the password field (do not click login-button).
    - expect: URL is https://www.saucedemo.com/inventory.html.
    - expect: getByTestId('title') has text `Products`.

#### 1.6. TC-LOGIN-06 Login form initial state

**File:** `tests/login/login-form-initial-state.spec.ts`

**Steps:**
  1. Open the login page.
    - expect (soft): getByTestId('username') is visible, empty, with placeholder `Username`.
    - expect (soft): getByTestId('password') is visible, empty, with placeholder `Password` and attribute `type="password"`.
    - expect (soft): getByTestId('login-button') is visible with value `Login`.
    - expect (soft): getByTestId('error') is not present.
  2. Type `secret_sauce` into the password field.
    - expect: The password input keeps `type="password"` (characters masked), and its value is `secret_sauce`.

### 2. Login — Backlog

**Seed:** `tests/seed.spec.ts`

#### 2.1. TC-LOGIN-07 A second failed attempt replaces the error message

**File:** `tests/login/error-replaced.spec.ts`

**Steps:**
  1. Open the login page and click login-button with both fields empty.
    - expect: The error text is `Epic sadface: Username is required`.
  2. Fill username `standard_user` and click login-button (password still empty).
    - expect: Exactly one getByTestId('error') element exists, with text `Epic sadface: Password is required`.

#### 2.2. TC-LOGIN-08 Unauthenticated access to inventory is blocked (owned by NAV: TC-NAV-02)

**File:** n/a (covered by `tests/navigation/protected-urls-blocked.spec.ts`)

**Steps:**
  1. In a fresh context, navigate directly to /inventory.html.
    - expect: The final URL is / and the error text is `Epic sadface: You can only access '/inventory.html' when you are logged in.`.

#### 2.3. TC-LOGIN-09 Logout returns to login with empty fields (owned by NAV: TC-NAV-01)

**File:** n/a (covered by `tests/navigation/logout.spec.ts`)

**Steps:**
  1. Log in as standard_user, click #react-burger-menu-btn, then click getByTestId('logout-sidebar-link').
    - expect: URL is https://www.saucedemo.com/ and the username and password inputs are empty.

#### 2.4. TC-LOGIN-10 Unusual credential input is rejected

**File:** `tests/login/unusual-input.spec.ts`

**Steps:**
  1. Submit, one at a time: a whitespace-only username and password; a 1,000-character username; a non-ASCII username (`משתמש`).
    - expect: Each stays on / and shows `Epic sadface: Username and password do not match any user in this service` (not explored live; verify before automating).
