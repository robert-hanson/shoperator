# Shoperator

Compare unit prices across grocery stores. Pick a product category, select an item from Costco and Aldi, and instantly see which is cheaper per oz, per count, per fl oz, etc.

---

## Prerequisites

- [Node.js](https://nodejs.org) v20+
- [pnpm](https://pnpm.io) v9+ — `npm install -g pnpm`
- [Docker](https://www.docker.com) (for local PostgreSQL)

---

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://shoperator:shoperator@localhost:5432/shoperator` |
| `ADMIN_TOKEN` | Secret token for the admin UI | *(change this)* |
| `PORT` | API server port | `3001` |
| `CORS_ORIGIN` | Web app origin (for CORS) | `http://localhost:5173` |

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Seed initial product data

```bash
pnpm db:seed
```

This loads 12 real products across 6 categories (cold brew coffee, baby wipes, olive oil, eggs, butter, dish soap) for both Costco and Aldi.

### 6. Start the development servers

```bash
pnpm dev
```

This starts both apps concurrently:
- **Web** → http://localhost:5173
- **API** → http://localhost:3001

The web app proxies `/api` requests to the API automatically.

---

## Testing

### Unit tests

```bash
pnpm test
# or just the shared package:
pnpm --filter shared test
```

The unit tests cover the core price calculation logic — unit conversions (oz, fl oz, lbs, count, etc.) and per-unit price normalization.

### Type checking

```bash
pnpm typecheck
```

Runs `tsc --noEmit` across all three packages in parallel.

---

## Project Structure

```
shoperator/
├── apps/
│   ├── api/                   Express + TypeScript backend
│   │   └── src/
│   │       ├── config/        Environment vars (Zod), database connection (Drizzle)
│   │       ├── db/            Drizzle schema, migrations, seed script
│   │       ├── routes/        API route handlers
│   │       ├── services/      Business logic (scrape-assist)
│   │       ├── middleware/    Error handler, admin auth
│   │       ├── jobs/          Staleness cron job
│   │       └── index.ts       App entry point
│   │
│   └── web/                   React + Vite + Tailwind frontend
│       └── src/
│           ├── components/    UI components (ui/, layout/, comparison/)
│           ├── hooks/         TanStack Query hooks
│           ├── lib/           API client, query client config
│           ├── pages/         HomePage, ComparePage, AdminPage
│           ├── store/         Zustand store (selected variants)
│           └── styles/        Global CSS + Tailwind config
│
└── packages/
    └── shared/                Shared TypeScript types + utilities
        └── src/
            ├── types/         Category, StoreVariant, ComparisonResult interfaces
            └── utils/         Unit conversion math, price calculation
```

### Key Design Decisions

**Monorepo (pnpm workspaces)** — The frontend and backend share TypeScript types via `packages/shared`. Change a type once and both sides update.

**Unit math in `shared`** — `unitNormalizer.ts` and `priceCalc.ts` are the core of the app. They live in the shared package so the frontend can show live price previews and the backend can compute comparison results using identical logic.

**Manual database + scrape-assist** — Neither Costco nor Aldi has a public API. Rather than an unreliable scraper, prices are stored in a curated PostgreSQL database. The scrape-assist tool pre-fills product data from a URL for a human to review before saving.

**Prices stored as integers (cents)** — Avoids floating point rounding errors in all price calculations.

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List all product categories |
| `GET` | `/categories/:slug` | Get a single category |
| `GET` | `/categories/:slug/variants` | List products for a category (`?store=costco,aldi`) |
| `GET` | `/comparison?variantIds=id1,id2` | Compare two or more products, returns unit prices + winner |

### Admin endpoints

Require `Authorization: Bearer <ADMIN_TOKEN>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/stale` | List products not updated in 7+ days |
| `POST` | `/admin/variants` | Add a new product |
| `PATCH` | `/admin/variants/:id` | Update a product (price, confirm freshness, etc.) |
| `DELETE` | `/admin/variants/:id` | Remove a product |
| `POST` | `/admin/scrape-assist` | Fetch `{ url }`, returns pre-filled product fields |

---

## Adding Products

### Via the admin UI

1. Go to http://localhost:5173/admin
2. Enter your `ADMIN_TOKEN`
3. Use **Scrape-Assist**: paste a product URL → fields are pre-filled from the page
4. Review and save

### Via the seed script

Edit [apps/api/src/db/seed.ts](apps/api/src/db/seed.ts) and add entries to `variantData`, then re-run:

```bash
pnpm db:seed
```

### Keeping prices fresh

The API runs a daily cron job (2am) that flags any product not updated in the last 7 days as stale. The admin UI surfaces these in a queue — open the product's source URL, confirm the current price, and click **Confirm**.

---

## Deployment

The app is designed to deploy to **Railway** (API + Postgres) + **Vercel** (web).

### API (Railway)

1. Create a new Railway project, add a PostgreSQL plugin
2. Deploy the `apps/api` service, set env vars from `.env.example`
3. Run `pnpm db:migrate` and `pnpm db:seed` via Railway's shell

### Web (Vercel)

1. Connect the repo to Vercel
2. Set the root directory to `apps/web`
3. Set `VITE_API_URL` to your Railway API URL if not using a proxy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui (Radix primitives) |
| Server state | TanStack Query |
| Client state | Zustand |
| Backend | Express 4, TypeScript |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Shared types | pnpm workspace package |
| Tests | Vitest |
| Containers | Docker Compose (local dev) |
