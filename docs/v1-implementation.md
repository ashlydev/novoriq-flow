# Novoriq BusinessOS V1

## A. V1 Architecture

### Product structure

- `app/`
  - App Router pages split into marketing, auth, and protected business routes.
- `components/`
  - Reusable layout, UI, and module forms.
- `lib/`
  - Domain types, business calculations, seed data, and client persistence helpers.
- `prisma/`
  - Production-minded PostgreSQL domain schema and seed entrypoint.

### Module breakdown

- Authentication and session
  - Client demo auth for immediate usability, structured around users and workspace membership so it can be replaced with a backend auth adapter later.
- Workspace onboarding
  - First-login workspace creation, brand basics, currency, document prefixes, and reminder settings.
- Core data modules
  - Customers, suppliers, items, quotes, invoices, payments, receipts, expenses, cash entries.
- Intelligence layer
  - Dashboard metrics, unpaid tracker, notifications, reports, activity stream.
- Settings and static info
  - Business/profile settings, notification/document preferences, legal/support pages.

### Future extension path

- Replace the local store with repository-backed server actions or API routes without changing the UI module boundaries.
- Add subscription plans, feature flags, multi-user roles, branch support, and deeper accounting/inventory around the existing `workspaceId` isolation.
- Extend the Prisma schema with purchases, recurring invoices, automation jobs, and audit tables without rewriting the V1 document flows.

## B. Database / Domain Model

Core entities are implemented in TypeScript under `lib/types.ts` and mirrored in [prisma/schema.prisma](/home/falcon/Desktop/NOVORIQ FLOW/prisma/schema.prisma).

### Main entities

- `User`
  - Account holder profile with role foundation.
- `Workspace`
  - Single business/workspace context for V1.
- `WorkspaceMember`
  - Many-to-many user/workspace membership for future multi-user expansion.
- `WorkspaceSettings`
  - Document prefixes, due-soon window, brand accent, reminder toggles, terms snippet.
- `Customer`
  - Contact info, notes, archived flag, invoice/payment rollup source.
- `Supplier`
  - Contact info, notes, archived flag, future payables/purchases extension point.
- `Item`
  - Product/service catalog with price, optional cost, SKU/category, active state.
- `Quote`
  - Customer-linked quote header with status, dates, notes, totals inputs.
- `QuoteLineItem`
  - Stored per quote with quantity and pricing snapshot.
- `Invoice`
  - Customer-linked invoice header with due date, totals inputs, optional quote linkage.
- `InvoiceLineItem`
  - Stored per invoice for durable pricing history.
- `Payment`
  - Partial/full payment records tied to invoices.
- `Receipt`
  - Generated payment confirmation tied to a payment and invoice.
- `Expense`
  - Operating cost record with category, optional supplier link, notes, attachment label.
- `CashEntry`
  - Lightweight cash in / cash out records.
- `AppNotification`
  - Workspace-scoped alerts with link targets and read state.
- `Activity`
  - Audit-friendly activity stream for user-visible timeline history.

## C. UI / Page Map

- `/`
  - Marketing landing page
- `/signin`
  - Sign in
- `/signup`
  - Sign up
- `/forgot-password`
  - Reset request stub
- `/legal/terms`
  - Terms of Service
- `/legal/privacy`
  - Privacy Policy
- `/support`
  - Contact / support
- `/app/onboarding`
  - Business onboarding
- `/app/dashboard`
  - Dashboard
- `/app/customers`
  - Customer list + create
- `/app/customers/[customerId]`
  - Customer detail + edit
- `/app/suppliers`
  - Supplier list + create
- `/app/suppliers/[supplierId]`
  - Supplier detail + edit
- `/app/items`
  - Item list + create
- `/app/items/[itemId]`
  - Item detail + edit
- `/app/quotes`
  - Quote list
- `/app/quotes/new`
  - New quote
- `/app/quotes/[quoteId]`
  - Quote detail + edit + convert
- `/app/invoices`
  - Invoice list
- `/app/invoices/new`
  - New invoice
- `/app/invoices/[invoiceId]`
  - Invoice detail + edit + payment capture
- `/app/receipts`
  - Receipt history
- `/app/receipts/[receiptId]`
  - Receipt detail / reprint
- `/app/expenses`
  - Expense list + create
- `/app/expenses/[expenseId]`
  - Expense detail + edit
- `/app/cash-flow`
  - Cash in / cash out
- `/app/unpaid`
  - Unpaid tracker
- `/app/reports`
  - V1 reports
- `/app/notifications`
  - Notification center
- `/app/settings`
  - Business/profile/preferences + legal links

## D. Implementation Priority Order

1. Auth + business onboarding
2. App shell + navigation + dashboard shell
3. Customers
4. Suppliers
5. Items/products/services
6. Quotations
7. Invoices
8. Payments
9. Receipts
10. Expenses
11. Unpaid tracker + dashboard metrics
12. Notifications
13. Settings + legal/info pages
14. Seed/demo data
15. Final UI polish + validation + error states

## E. Actual Implementation

This V1 repository includes:

- A full Next.js app shell and mobile-first UI.
- Protected routing and onboarding behavior.
- Workspace-scoped demo persistence and realistic seed data.
- CRUD-style flows for customers, suppliers, items, quotes, invoices, expenses.
- Quote-to-invoice conversion.
- Payment recording with automatic receipt generation.
- Dashboard, unpaid tracker, reports, notifications, settings, and legal/support pages.

## F. Seed / Demo Data Support

- Seed data is defined in [lib/seed.ts](/home/falcon/Desktop/NOVORIQ FLOW/lib/seed.ts).
- Demo credentials are preloaded for founder walkthroughs.
- Dashboard, quotes, invoices, payments, receipts, expenses, notifications, and activities are seeded so the app feels alive immediately.
- Reset control is available in settings to return the app to demo-ready state.

## G. Notes / Assumptions

- The app currently uses local persistence for a fully runnable demo/workshop MVP because no backend infrastructure existed in the workspace at the start of the build.
- A PostgreSQL/Prisma schema is included so production data modeling is not deferred.
- Forgot password is implemented as a V1-safe stub page rather than a real email workflow.
- Logo handling uses data URL upload preview in the client for the MVP.
- Profit snapshot is explicitly based on collected payments minus recorded expenses.
- One workspace per account is implemented in V1, but membership and workspace modeling allow multi-user and multi-workspace growth later.

## H. Manual Test Checklist

- Sign up with a new email, confirm redirect to onboarding.
- Sign in with demo credentials and confirm redirect to dashboard.
- Sign out and confirm protected routes return to sign-in.
- Complete business onboarding and confirm workspace settings persist.
- Create a customer and confirm it appears in the list and detail page.
- Create a supplier and confirm it appears in the list and detail page.
- Create an item and confirm it can be selected in quote/invoice forms.
- Create a quote and confirm totals, status, and detail page render correctly.
- Convert a quote to an invoice and confirm the invoice is created and the quote status updates.
- Create an invoice directly and confirm totals and due date display correctly.
- Record a partial payment and confirm outstanding balance, invoice status, receipt, dashboard totals, and notifications update.
- Record a final payment and confirm invoice status becomes paid and a new receipt is generated.
- Open a receipt detail page and confirm receipt data matches the linked payment and invoice.
- Create an expense and confirm the dashboard expense total and profit snapshot update.
- Open unpaid tracker and confirm overdue, due soon, unpaid, and customer balance sections reflect the data.
- Open notifications and confirm unread state, mark-read, and deep links work.
- Open settings and confirm profile, business, and document preference changes persist.
- Open legal/support pages from settings or auth screens and confirm content renders cleanly.
