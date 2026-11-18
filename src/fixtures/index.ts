import { mergeTests } from '@playwright/test';
import { test as allureTest } from './allure.fixture';
import { test as authTest } from './auth.fixture';
import { test as pagesTest } from './pages.fixture';

/**
 * Single entry point for specs: `import { test, expect, GUEST_STATE } from '@fixtures/index';`
 * `test` carries the worker auth (default: logged in as standard), every page-object fixture,
 * and the automatic mapping of annotations to Allure metadata.
 */
export const test = mergeTests(authTest, pagesTest, allureTest);
// The extended expect (use mergeExpects here if another extension is ever added).
export { expect } from './matchers';
export { GUEST_STATE } from './auth.fixture';
export type { AuthWorkerFixtures } from './auth.fixture';
export type { PageFixtures } from './pages.fixture';
