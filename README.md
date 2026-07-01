# Chabhuoy Admin Web

Admin console for the [Chabhuoy multi-vendor marketplace API](../chabhuoy-laravel).
Lets a platform admin sign in, read the sales report, and moderate vendors
(approve / suspend / reactivate).

## Stack

- **React 19 + TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Vite** dev server + build
- **TanStack Query v5** — server state, optimistic vendor mutations
- **Zustand** (persisted) — auth token + user
- **axios** — single instance, bearer-token interceptor, 401 → auto sign-out
- **Tailwind v4** — theme tokens in `src/index.css`
- **Vitest + Testing Library** — hook/behaviour tests
- **Zod** — response validation at the network boundary

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_URL=/api uses the dev proxy (no CORS)
npm run dev            # http://localhost:5174
```

The Laravel API must be running on `http://localhost:8000`:

```bash
cd ../chabhuoy-laravel && php artisan serve
```

In dev, Vite proxies `/api/*` to `localhost:8000` (`vite.config.ts`), so the
browser only ever talks to the Vite origin — **no CORS config needed**. In
production, set `VITE_API_URL` to the API origin (e.g. `https://api.chabhuoy.com/api`)
and ensure the API sends CORS headers for the admin origin.

### Sign in

The seeded admin (`php artisan db:seed`):

```
admin@example.com / password
```

Non-admin accounts are rejected at login (`useLogin`) and by every `admin/*`
route on the API.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 5174) |
| `npm run build` | Typecheck (`tsc -b`) + production build |
| `npm run test` | Vitest (run once) |
| `npm run lint` | Oxlint |

## How it talks to the API

| Screen | Endpoint | Auth |
|---|---|---|
| Login | `POST /login` → `{ user, token }` | public |
| Dashboard | `GET /admin/reports/sales` | bearer + admin |
| Vendors | `GET /admin/vendors`, `PATCH /admin/vendors/{id}` | bearer + admin |
| Products | `GET /products` | public |

Money fields serialize as decimal **strings** from Laravel; `src/utils/format.ts`
coerces and formats them — pages never do ad-hoc `Number()` casts.

## Architecture

```
src/
  lib/api.ts            axios instance + interceptors + error normaliser
  store/auth.ts         persisted zustand auth slice (token + user)
  query/                QueryClient + central query-key factory
  types/api.ts          TS mirror of the Laravel resource contract
  features/<domain>/    service (pure API fns) + hooks (useQuery/useMutation)
  components/           ProtectedRoute, AdminLayout, ui/
  pages/                Login, Dashboard, Vendors, Products
  router.tsx            React Router v7 route tree
```

Server state lives in TanStack Query; only the auth token/user lives in Zustand.
The vendor status change is an optimistic mutation with rollback on error
(`features/vendors/useVendors.ts`), covered by `useVendors.test.tsx`.
