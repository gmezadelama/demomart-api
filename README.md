# DemoMart API

A small **NestJS + Prisma** demo backend for portfolio purposes.  
Implements a fake e-commerce API with catalog browsing and demo users.

---

## Features so far

- **Catalog**
  - `GET /categories` → list all categories
  - `GET /products` → list products with optional `category`, `search`, `skip`, `limit`
  - `GET /products/:slug` → product detail with variants + assets

- **Users**
  - `GET /users/demo` → returns two demo users (Alice and Bob)
  - `GET /users/:id/orders` → list past orders for a user (Alice has 3 seeded, Bob has none)
  - `GET /users/:id/wishlist` → list wishlist items (empty for now)

- **Tech**
  - [NestJS](https://nestjs.com/) (v11)
  - [Prisma](https://www.prisma.io/) (v6) with PostgreSQL (Neon)
  - REST endpoints (no GraphQL)
  - Unit tests with Jest

---

## Getting started

### 1. Install dependencies

```bash
npm install
```
