import type { ProductKey } from './products';

/** The `value` attribute of each option in `product-sort-container`. */
export type SortValue = 'az' | 'za' | 'lohi' | 'hilo';

/** One sort option, with the product order it must produce (spec 02 §4). */
export interface SortOption {
  readonly value: SortValue;
  readonly label: string;
  readonly expectedOrder: readonly ProductKey[];
}

/**
 * The sort options, in dropdown order.
 * The two $15.99 items tie in both price sorts; the observed (stable) order is Bolt before Red.
 */
export const SORT_OPTIONS: readonly SortOption[] = [
  {
    value: 'az',
    label: 'Name (A to Z)',
    expectedOrder: ['backpack', 'bikeLight', 'boltTShirt', 'fleeceJacket', 'onesie', 'redTShirt'],
  },
  {
    value: 'za',
    label: 'Name (Z to A)',
    expectedOrder: ['redTShirt', 'onesie', 'fleeceJacket', 'boltTShirt', 'bikeLight', 'backpack'],
  },
  {
    value: 'lohi',
    label: 'Price (low to high)',
    expectedOrder: ['onesie', 'bikeLight', 'boltTShirt', 'redTShirt', 'backpack', 'fleeceJacket'],
  },
  {
    value: 'hilo',
    label: 'Price (high to low)',
    expectedOrder: ['fleeceJacket', 'backpack', 'boltTShirt', 'redTShirt', 'bikeLight', 'onesie'],
  },
];

/** The option selected when the inventory first loads. */
export const DEFAULT_SORT: SortValue = 'az';

/** The sort option with this value. Throws if SORT_OPTIONS has no such option (a data error). */
export function sortOption(value: SortValue): SortOption {
  const option = SORT_OPTIONS.find((candidate) => candidate.value === value);
  if (option === undefined) {
    throw new Error(`Sort value "${value}" is not one of SORT_OPTIONS.`);
  }
  return option;
}
