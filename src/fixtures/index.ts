import { mergeTests } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as pagesTest } from './pages.fixture';

/**
 * Single entry point for specs: `import { test, expect, GUEST_STATE } from '@fixtures/index';`
 * `test` carries the worker auth (default: logged in as standard) and every page-object fixture.
 */
export const test = mergeTests(authTest, pagesTest);
export { expect, GUEST_STATE } from './auth.fixture';
export type { AuthWorkerFixtures } from './auth.fixture';
export type { PageFixtures } from './pages.fixture';
