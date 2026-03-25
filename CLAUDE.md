# Shoperator

A web app for comparing grocery prices across stores (starting with Costco and Aldi). The core value is **unit price normalization** — showing users which product is cheapest per oz, per count, per fl oz, etc., even when products aren't identical across stores.

## Product Goals

- Users pick a generic product category (e.g. "Cold Brew Coffee")
- They select a specific product from each store
- The app calculates and displays the unit price for each, highlights the winner, and shows the savings %
- Adding more stores over time should require minimal effort
- An admin interface allows curating and maintaining product/price data

## Core Domain

- Unit price normalization is the core value — always calculate per-unit cost when comparing across stores
- Business logic: `packages/shared/src/utils/priceCalc.ts` (price normalization, savings %) and `unitNormalizer.ts` (unit conversions)
- Types: `packages/shared/src/types/`
- All calculation/utility code in `packages/shared` must have unit tests (Vitest); tests live alongside source files

## Commands

```
pnpm dev           # start API + web together
pnpm test          # run all tests
pnpm typecheck     # TypeScript check across all workspaces
pnpm lint          # ESLint across all workspaces
pnpm build         # build all packages in order (shared → api → web)
pnpm db:migrate    # run DB migrations
pnpm db:seed       # seed the database
```

After making changes: `pnpm typecheck && pnpm test`

## Environment Setup

Copy `apps/api/.env.example` to `apps/api/.env`. Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_TOKEN` — secret token for admin endpoints (min 8 chars)

## Project Structure

pnpm monorepo: `apps/api` (Express + Drizzle ORM + PostgreSQL), `apps/web` (React + Vite + Tailwind), `packages/shared` (types + utils). Build shared before apps.

## Non-Negotiable Rules

- TypeScript strict mode — no `any` types
- Admin routes require `ADMIN_TOKEN` authentication
- Parameterized queries only — never concatenate user input into SQL
- Mobile-first CSS — design for 375px wide first, then scale up
- Touch targets ≥ 44×44px
- Show loading skeletons for async data, never blank screens
- Don't hardcode prices or product data in the frontend
- Color is never the only way to convey information (winners need a label, not just green)
- Empty states must guide the user ("No products found — add one in admin")

## Design Principles

- **Simple and obvious**: Users should be able to compare prices in 3 taps with no instructions
- **Sleek and clean**: Minimal UI, clear typography, intentional whitespace
- **Fast**: Pages should feel instant

## What NOT to Do

- Don't use `any` in TypeScript
- Don't skip loading/error states
- Don't add features that weren't asked for
