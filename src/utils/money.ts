/**
 * Money helper. All math is done in integer cents, so there is never any floating-point drift.
 * Serves TC-CHK-01/03/04 and the `toHaveOrderSummary` matcher.
 */

import { escapeRegExp } from './regexp';

/** An amount of money in integer cents (branded, so a plain number can't be passed by mistake). */
export type Cents = number & { readonly __brand: 'Cents' };

/** Brands a number as cents. Throws unless it is a safe, non-negative integer. */
export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid cents value ${value}: expected a safe non-negative integer.`);
  }
  return value as Cents;
}

/**
 * A plain, non-negative dollar amount with at most 2 decimals. The lookarounds reject anything the
 * site should never show (a minus sign, a thousands separator, a 3rd decimal) instead of misreading it.
 */
const AMOUNT = /(?<!-)\$(\d+)(?:\.(\d{1,2}))?(?![\d.,])/;

/**
 * Parses the first dollar amount in a text into cents, without going through floats.
 * Examples: "$29.99" → 2999, "Item total: $39.98" → 3998, "Total: $0" → 0.
 * Throws if the text contains no valid amount (e.g. "-$5.00", "$1,234.56", "$29.999").
 */
export function parseMoney(text: string): Cents {
  const match = AMOUNT.exec(text);
  if (match === null) {
    throw new Error(`No dollar amount found in "${text}".`);
  }
  const [, dollars, fraction = ''] = match;
  return cents(Number(dollars) * 100 + Number(fraction.padEnd(2, '0')));
}

/** Formats cents as the site displays them, with 2 decimals: 3998 → "$39.98". */
export function formatMoney(value: Cents): string {
  const whole = Math.floor(value / 100);
  const fraction = String(value % 100).padStart(2, '0');
  return `$${whole}.${fraction}`;
}

/** The checkout tax rate, in percent (spec 04 §4). */
export const TAX_RATE_PERCENT = 8;

/** Tax for an item total, rounded half-up to the cent with integer math only. */
export function taxFor(itemTotal: Cents): Cents {
  return cents(Math.floor((itemTotal * TAX_RATE_PERCENT + 50) / 100));
}

/** The three amounts on the checkout overview. */
export interface OrderSummary {
  readonly itemTotal: Cents;
  readonly tax: Cents;
  readonly total: Cents;
}

/** Computes the expected order summary for a list of item prices. */
export function summarize(prices: readonly Cents[]): OrderSummary {
  const itemTotal = cents(prices.reduce<number>((sum, price) => sum + price, 0));
  const tax = taxFor(itemTotal);
  return { itemTotal, tax, total: cents(itemTotal + tax) };
}

/**
 * Matches `label` exactly, or `label` followed only by floating-point noise (5+ zeros, then digits), as in
 * "Item total: $57.980000000000004". For a known rounding defect (spec 04 §5, DEF-CHK-SUBTOTAL): the amount
 * must still be right to the cent, and any other suffix (a 3rd real decimal, "$57.989", text) fails.
 */
export function withFloatNoise(label: string): RegExp {
  return new RegExp(`^${escapeRegExp(label)}(?:0{5,}\\d+)?$`);
}

/** The exact label texts the overview shows for a summary: "Item total: $..", "Tax: $..", "Total: $..". */
export function summaryLabels(s: OrderSummary): { subtotal: string; tax: string; total: string } {
  return {
    subtotal: `Item total: ${formatMoney(s.itemTotal)}`,
    tax: `Tax: ${formatMoney(s.tax)}`,
    total: `Total: ${formatMoney(s.total)}`,
  };
}
