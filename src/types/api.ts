/**
 * TypeScript mirror of the Chabhuoy Laravel API contract.
 * Sourced from app/Http/Resources/* and app/Enums/* in chabhuoy-laravel.
 *
 * Wrapping rule (Laravel JsonResource):
 *  - A resource returned as THE response is wrapped in `{ data: ... }`.
 *  - A resource nested inside `response()->json([...])` is NOT wrapped.
 * That asymmetry is why `login` returns `user` flat but `me` returns `{ data }`.
 */

// app/Enums/UserRole.php
export const USER_ROLES = ['customer', 'vendor', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

// app/Models/Vendor.php (STATUS_* constants)
export const VENDOR_STATUSES = ['pending', 'active', 'suspended'] as const
export type VendorStatus = (typeof VENDOR_STATUSES)[number]

// app/Enums/OrderStatus.php — order-level rollup status
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

// app/Enums/FulfillmentStatus.php — per-line status. `returned` is set when a
// rider sends an undelivered parcel back to the vendor (stock is restocked).
export type FulfillmentStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

// app/Enums/PaymentMethod.php
export const PAYMENT_METHODS = ['card', 'qr', 'cod'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Vendor {
  /** uuid */
  id: string
  name: string
  status: VendorStatus
  /** Decimal — Laravel serializes as string; only present for admin/owner. */
  payout_balance?: string | number | null
  /** Platform take rate, 0-100. Decimal string; only present for admin/owner. */
  commission_rate?: string | number | null
}

// DeliveryMan::STATUS_* — rider account status (same three values as vendors).
export const DELIVERY_MAN_STATUSES = ['pending', 'active', 'suspended'] as const
export type DeliveryManStatus = (typeof DELIVERY_MAN_STATUSES)[number]

// app/Http/Resources/DeliveryManResource.php
export interface DeliveryMan {
  /** uuid */
  id: string
  name: string
  vehicle_type: string | null
  status: DeliveryManStatus
  is_online: boolean
  /** Decimal string; platform owes the rider this. Only present to admin/self. */
  wallet_balance?: string | number | null
  /** COD cash the rider is holding, owed back to the platform. Admin/self only. */
  cash_in_hand?: string | number | null
}

// app/Enums/DeliveryEarningStatus.php — today's stub provider always lands
// `completed`; pending/failed arrive with a real disbursement provider.
export const DELIVERY_EARNING_STATUSES = ['pending', 'completed', 'failed'] as const
export type DeliveryEarningStatus = (typeof DELIVERY_EARNING_STATUSES)[number]

// app/Http/Resources/DeliveryEarningResource.php — a platform→rider disbursement.
export interface DeliveryEarning {
  /** uuid */
  id: string
  delivery_man?: { id: string; name: string }
  amount: string | number
  status: DeliveryEarningStatus
  /** Disbursement provider reference (disb_…), or null. */
  reference: string | null
  processed_at: string | null
  created_at: string
}

export interface ProductCategoryRef {
  id: number
  name: string
}

// Admin moderation filter — maps to the product's `is_active` boolean; there
// is no product status enum on the backend.
export const PRODUCT_STATUSES = ['active', 'inactive'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export interface Product {
  /** uuid */
  id: string
  name: string
  slug: string
  description: string | null
  price: string | number
  stock: number
  in_stock: boolean
  is_active: boolean
  /** Absolute URL to the uploaded image, or null before one is set. */
  image_url: string | null
  category?: ProductCategoryRef
  vendor?: Vendor
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  children?: Category[]
}

// app/Enums/BannerType.php — which storefront slot a banner fills.
export const BANNER_TYPES = ['hero', 'promo', 'eco', 'seasonal'] as const
export type BannerType = (typeof BANNER_TYPES)[number]

// app/Http/Resources/BannerResource.php — admin-managed storefront content.
export interface Banner {
  id: number
  type: BannerType
  title: string
  subtitle: string | null
  /** Absolute URL to the uploaded image, or null before one is set. */
  image_url: string | null
  link_url: string | null
  cta_label: string | null
  position: number
  is_active: boolean
}

// app/Http/Resources/BrandStoreResource.php — admin-managed brand-store tile.
export interface BrandStore {
  id: number
  name: string
  caption: string | null
  /** Absolute URL to the uploaded logo, or null before one is set. */
  logo_url: string | null
  link_url: string | null
  position: number
  is_active: boolean
}

export interface OrderLine {
  product_name: string
  quantity: number
  unit_price: string | number
  line_total: string | number
  status: FulfillmentStatus
}

/** The customer behind an order — only present on the admin listing. */
export interface OrderCustomer {
  id: number
  name: string
  email: string
}

/** Immutable address snapshot frozen onto the order at checkout (null on legacy rows). */
export interface OrderShipping {
  recipient_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  postal_code: string
  country: string
}

/** One parcel of a (possibly multi-vendor) order. `carrier` is nullable even when shipped. */
export interface OrderShipment {
  carrier: string | null
  tracking_number: string | null
  shipped_at: string | null
  /** Named on the customer's own order detail; `null` on the vendor's PATCH response. */
  vendor: { id: string; name: string } | null
}

/**
 * OrderResource — used by both admin (`/admin/orders`) and customer (`/orders`).
 * `customer` is only loaded on the admin listing; `items` only when eager-loaded
 * (customer index + show do load them). `placed_at` is ISO-8601 with microseconds.
 * `shipments` is only present on detail (`GET /orders/{id}`), absent on the list —
 * and deliberately not yet added to the admin order endpoints.
 */
export interface Order {
  /** uuid */
  id: string
  status: OrderStatus
  status_label: string
  payment_method: PaymentMethod
  total: string | number
  placed_at: string | null
  customer?: OrderCustomer
  shipping?: OrderShipping | null
  items?: OrderLine[]
  shipments?: OrderShipment[]
}

// ---------------------------------------------------------------------------
// Admin — customers
// ---------------------------------------------------------------------------

/**
 * A row on `GET /admin/customers`. `total_spent` is *realised* revenue only
 * (paid+shipped+delivered orders) — deliberately not aligned with
 * `orders_count`, which counts every order regardless of status.
 */
export interface AdminCustomer {
  id: number
  name: string
  email: string
  orders_count: number
  total_spent: string
  created_at: string
}

/** A row in a customer's `recent_orders` — slim `OrderResource`, no `customer`/`items`. */
export type CustomerOrderSummary = Pick<
  Order,
  'id' | 'status' | 'status_label' | 'payment_method' | 'total' | 'placed_at' | 'shipping'
>

/** `GET /admin/customers/{id}` — profile + lifetime metrics + recent activity. */
export interface AdminCustomerDetail extends AdminCustomer {
  recent_orders: CustomerOrderSummary[]
  addresses: Address[]
}

// ---------------------------------------------------------------------------
// Admin — vendor payouts
// ---------------------------------------------------------------------------

// app/Enums/PayoutStatus.php — the stub provider lands `completed`
// synchronously today; pending/failed arrive with a real provider.
export const PAYOUT_STATUSES = ['pending', 'completed', 'failed'] as const
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]

/** A ledger row on `GET /admin/payouts`, and the `201` body of `POST /admin/payouts/{vendor}`. */
export interface Payout {
  /** uuid */
  id: string
  vendor: { id: string; name: string } | null
  amount: string
  status: PayoutStatus
  reference: string | null
  processed_at: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Customer storefront — cart, addresses, checkout
// ---------------------------------------------------------------------------

/**
 * GET /cart — plain JSON `{ items: [...] }` (NOT data-wrapped).
 *
 * ⚠️ CORRECTED CONTRACT: `product_id` is modelled as the product **uuid**, the
 * only id the storefront ever holds. The live backend still returns the internal
 * bigint here and `PUT/DELETE /cart` still key on it — see the cart blocker in
 * API_CONTRACT.md. This type targets the requested fix; cart wiring stays staged
 * until it lands.
 */
export interface CartItem {
  /** product uuid (post-fix) */
  product_id: string
  name: string
  quantity: number
  unit_price: string | number
}

export interface Cart {
  items: CartItem[]
}

/** GET /addresses — AddressResource. `id` is the uuid; routes bind by uuid. */
export interface Address {
  /** uuid */
  id: string
  label: string | null
  recipient_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  postal_code: string
  /** ISO 3166-1 alpha-2 */
  country: string
  is_default: boolean
}

/** Body for POST/PUT /addresses. `slug`-like fields are server-owned. */
export interface CreateAddressInput {
  label?: string | null
  recipient_name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  postal_code: string
  country: string
  is_default?: boolean
}

/**
 * Body for POST /orders (checkout). The order is placed from the server cart.
 *
 * ⚠️ CORRECTED CONTRACT: `address_id` is the address **uuid**. The live backend
 * validates it as the bigint PK (`exists:addresses,id` + `findOrFail`), which the
 * uuid-only address list can't supply — same class of bug as the cart, flagged in
 * API_CONTRACT.md.
 */
export interface PlaceOrderInput {
  payment_method: PaymentMethod
  /** address uuid (post-fix) */
  address_id: string
}

/** POST /register — body. `password_confirmation` drives Laravel's `confirmed` rule. */
export interface RegisterInput {
  name: string
  email: string
  password: string
  password_confirmation: string
}

/** A row in `dashboard.catalog.top_products` — ranked by revenue desc, top 5. */
export interface DashboardTopProduct {
  /** uuid — join-ready, unlike the old reports/sales top-vendor bigint. */
  id: string
  name: string
  revenue: string
  units: number
}

/**
 * GET /admin/dashboard — plain JSON, not wrapped in `data`. One call powering
 * the whole KPI/attention strip; replaces the old `reports/sales` + page-1
 * `/admin/orders` stitch. Money fields are fixed 2-decimal strings.
 */
export interface DashboardSummary {
  revenue: { captured: string; today: string }
  orders: {
    total: number
    /** Every one of the 5 statuses is always present; absent buckets are 0. */
    by_status: Record<OrderStatus, number>
  }
  customers: { total: number; new_this_week: number }
  /** Vendors with `payout_balance > 0` — the actionable disbursement queue. */
  payouts: { pending_amount: string; pending_count: number }
  catalog: { low_stock_count: number; top_products: DashboardTopProduct[] }
}

/** POST /login & /register — user is nested, so NOT wrapped in `data`. */
export interface AuthResponse {
  user: User
  token: string
}

// ---------------------------------------------------------------------------
// Laravel pagination envelope (AnonymousResourceCollection over a paginator)
// ---------------------------------------------------------------------------
export interface Paginated<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

/** A single resource returned as the top-level response. */
export interface Wrapped<T> {
  data: T
}
