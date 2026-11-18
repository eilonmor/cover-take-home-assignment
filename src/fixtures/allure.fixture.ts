import { test as base } from '@playwright/test';
import * as allure from 'allure-js-commons';

/** The project's own annotation types (see docs/ROADMAP.md, "Test shape" and "Known site bugs"). */
const COVERS = 'covers';
const KNOWN_ISSUE = 'known-issue';
const GROUPED = 'grouped';

interface AllureFixtures {
  /** Auto fixture: maps the test's annotations to Allure labels. Specs never use it directly. */
  allureMetadata: void;
}

/**
 * Translates the project's Playwright annotations into Allure labels, so the Allure report can be
 * filtered and grouped by them. allure-playwright reads only the annotations declared up front, and
 * shows unknown types as plain steps. The mapping therefore runs after the test body, when the
 * annotations pushed at runtime (`known-issue`, `grouped`) are also known:
 * - `covers: AC-X, AC-Y` → feature = the describe title (the area), one story per AC (Behaviors tab).
 * - `known-issue: <text>` → tag `known-issue`, plus a `known-issue` label holding the text.
 * - `grouped: N cases, …` → a `grouped` label holding the case summary.
 * All labels are sent in one call: allure-playwright carries them as one "Allure Metadata" attachment,
 * which is also the only trace of this fixture in the Playwright HTML report.
 */
export const test = base.extend<AllureFixtures>({
  allureMetadata: [
    // Playwright requires the first argument to be a destructuring pattern, even when empty.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      await use();

      const labels: { name: string; value: string }[] = [];
      // titlePath is [file, ...describes, test title]: the innermost describe is the area.
      if (testInfo.titlePath.length > 2) {
        labels.push({ name: 'feature', value: testInfo.titlePath[testInfo.titlePath.length - 2] });
      }
      for (const { type, description = '' } of testInfo.annotations) {
        if (type === COVERS) {
          for (const criterion of description.split(',').map((ac) => ac.trim()).filter(Boolean)) {
            labels.push({ name: 'story', value: criterion });
          }
        } else if (type === KNOWN_ISSUE) {
          labels.push({ name: 'tag', value: KNOWN_ISSUE }, { name: KNOWN_ISSUE, value: description });
        } else if (type === GROUPED) {
          labels.push({ name: GROUPED, value: description });
        }
      }
      if (labels.length > 0) {
        await allure.labels(...labels);
      }
    },
    { auto: true },
  ],
});
