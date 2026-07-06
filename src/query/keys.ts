/**
 * Central query-key factory. Never scatter raw string keys across hooks —
 * invalidation and cache lookups must reference the same canonical keys.
 */
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  dashboard: {
    // One-call KPI/attention summary; vendor + order status mutations
    // invalidate this since they shift revenue/payouts/order-histogram figures.
    summary: () => ['dashboard', 'summary'] as const,
  },
  vendors: {
    all: () => ['vendors'] as const,
    list: (params: { status?: string; page?: number }) =>
      ['vendors', 'list', params] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    // Public storefront taxonomy tree (top-level + one level of children).
    tree: () => ['categories', 'tree'] as const,
    // Admin CRUD tree — same shape, separate cache from the public tree.
    admin: () => ['categories', 'admin'] as const,
  },
  customers: {
    all: () => ['customers'] as const,
    list: (params: { search?: string; page?: number }) =>
      ['customers', 'list', params] as const,
    detail: (id: number) => ['customers', 'detail', id] as const,
  },
  payouts: {
    all: () => ['payouts'] as const,
    list: (params: { vendorId?: string; page?: number }) =>
      ['payouts', 'list', params] as const,
  },
  banners: {
    all: () => ['banners'] as const,
    // Public storefront banners, optionally scoped to one slot type.
    list: (type?: string) => ['banners', 'list', type ?? 'all'] as const,
    // Admin CMS list (includes inactive).
    admin: () => ['banners', 'admin'] as const,
  },
  brandStores: {
    all: () => ['brand-stores'] as const,
    list: () => ['brand-stores', 'list'] as const,
    admin: () => ['brand-stores', 'admin'] as const,
  },
  products: {
    all: () => ['products'] as const,
    list: (params: { search?: string; page?: number; perPage?: number }) =>
      ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    // Admin moderation list — all vendors, ignores storefront visibility.
    admin: (params: { status?: string; vendorId?: string; search?: string; page?: number }) =>
      ['products', 'admin', params] as const,
  },
  orders: {
    all: () => ['orders'] as const,
    list: (params: { status?: string; page?: number }) =>
      ['orders', 'list', params] as const,
    // Customer-facing "my orders" — distinct from the admin `list` above.
    mine: (params: { page?: number }) => ['orders', 'mine', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  deliveryMen: {
    all: () => ['delivery-men'] as const,
    list: (params: { status?: string; search?: string; page?: number; perPage?: number }) =>
      ['delivery-men', 'list', params] as const,
  },
  deliveryEarnings: {
    all: () => ['delivery-earnings'] as const,
    list: (params: { deliveryManId?: string; page?: number; perPage?: number }) =>
      ['delivery-earnings', 'list', params] as const,
  },
  deliveryCashSettlements: {
    all: () => ['delivery-cash-settlements'] as const,
    list: (params: { deliveryManId?: string; page?: number; perPage?: number }) =>
      ['delivery-cash-settlements', 'list', params] as const,
  },
  cart: {
    current: () => ['cart'] as const,
  },
  addresses: {
    all: () => ['addresses'] as const,
  },
} as const
