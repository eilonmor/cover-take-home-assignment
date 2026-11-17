import type { ProductKey } from './products';

/** The values typed on checkout step one. */
export interface CheckoutInfo {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

/** Default customer for every checkout. */
export const CUSTOMER: CheckoutInfo = { firstName: 'Jane', lastName: 'Doe', postalCode: '12345' };

/** One cart of TC-CHK-03 with the summary labels observed live (spec 04 §4). */
export interface CheckoutCartCase {
  readonly name: string;
  /** Items in add order. */
  readonly items: readonly ProductKey[];
  /** Observed display amounts, e.g. "$39.98". */
  readonly expected: { readonly itemTotal: string; readonly tax: string; readonly total: string };
}

const cart = (
  items: readonly ProductKey[],
  itemTotal: string,
  tax: string,
  total: string,
  name: string = items.join(' + '),
): CheckoutCartCase => ({ name, items, expected: { itemTotal, tax, total } });

/** The 10 carts of TC-CHK-03, in spec order. */
export const CHECKOUT_CARTS: readonly CheckoutCartCase[] = [
  cart(['onesie'], '$7.99', '$0.64', '$8.63'),
  cart(['bikeLight'], '$9.99', '$0.80', '$10.79'),
  cart(['boltTShirt'], '$15.99', '$1.28', '$17.27'),
  cart(['fleeceJacket'], '$49.99', '$4.00', '$53.99'),
  cart(['backpack'], '$29.99', '$2.40', '$32.39'),
  cart(['backpack', 'bikeLight'], '$39.98', '$3.20', '$43.18'),
  cart(['boltTShirt', 'redTShirt'], '$31.98', '$2.56', '$34.54'),
  cart(['bikeLight', 'onesie'], '$17.98', '$1.44', '$19.42'),
  cart(['backpack', 'bikeLight', 'onesie'], '$47.97', '$3.84', '$51.81'),
  cart(
    ['backpack', 'bikeLight', 'boltTShirt', 'fleeceJacket', 'onesie', 'redTShirt'],
    '$129.94',
    '$10.40',
    '$140.34',
    'all six items',
  ),
];
