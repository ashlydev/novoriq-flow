# Novoriq BusinessOS

Standalone V1 MVP for small-business operations under Novoriq.

## Stack

- Next.js + TypeScript
- Demo-capable local persistence via `localStorage`
- Prisma/PostgreSQL schema for the production data model

## Run

```bash
npm install
npm run dev
```

## Deploy

Render-ready config is included in [render.yaml](/home/falcon/Desktop/NOVORIQ FLOW/render.yaml).

Expected production commands:

```bash
npm ci
npm run build
npm start
```

## Demo credentials

- Email: `owner@novoriq.demo`
- Password: `demo1234`

## Scope

V1 covers auth, onboarding, dashboard, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, cash movement, unpaid tracking, reports, notifications, settings, and legal/support pages.

Implementation notes, architecture, and manual test coverage live in [docs/v1-implementation.md](/home/falcon/Desktop/NOVORIQ FLOW/docs/v1-implementation.md).
