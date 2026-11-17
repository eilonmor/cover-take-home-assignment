/**
 * Single entry point for specs: `import { test, expect } from '@fixtures/index';`
 * The page-object fixtures will be merged in here with `mergeTests`.
 */
export { test, expect, GUEST_STATE } from './auth.fixture';
export type { AuthWorkerFixtures } from './auth.fixture';
