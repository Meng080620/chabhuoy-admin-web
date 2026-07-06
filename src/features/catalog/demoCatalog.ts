import type { Product } from '@/types/api'
import { demoImage } from './demo'

/**
 * Curated demo catalogue for the storefront landing page. These are NOT real
 * API records — the homepage is a "demo mock visuals" build, so it renders from
 * this fixed set to always look complete (the live `/products` search still hits
 * the real backend). Shaped as real `Product`s so the same card/decoration code
 * works unchanged. Imagery + ratings are derived deterministically from `id`.
 */

let seq = 0
function p(
  name: string,
  price: number,
  category: string,
  opts: { stock?: number; sale?: number } = {},
): DemoProduct {
  seq += 1
  const id = `demo-${seq}`
  return {
    id,
    name,
    slug: id,
    description: null,
    price: price.toFixed(2),
    stock: opts.stock ?? 25,
    in_stock: (opts.stock ?? 25) > 0,
    is_active: true,
    // Demo items get an explicit seeded photo — real API products never do;
    // their imagery comes only from the admin-uploaded `image_url`.
    image_url: demoImage(id, 400),
    category: { id: seq, name: category },
    created_at: '2026-06-01T00:00:00Z',
    /** Demo "was" price for a strikethrough — present only on sale items. */
    compareAt: opts.sale ? opts.sale.toFixed(2) : null,
  }
}

/** Real Product plus a demo-only `compareAt` original price. */
export interface DemoProduct extends Product {
  compareAt: string | null
}

export interface DemoSection {
  id: string
  title: string
  products: DemoProduct[]
}

export const DEMO_SECTIONS: readonly DemoSection[] = [
  {
    id: 'best-deals',
    title: "Today's Best Deals For You!",
    products: [
      p('Samsung Galaxy S24 Ultra 12+GB Titanium Gray', 999.99, 'Electronics'),
      p("Nike Jordan Brooklyn Fleece Men's Pullover Hoodie", 45.0, 'Fashion', { sale: 90 }),
      p('Beanless Bag Inflatable Lounge Chair Grey', 32.0, 'Home Decor'),
      p('Diamond Stud Earrings 1/3 ct. in 14K White Gold', 299.0, 'Luxury'),
      p('Nike Invincible 3 Premium', 190.0, 'Sneakers'),
    ],
  },
  {
    id: 'grocery',
    title: 'Bestseller In Grocery',
    products: [
      p('Lays Chips (Bacon)', 24.0, 'Groceries'),
      p('Pumpkin Enzyme Mask', 0.75, 'Groceries', { stock: 0 }),
      p('Alokozay Breeze Drink Caffeine Free 6 × 250ML', 4.36, 'Groceries', { sale: 6 }),
      p('Fairy Max Plus Original Dishwash Liquid 600ML', 3.54, 'Groceries'),
      p('Mars Minis Chocolate 180G 10X', 6.26, 'Groceries'),
    ],
  },
  {
    id: 'electronics',
    title: 'Top Deals In Electronics',
    products: [
      p('Samsung Smart TV Crystal UHD DU7000', 409.75, 'Electronics', { sale: 680.37 }),
      p('Apple iPhone 16 Pro Max 256GB', 1747.06, 'Electronics'),
      p('HUAWEI FreeClip Ground-breaking Design', 135.58, 'Electronics', { sale: 190.31 }),
      p('Apple MacBook Air A1466 13" i5', 500.0, 'Electronics'),
      p('SanDisk 2TB Extreme Portable SSD', 132.05, 'Electronics', { sale: 138.85 }),
    ],
  },
  {
    id: 'winter',
    title: '60% Off Or More On Winter-Wear',
    products: [
      p('Pumpkin Enzyme Mask Set', 50.0, 'Health & Beauty'),
      p('Cloud Zip Hoodie', 65.0, 'Fashion', { sale: 130 }),
      p('Deerskin Premium Leather Winter Gloves 3M Thinsulate', 41.99, 'Fashion', { sale: 59.99 }),
      p('Hayward 3 Season Float Jacket', 230.0, 'Fashion'),
      p('Wardrobe Essentials Knit', 90.0, 'Fashion'),
    ],
  },
  {
    id: 'beauty',
    title: 'Best Sellers In Beauty & Health',
    products: [
      p('ANUA Heartleaf Pore Control Cleansing Oil', 32.0, 'Health & Beauty'),
      p('Himalaya Purehands Hand Sanitizer 2+1 Free', 6.26, 'Health & Beauty'),
      p('A&D Medical Upper Arm Blood Pressure Monitor', 40.02, 'Health & Beauty'),
      p('Yardley London Gentleman Legacy Luxury', 10.35, 'Health & Beauty', { sale: 18 }),
      p('Dual Set Liquid Foundation & Compact Powder', 24.0, 'Health & Beauty'),
    ],
  },
  {
    id: 'appliances',
    title: 'Bestsellers In Home Appliances',
    products: [
      p('evvoli Air Fryer 3.8 Liters with Timer', 21.51, 'Home Decor', { sale: 54.18 }),
      p('Heifgott Orange Ceramic Vase Set-3', 3.0, 'Home Decor'),
      p('ELECDON Couple Figurines Gold Statue', 32.0, 'Home Decor'),
      p('Blendtec 1560W Blender Heavy Duty', 414.37, 'Home Decor'),
      p('8.0 kg Fully Automatic Front Load Washing Machine', 30.0, 'Home Decor'),
    ],
  },
  {
    id: 'fashion',
    title: 'Style & Fashion',
    products: [
      p("Adidas Women's Tiro23 League Soccer Shorts", 8.0, 'Fashion'),
      p('Open Story Weekender Bag Lightweight Duffel', 21.99, 'Fashion'),
      p("Men's Genuine Buffalo Leather Belt Full Grain", 30.09, 'Fashion'),
      p('Burberry Check Cotton Shirt – Archive Beige', 626.0, 'Luxury'),
      p('Nike Sportswear Club Fleece Pullover Hoodie', 43.98, 'Fashion'),
    ],
  },
] as const

/** Fallback circular category tiles when the live tree is unavailable. */
export const CIRCLE_CATEGORIES: readonly { id: string; label: string; seed: string }[] = [
  { id: 'c-elec', label: 'Electronics', seed: 'cat-electronics' },
  { id: 'c-fashion', label: 'Fashion', seed: 'cat-fashion' },
  { id: 'c-luxury', label: 'Luxury', seed: 'cat-luxury' },
  { id: 'c-home', label: 'Home Decor', seed: 'cat-home' },
  { id: 'c-beauty', label: 'Health & Beauty', seed: 'cat-beauty' },
  { id: 'c-grocery', label: 'Groceries', seed: 'cat-grocery' },
  { id: 'c-sneakers', label: 'Sneakers', seed: 'cat-sneakers' },
] as const

/** Official brand store tiles — text "logos", no real brand assets. */
export const BRAND_STORES: readonly { name: string; caption: string }[] = [
  { name: 'Adidas', caption: 'Delivery within 24 hours' },
  { name: 'Nestlé', caption: 'Delivery within 24 hours' },
  { name: 'P&G', caption: 'Delivery within 24 hours' },
  { name: 'LG Electronics', caption: 'Delivery within 24 hours' },
  { name: 'Dell', caption: 'Delivery within 24 hours' },
  { name: 'Apple', caption: 'Delivery within 24 hours' },
  { name: 'Chanel', caption: 'Delivery within 24 hours' },
  { name: 'Zara Fashion', caption: 'Delivery within 24 hours' },
] as const
