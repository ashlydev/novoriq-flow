# Novoriq Flow

Novoriq Flow is Novoriq's standalone business operations platform for SMEs and growing businesses.

This repository now reflects the product through **V7**, extending the original V1 invoicing and expense MVP into a broader BusinessOS with network workflows, finance-readiness, enterprise controls, and intelligence/automation features.

## Current Product Scope

Novoriq Flow currently includes:

- V1 core operations: auth, onboarding, dashboard, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, unpaid tracking, reports, notifications, settings, and legal/support pages
- V2 financial control: stronger receivables, payables, purchases, partial payments, roles/access, audit logging, owner-away dashboards, and stronger reports
- V3 growth operations: team collaboration, branches, approvals, inventory-lite, low-stock alerts, cash-flow forecasting, projects/jobs, documents, advanced analytics, and templates
- V4 business network: business profiles, supplier discovery, connections, catalogs, purchase orders, RFQs, reorder flows, relationship history, trust indicators, and network activity
- V5 finance readiness: payment requests, reconciliation, finance dashboards, readiness indicators, eligible invoices, supplier credit visibility, and finance reports
- V6 enterprise controls: advanced permissions, maker-checker flows, departments, procurement controls, admin console, branch comparison, enterprise dashboards, exports, and stronger auditability
- V7 intelligence and automation: assistant/copilot, automation rules, anomaly detection, intelligent summaries, recommendations, action center tasks, AI-assisted drafting, predictive insights, and explainability

## Product Positioning

- `ZimTill` = run my shop
- `Novoriq Flow` = run my business

V7 promise:

> Turn business data into actions, alerts, automation, and intelligent decision support.

## Stack

- Next.js 15
- React 19
- TypeScript
- Prisma schema targeting PostgreSQL for production modeling
- Local-first runtime persistence for demo/workshop use in this workspace

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm ci
npm run build
npm start
```

## Demo Credentials

- Email: `owner@novoriq.demo`
- Password: `demo1234`

## Deployment

Render-ready config is included in [render.yaml](/home/falcon/Desktop/NOVORIQ%20FLOW/render.yaml).

Supporting runtime files:

- [.node-version](/home/falcon/Desktop/NOVORIQ%20FLOW/.node-version)
- [package.json](/home/falcon/Desktop/NOVORIQ%20FLOW/package.json)

## Architecture Notes

- The app is implemented as a layered upgrade path rather than a rebuild.
- V1-V7 capabilities are preserved and extended through provider/state layers in `components/shared`.
- Prisma models in [schema.prisma](/home/falcon/Desktop/NOVORIQ%20FLOW/prisma/schema.prisma) represent the production-minded target data model.
- The checked-in runtime is still local-first, which keeps demos and iteration fast while preserving a clean path to a backed SaaS deployment later.

## Key Documentation

- [docs/v1-implementation.md](/home/falcon/Desktop/NOVORIQ%20FLOW/docs/v1-implementation.md)
- [docs/v3-upgrade.md](/home/falcon/Desktop/NOVORIQ%20FLOW/docs/v3-upgrade.md)
- [docs/v4-upgrade.md](/home/falcon/Desktop/NOVORIQ%20FLOW/docs/v4-upgrade.md)
- [docs/v5-upgrade.md](/home/falcon/Desktop/NOVORIQ%20FLOW/docs/v5-upgrade.md)
- [docs/v6-upgrade.md](/home/falcon/Desktop/NOVORIQ%20FLOW/docs/v6-upgrade.md)
- [docs/v7-upgrade.md](/home/falcon/Desktop/NOVORIQ%20FLOW/docs/v7-upgrade.md)

## Important Notes

- This is **not** ZimTill.
- The current workspace implementation is a demo-capable application with production-minded structure.
- Financial, enterprise, network, and intelligence features are designed to be explainable and trustworthy rather than over-automated.
