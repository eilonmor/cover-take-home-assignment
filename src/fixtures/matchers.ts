import { expect as baseExpect, type ExpectMatcherState, type MatcherReturnType } from '@playwright/test';
import { PRODUCTS, type ProductKey } from '../data/products';
import type { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import type { Header } from '../pages/components/Header';
import type { ItemList } from '../pages/components/ItemList';
import { summaryLabels, type OrderSummary } from '../utils/money';

/** Options accepted by every custom matcher. */
export interface MatcherOptions {
  /** Retry budget; defaults to the configured `expect` timeout. */
  readonly timeout?: number;
}

/**
 * Runs a check built from auto-retrying web-first assertions and turns its outcome into a matcher result.
 * `.not` is rejected because "not all of these" is ambiguous for a composite check.
 */
async function delegate(
  state: ExpectMatcherState,
  name: string,
  expected: string,
  options: MatcherOptions | undefined,
  check: (timeout: number) => Promise<void>,
): Promise<MatcherReturnType> {
  if (state.isNot) {
    throw new Error(`${name} does not support .not; assert the expected state directly instead.`);
  }
  const timeout = options?.timeout ?? state.timeout;
  const hint = state.utils.matcherHint(name, undefined, undefined, { isNot: false, promise: state.promise });
  try {
    await check(timeout);
    return { name, pass: true, expected, message: () => `${hint}\n\nExpected: ${expected}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      name,
      pass: false,
      expected,
      timeout,
      message: () => `${hint}\n\nExpected: ${expected}\n\n${reason}`,
    };
  }
}

/** The extended `expect`, with the custom matchers. Re-exported from `@fixtures/index`. */
export const expect = baseExpect.extend({
  /** The badge shows `count`; 0 means the badge is absent (the site never shows "0"). */
  async toHaveCartBadge(this: ExpectMatcherState, header: Header, count: number, options?: MatcherOptions) {
    const expected = count === 0 ? 'no cart badge (empty cart)' : `cart badge "${count}"`;
    return delegate(this, 'toHaveCartBadge', expected, options, async (timeout) => {
      if (count === 0) {
        await baseExpect(header.cartBadge).toHaveCount(0, { timeout });
      } else {
        await baseExpect(header.cartBadge).toHaveText(String(count), { timeout });
      }
    });
  },

  /** The list shows exactly these products: same count, names and prices in this exact order. */
  async toShowProducts(
    this: ExpectMatcherState,
    list: ItemList,
    keys: readonly ProductKey[],
    options?: MatcherOptions,
  ) {
    const names = keys.map((key) => PRODUCTS[key].name);
    const prices = keys.map((key) => PRODUCTS[key].price);
    const expected = `${keys.length} products in order: ${names.map((n, i) => `${n} (${prices[i]})`).join(', ')}`;
    return delegate(this, 'toShowProducts', expected, options, async (timeout) => {
      await baseExpect(list.items, 'product count').toHaveCount(keys.length, { timeout });
      await baseExpect(list.names, 'product names, in order').toHaveText(names, { timeout });
      await baseExpect(list.prices, 'product prices, in order').toHaveText(prices, { timeout });
    });
  },

  /** The overview's 3 summary labels equal `summaryLabels(summary)` exactly. */
  async toHaveOrderSummary(
    this: ExpectMatcherState,
    page: CheckoutOverviewPage,
    summary: OrderSummary,
    options?: MatcherOptions,
  ) {
    const labels = summaryLabels(summary);
    const expected = `"${labels.subtotal}", "${labels.tax}", "${labels.total}"`;
    return delegate(this, 'toHaveOrderSummary', expected, options, async (timeout) => {
      await baseExpect(page.subtotalLabel, 'item total label').toHaveText(labels.subtotal, { timeout });
      await baseExpect(page.taxLabel, 'tax label').toHaveText(labels.tax, { timeout });
      await baseExpect(page.totalLabel, 'total label').toHaveText(labels.total, { timeout });
    });
  },
});
