# iHealthcare.ae

Bilingual (English / Arabic) health & beauty e-commerce — Next.js 16, Tailwind v4, next-intl, Prisma 7 + PostgreSQL.

## Getting started

```bash
npm install            # also generates the Prisma client
neon env pull          # writes DATABASE_URL (pooled) + DATABASE_URL_UNPOOLED (direct) into .env
npm run db:migrate     # apply migrations (uses the direct connection)
npm run db:seed        # load categories, brands and products
npm run dev            # http://localhost:3000
```

The database is **Neon** (project `solitary-dawn-16358631`, branch `production`, see `neon.ts`).
The app uses the pooled `DATABASE_URL`; Prisma CLI uses `DATABASE_URL_UNPOOLED` (`prisma.config.ts`).
After changing `.env`, restart `npm run dev` — the Prisma client keeps its connection pool across hot reloads.

Optional offline database: `npm run db:start` runs a local Prisma Dev Postgres — set `DATABASE_URL` and
`DATABASE_URL_UNPOOLED` to the TCP URL it prints. Prisma Studio does not work against it.

## Scripts

| Script | What it does |
|---|---|
| `npm run db:start` / `db:stop` | Start / stop the local database |
| `npm run db:migrate` | Create & apply a migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Reset the catalogue from `prisma/seed-data/` |
| `npm run db:studio` | Browse the database in Prisma Studio (http://localhost:5555) |
| `npm run images:products` | Product photos in `design/products/<slug>.jpg` → square packshots |
| `npm run images` | Homepage banners in `design/raw/<SLOT>.jpg` → web images (see `docs/homepage-image-plan.md`) |

## Accounts & email (Phase 3)

- Sign-in is **Better Auth** (`src/server/auth.ts`, routes under `/api/auth/*`), users stored in Neon.
- **Make someone staff/admin:** they register on the site, then `npm run user:role -- them@example.com admin`
  (`staff` = can open `/admin`; `admin` = staff + manages staff). They must sign in again.
- **Email:** with `SMTP_HOST` empty, every email (verification, password reset) is saved as an HTML file in
  `.mail-outbox/` — open it in a browser and click the link. Fill `SMTP_*` + `MAIL_FROM` in `.env` to send for real.
- **Google sign-in** appears automatically once `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set.
- After changing `.env` **or** `prisma/schema.prisma`, restart `npm run dev` (the DB client is cached across hot reloads).

## Admin portal

`/en/admin` (staff/admin roles only — customers get 404):

- **Dashboard** — today's orders, 7-day revenue, orders to fulfil, COD to collect, low stock, recent activity.
- **Products** — search/filter, create & edit (EN/AR, brand, category, price/was-price, stock, options,
  labels, Subscribe & save, multi-buy tiers), photo upload (auto white-square packshots), archive/restore,
  CSV export and import (check first, then apply; rows matched by `slug`).
- **Orders** — status tabs, search, detail with timeline, status changes (allowed steps only; COD is marked
  paid on delivery; cancelling restocks), internal notes, printable tax invoice.
- Every staff change is written to `AuditLog`.

Demo orders for testing: `npm run db:demo-orders` (remove with `npm run db:demo-orders -- --clear`).
Uploaded photos are stored in `public/uploads/` — move to object storage before serverless deployment
(`src/server/admin/uploads.ts` is the only place to change).

## Checkout & payments (Phase 4)

- **Rules** live in `src/lib/store-settings.ts`: VAT 5% (prices include it), standard delivery AED 15 (free
  from AED 100), express +AED 20 on top (Dubai only), cash on delivery up to AED 2,000 and never for
  Subscribe & save. Totals are always recalculated on the server (`src/server/checkout/quote.ts`).
- **Stripe** (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`): card orders are reserved as
  `PENDING_PAYMENT`, then confirmed when payment succeeds — by the webhook (`/api/stripe/webhook`, needs
  `STRIPE_WEBHOOK_SECRET`) and also by the return page, so it works locally without the webhook.
  Test cards: `4242 4242 4242 4242` (succeeds), `4000 0000 0000 0002` (declined), any future date / CVC.
- **Subscribe & save** saves the card with Stripe; `/account/subscriptions` lets customers skip, change
  frequency, pause or cancel. Renewals run via `POST /api/cron/subscriptions` (`Bearer CRON_SECRET`) —
  locally `npm run subscriptions:renew`; in production schedule it daily.
- **Refunds:** cancelling or refunding a paid card order in the admin refunds it in full through Stripe.
- Apple Pay / Google Pay appear automatically once the site runs on HTTPS with the domain verified in Stripe.

## Layout

- `prisma/` — schema, migrations, seed data
- `src/server/` — database access (server-only)
- `src/lib/catalog-types.ts` — product/category shapes shared by server and client
- `src/app/[locale]/` — pages (`/en/…`, `/ar/…`)
