# Review notes — Storefront CMS: Banner slice

Reviewer pass (2026-07-01). App is green: **tsc 0 · lint 0 · vitest 41/41 · vite build OK**,
and all 12 live API flows return 200. These are the open items from the review, ranked.
Tick them as you land them.

**Update 2026-07-01 (frontend):** items 2–4 landed (frontend-only). Item 1 is the only
one still open — it needs the backend seeder, out of scope for this terminal. Suite is
now **vitest 55/55**.

## 🔴 Findings

### 1. `banners` / `shipments` / `payouts` migrations were unrun on the live DB
Before they were migrated, `GET /admin/banners` and `GET /banners` **500'd** (table absent),
so a fresh checkout renders an empty/broken storefront. Migrations are now applied locally,
but there's still **no banner seed**, so the homepage falls back to demo mock on any fresh DB.
- **Fix:** add a small banner seeder to `chabhuoy-laravel/database/seeders/DatabaseSeeder.php`
  (a few `hero` + one `promo`/`eco`/`seasonal`) so the storefront shows real CMS content after
  `migrate --seed`.
- **Status:** ⬜ open

### 2. Banner delete is immediate + irreversible, no confirmation
`chabhouy-web/src/pages/BannersPage.tsx:186` — `onClick={() => remove.mutate(b.id)}` fires on a
single click; the backend hard-deletes the row **and the uploaded image file**. One misclick = gone.
- **Fix:** add a confirm step (inline "Confirm?" two-step on the row, or a small dialog).
- **Status:** ✅ fixed 2026-07-01 — `window.confirm` gate before `remove.mutate`, matching the
  existing cancel-order convention in `OrdersPage.tsx`. Covered by `BannersPage.test.tsx`.

### 3. `BannersPage` has no test
The admin CRUD screen (the most complex UI in the slice) is untested — fails the repo's
test-first discipline gate.
- **Fix:** add `chabhouy-web/src/pages/BannersPage.test.tsx` covering: create success closes the
  form + invalidates, Edit prefills the draft from the row, Delete calls the mutation.
- **Status:** ✅ fixed 2026-07-01 — 3 tests added (create/refetch, edit-prefill, delete-confirm).

### 4. (minor) Duplicate SVG gradient ids in `StarRating`
`chabhouy-web/src/components/storefront/StarRating.tsx:33` — `id={`s-${pct}`}` repeats across every
star on the page (dozens of `id="s-100%"`). Duplicate DOM ids are invalid HTML; `url(#…)` resolves
to the first match. Renders correctly only because same-pct gradients are identical — fragile.
- **Fix:** derive a unique id per `Star` with React `useId()`.
- **Status:** ✅ fixed 2026-07-01 — `useId()` per `Star`; regression test in `StarRating.test.tsx`
  asserts 5 unique gradient ids at `stars={5}`.

## ✅ Reviewed, no action
- `StorefrontProductCard.tsx` — heart `preventDefault`s over the card `Link`, `aria-pressed`/
  `aria-label` present, sold-out tied to real `in_stock`. Clean.
- Storefront banner consumption (`sections.tsx` `HeroPanels`/`PromoTrio`/`RamadanBanner`/`EcoPromo`)
  — correctly renders admin banners with demo fallback + image overlay.

## ⏳ Not yet reviewed (blocked)
Visual click-through of every screen is pending — the Chrome extension is disconnected. Reconnect
(restart Chrome) to unblock the full navigate-every-flow pass.
