# QA Automation Engineer – Home Assignment

> A home assignment from the Cover.co.il R&D team. It tests your ability to automate tests with **Playwright + TypeScript**.

| Technology | Time to submit | Difficulty |
|------------|----------------|------------|
| Playwright | 2 days | Intermediate to advanced |

---

## 01 · Overview

This assignment tests your skills in test automation with **Playwright**. You will build an end-to-end (E2E) automation project. It includes the tests, documentation, a test-run report, and a clean project structure that follows industry best practices.

We want a candidate who knows how to write tests. We also want them to know how to build a test framework that is correct, modular, and easy to maintain.

---

## 02 · Target Site

Run all tests against this e-commerce demo site. It has a login screen, a product catalog, a shopping cart, a checkout flow, and built-in error scenarios:

**URL:** https://www.saucedemo.com

| Field | Value | Note |
|-------|-------|------|
| Username | `standard_user` | Regular user |
| Username | `locked_out_user` | Locked-out user |
| Username | `problem_user` | User with bugs |
| Username | `performance_glitch_user` | Slow user |
| Password | `secret_sauce` | Same for all users |

---

## 03 · Required Test Scenarios

Write automated tests for each of the areas below. **You choose the relevant test cases yourself.**

| Area | Scope | Max tests |
|------|-------|-----------|
| 🔐 **Login** | The different login scenarios on the site | up to 6 |
| 🛍️ **Products** | Product display, sorting, and product details | up to 6 |
| 🛒 **Cart** | Shopping cart functionality | up to 6 |
| 💳 **Checkout** | The checkout flow from start to finish | up to 6 |
| 🧭 **Logout & Navigation** | Site navigation, logout, and access to protected pages | up to 6 |

---

## 04 · Technical Requirements (all mandatory)

| Requirement | Details |
|-------------|---------|
| **Page Object Model (POM)** | Each page on the site is its own class with locators and methods |
| **TypeScript** | The project must be written in TypeScript with full type safety |
| **Environment Variables** | Use a `.env` file for login details and the site URL. **A `.env.example` file is required** |
| **Custom Fixtures** | Use Playwright fixtures to inject page objects into the tests |
| **Assertions** | Use Playwright's built-in assertions, with **soft assertions** where they fit |
| **Parallel Execution** | Tests must support parallel runs (no dependencies between tests) |
| **Reporting** | Set up the built-in HTML reporter. Optional: Allure Report |
| **Screenshots & Videos** | Screenshot on failure, and video kept only for failed tests (`retain-on-failure`) |
| **Retry Logic** | Set `retries: 1` in the config |

---

## 05 · Required Documentation

### README.md
- Project description and the site under test
- Prerequisites (Node.js, npm)
- Step-by-step install instructions (clone, install, env setup)
- How to run (all tests, a single test, headless/headed)
- How to view the report
- Project structure, with an explanation of each folder
- Technologies used

### TEST_PLAN.md
- Overview of the site under test and the test scope
- A detailed test-case table: **Test ID, description, steps, expected result, priority**
- Scenarios covered, and scenarios left out (Out of Scope)
- Test risks and a summary

---

## 06 · Deliverables

1. **Git repository:** a link to a public GitHub repository, or an invite to view it
2. **Working tests:** every test passes in a full run
3. **Test-run report:** the built-in Playwright HTML report after a run
4. **Documentation:** `README.md` and `TEST_PLAN.md` as described above
5. **Run instructions:** the project runs in three steps: `clone → install → test`

---

## 07 · Evaluation Criteria

| Criterion | Details | Weight |
|-----------|---------|--------|
| **Test quality** | Quality of locators, correct use of assertions, edge-case coverage | 25% |
| **Project structure** | POM, modularity, use of fixtures, code readability | 25% |
| **TypeScript** | Use of interfaces, data typing, type safety | 15% |
| **Documentation** | Complete README, detailed TEST_PLAN, documented code | 15% |
| **Reporting & Config** | Reporter setup, screenshots, videos, retries | 10% |
| **Bonus** | Allure integration, custom matchers, visual regression | 10% |

---

## 08 · Bonus Tasks (optional)

Doing these tasks gives a candidate an advantage:

- ⭐ A GitHub Actions workflow that runs the tests in CI
- ⭐ Allure Report integration (with install instructions)
- ⭐ Visual regression testing
- ⭐ API testing in addition to UI tests
- ⭐ Custom Playwright matchers
- ⭐ Tags/annotations (`@smoke`, `@regression`)

---

## ⚠️ Important Notes

- Make sure the project runs without errors after a fresh clone of the repository.
- Do not commit the `.env` file to Git. Make sure `.env.example` exists with the required values.
- Make sure `.gitignore` includes: `node_modules`, `test-results`, `playwright-report`, `.env`.
- Make tidy commits with clear messages (Conventional Commits).
- You may email technical questions only.
