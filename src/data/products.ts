import { cents, type Cents } from '../utils/money';

/** Stable keys for the 6 catalog products. */
export type ProductKey = 'backpack' | 'bikeLight' | 'boltTShirt' | 'fleeceJacket' | 'onesie' | 'redTShirt';

/** Product id, as used in `/inventory-item.html?id=N`. */
export type ProductId = 0 | 1 | 2 | 3 | 4 | 5;

/** One catalog product, exactly as specified in spec 02 §4. */
export interface Product {
  readonly key: ProductKey;
  /** Id in `/inventory-item.html?id=N` and in `item-N-title-link` / `item-N-img-link`. */
  readonly id: ProductId;
  /** Used in `add-to-cart-<slug>`, `remove-<slug>`, `inventory-item-<slug>-img`, `item-<slug>-img`. */
  readonly slug: string;
  readonly name: string;
  /** Display text, e.g. "$29.99". */
  readonly price: string;
  /** Price in integer cents, e.g. 2999. */
  readonly priceCents: Cents;
  /** Exact description text from spec 02 §4. */
  readonly description: string;
  /** Image file name prefix (the full name has a hash suffix), e.g. "sauce-backpack-1200x1500". */
  readonly imagePrefix: string;
}

/** The full catalog, keyed by product. */
export const PRODUCTS: Readonly<Record<ProductKey, Product>> = {
  backpack: {
    key: 'backpack',
    id: 4,
    slug: 'sauce-labs-backpack',
    name: 'Sauce Labs Backpack',
    price: '$29.99',
    priceCents: cents(2999),
    description:
      'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
    imagePrefix: 'sauce-backpack-1200x1500',
  },
  bikeLight: {
    key: 'bikeLight',
    id: 0,
    slug: 'sauce-labs-bike-light',
    name: 'Sauce Labs Bike Light',
    price: '$9.99',
    priceCents: cents(999),
    description:
      "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
    imagePrefix: 'bike-light-1200x1500',
  },
  boltTShirt: {
    key: 'boltTShirt',
    id: 1,
    slug: 'sauce-labs-bolt-t-shirt',
    name: 'Sauce Labs Bolt T-Shirt',
    price: '$15.99',
    priceCents: cents(1599),
    description:
      'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
    imagePrefix: 'bolt-shirt-1200x1500',
  },
  fleeceJacket: {
    key: 'fleeceJacket',
    id: 5,
    slug: 'sauce-labs-fleece-jacket',
    name: 'Sauce Labs Fleece Jacket',
    price: '$49.99',
    priceCents: cents(4999),
    description:
      "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.",
    imagePrefix: 'sauce-pullover-1200x1500',
  },
  onesie: {
    key: 'onesie',
    id: 2,
    slug: 'sauce-labs-onesie',
    name: 'Sauce Labs Onesie',
    price: '$7.99',
    priceCents: cents(799),
    description:
      "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.",
    imagePrefix: 'red-onesie-1200x1500',
  },
  redTShirt: {
    key: 'redTShirt',
    id: 3,
    // Contains dots and parentheses: always pass it to getByTestId as an exact string, never build CSS from it.
    slug: 'test.allthethings()-t-shirt-(red)',
    name: 'Test.allTheThings() T-Shirt (Red)',
    price: '$15.99',
    priceCents: cents(1599),
    description:
      'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
    imagePrefix: 'red-tatt-1200x1500',
  },
};

/** Default list order, Name (A to Z). Ids do NOT follow this order: 4, 0, 1, 5, 2, 3. */
export const CATALOG_AZ: readonly ProductKey[] = [
  'backpack',
  'bikeLight',
  'boltTShirt',
  'fleeceJacket',
  'onesie',
  'redTShirt',
];

/** Matches the "not found" placeholder image (`sl-404-*.jpg`) that a valid product must never show. */
export const PLACEHOLDER_IMAGE = /sl-404/;
