# DemoMart API

A small **NestJS + Prisma** demo backend for portfolio purposes.  
Implements a fake e-commerce API with catalog browsing, demo users, and simple orders. Includes early Stripe test-mode wiring.

---

## Features so far

### Catalog

- `GET /api/v1/categories` — list all categories
- `GET /api/v1/products` — list products with optional `category`, `search`, `skip`, `limit`
- `GET /api/v1/products/:slug` — product detail with variants + assets

### Users

- `GET /api/v1/users/demo` — returns two demo users (Alice and Bob)
- `GET /api/v1/users/:id/orders` — list a user’s orders with simple pagination
- `GET /api/v1/users/:id/wishlist` — wishlist (currently empty)

### Orders

- `POST /api/v1/orders` — create an order from variant lines (validates active variants, rejects mixed currency, computes totals)
- `GET /api/v1/orders/:id` — order detail (items + product/variant info, totals, latest payment)
- `GET /api/v1/users/:id/orders` — (same as above list)

### Payments (Stripe — demo/test mode)

- `POST /api/v1/payments/attach-order` — creates a PaymentIntent for an order total (test keys) and returns `clientSecret`
- `POST /api/v1/payments/webhook` — handles Stripe events (signature-verified) and updates `Order.paymentStatus`
  > Amount is validated against the order’s `totalCents`. Real capture/fulfillment flows are **not** implemented (demo scope).

### Tooling / Docs

- **OpenAPI spec generation**: `npm run generate:openapi` → updates `openapi-spec.json`
- Unit tests with **Jest** (services, controllers)
- Validation with **Zod** via a small Nest pipe

---

## Tech

- [NestJS](https://nestjs.com/) (v11)
- [Prisma](https://www.prisma.io/) (v6) with PostgreSQL (e.g., Neon)
- REST endpoints (no GraphQL)

---

## Getting started

### 1) Install

```bash
npm install
```

### 2) Environment

Copy `.env.template` → `.env` and set:

```
DATABASE_URL=postgresql://...
ADMIN_TOKEN=change-me
# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> Payments routes will be no-ops without Stripe test keys, but the API will still run.

### 3) DB migrate & seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4) Run

```bash
npm run start:dev
# http://localhost:3000
```

---

## Quick checks (curl)

Create order:

```bash
curl -s -X POST http://localhost:3000/api/v1/orders   -H "Content-Type: application/json"   -d '{"userId":"<USER_ID>","items":[{"variantId":"<VARIANT_ID>","quantity":2}], "isDemo": true}'
```

User orders:

```bash
curl -s "http://localhost:3000/api/v1/users/<USER_ID>/orders?limit=5"
```

Stripe attach (test mode):

```bash
curl -s -X POST http://localhost:3000/api/v1/payments/attach-order   -H "Content-Type: application/json"   -d '{"orderId":"<ORDER_ID>"}'
```

---

## OpenAPI

Generate/refresh the spec:

```bash
npm run generate:openapi
```

This produces/updates `openapi-spec.json` at the repo root (used by client mocks/Swagger viewers).

---

## Notes

- This is a **demo/portfolio** backend. Auth, inventory, and real fulfillment are intentionally simplified.
