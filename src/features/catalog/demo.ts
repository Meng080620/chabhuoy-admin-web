/**
 * Demo presentation layer for the storefront homepage.
 *
 * The public API (`/products`, `/categories`) carries no imagery or ratings —
 * the Product/Category resources are data-only. To render the Emox-style
 * landing page we *decorate* real records with deterministic demo visuals:
 * a stable photographic placeholder (picsum, seeded by id) and a stable star
 * rating. Deterministic so a product always looks the same across renders and
 * reloads — never `Math.random()`, which would flicker and break snapshot
 * reasoning. These are demo visuals, not real catalogue data.
 */

/** FNV-ish stable hash → non-negative int. Same seed ⇒ same number, always. */
export function hashString(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Deterministic photographic placeholder. picsum serves a real photo per seed,
 * so two different products never collide and a product is stable forever.
 */
export function demoImage(seed: string, size = 400): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size}/${size}`
}

export interface DemoRating {
  /** 3.5–5.0 in 0.1 steps — flattering but plausible for a storefront. */
  stars: number
  /** Review count, 12–911. */
  count: number
}

/** Stable rating derived from the seed. No real reviews exist behind this. */
export function demoRating(seed: string): DemoRating {
  const h = hashString(seed)
  const stars = 3.5 + ((h % 16) / 10) // 0.0–1.5 added → 3.5–5.0
  const count = 12 + (h % 900)
  return { stars: Math.round(stars * 10) / 10, count }
}

/** Compact review-count label: 1200 → "1.2k", 950 → "950". */
export function formatRatingCount(count: number): string {
  if (count >= 1000) return `${Math.round(count / 100) / 10}k`
  return String(count)
}

// ── Static presentational content (pure demo, no backend) ───────────────────

export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  cta: string
  /** Tailwind gradient classes for the banner background. */
  gradient: string
  seed: string
}

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'ramadan',
    title: 'Seasonal deals, limited time',
    subtitle: 'Up to 50% off across groceries & essentials',
    cta: 'Order now',
    gradient: 'from-emerald-700 to-emerald-500',
    seed: 'chabhuoy-hero-groceries',
  },
  {
    id: 'tech',
    title: 'Upgrade your setup',
    subtitle: 'Laptops, monitors & storage — handpicked',
    cta: 'Shop tech',
    gradient: 'from-brand-700 to-brand-500',
    seed: 'chabhuoy-hero-tech',
  },
] as const

/** Top category nav strip in the header. */
export const NAV_LINKS: readonly string[] = [
  'Electronics',
  'Fashion',
  "Women's",
  "Kids' Fashion",
  'Healthy & Beauty',
  'Pharmacy',
  'Groceries',
  'Luxury Item',
] as const

/** Multi-panel hero: one large lead panel + stacked promo panels. */
export interface HeroPanel {
  id: string
  title: string
  subtitle: string
  cta: string
  gradient: string
  seed: string
  /** Lead panel spans two rows; promo panels are single-height. */
  size: 'lead' | 'tall' | 'promo'
}

export const HERO_PANELS: readonly HeroPanel[] = [
  {
    id: 'iphone',
    title: 'iPhone 16 Pro Max',
    subtitle: 'A18 chip. Superfast. Biggest price drop.',
    cta: 'Shop now',
    gradient: 'from-indigo-700 to-violet-600',
    seed: 'hero-iphone',
    size: 'lead',
  },
  {
    id: 'puma',
    title: 'Up to 50% off',
    subtitle: 'Performance footwear',
    cta: 'Shop now',
    gradient: 'from-sky-500 to-cyan-400',
    seed: 'hero-puma',
    size: 'tall',
  },
  {
    id: 'laundry',
    title: 'Laundry detergents',
    subtitle: 'Special discounts & great offers',
    cta: 'Shop now',
    gradient: 'from-fuchsia-700 to-purple-600',
    seed: 'hero-laundry',
    size: 'promo',
  },
  {
    id: 'bundle',
    title: 'Create your custom bundle',
    subtitle: 'Save 20% + free shipping',
    cta: 'Shop now',
    gradient: 'from-rose-300 to-pink-300',
    seed: 'hero-bundle',
    size: 'promo',
  },
] as const

/** Mid-page promo banner trio. */
export interface PromoCard {
  id: string
  title: string
  caption: string
  cta: string
  gradient: string
  seed: string
}

export const PROMO_TRIO: readonly PromoCard[] = [
  {
    id: 'veg',
    title: 'Fresh & Healthy Vegetables',
    caption: 'Free delivery · save 50%',
    cta: 'Shop now',
    gradient: 'from-pink-600 to-rose-500',
    seed: 'promo-veg',
  },
  {
    id: 's24',
    title: 'Samsung Galaxy S24 FE',
    caption: 'Galaxy AI is here',
    cta: 'Shop now',
    gradient: 'from-sky-300 to-blue-300',
    seed: 'promo-s24',
  },
  {
    id: 'pantry',
    title: 'Stock-up offers',
    caption: 'Before it runs out',
    cta: 'Shop now',
    gradient: 'from-red-600 to-orange-500',
    seed: 'promo-pantry',
  },
] as const

export interface ServiceBadge {
  title: string
  caption: string
}

export const SERVICE_BADGES: readonly ServiceBadge[] = [
  { title: 'Free in-store pickup', caption: '24/7 amazing services' },
  { title: 'Free shipping', caption: 'On qualifying orders' },
  { title: 'Flexible payment', caption: 'Pay your way' },
  { title: 'Convenient help', caption: '24/7 support' },
] as const

export interface FooterColumn {
  heading: string
  links: readonly string[]
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'About Chabhuoy',
    links: ['Company info', 'News', 'Careers', 'Advertise with us', 'Policies'],
  },
  {
    heading: 'Order & Purchases',
    links: ['Check order status', 'Shipping & delivery', 'Returns & exchanges', 'Gift cards'],
  },
  {
    heading: 'Popular categories',
    links: ['Electronics', 'Fashion & style', 'Home & kitchen', 'Health & beauty'],
  },
  {
    heading: 'Support & services',
    links: ['Seller center', 'Contact us', 'Money-back guarantee', 'Help center'],
  },
] as const

/**
 * Eco-promo tiles. Deliberately static labels (the section is editorial, not a
 * 1:1 mirror of the category tree) but each gets a stable seeded image.
 */
export const ECO_TILES: readonly { label: string; seed: string }[] = [
  { label: 'Home & kitchen', seed: 'eco-home' },
  { label: 'Personal care', seed: 'eco-care' },
  { label: 'Tech & gadgets', seed: 'eco-tech' },
  { label: 'Kids products', seed: 'eco-kids' },
  { label: 'Food & groceries', seed: 'eco-food' },
] as const

export interface CategoryTile {
  id: number
  label: string
  seed: string
}

/** Maps the public category tree to homepage tiles, capped to a single row. */
export function categoryTiles(
  categories: { id: number; name: string; slug: string }[] | undefined,
  limit = 5,
): CategoryTile[] {
  return (categories ?? []).slice(0, limit).map((c) => ({
    id: c.id,
    label: c.name,
    seed: c.slug || String(c.id),
  }))
}
