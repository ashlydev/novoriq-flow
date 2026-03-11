# Novoriq Flow V5 Upgrade

## A. V5 Architecture Update

### Safe extension approach

- V1-V4 remain in place through the existing layered runtime:
  - `BusinessOSProvider` for core workspace operations
  - `FlowV3Provider` for branches, approvals, stock, projects, and documents
  - `FlowV4Provider` for network relationships, catalogs, POs, and RFQs
  - `FlowV5Provider` for finance-readiness state, calculations, actions, notifications, and demo data
- V5 keeps finance-readiness concerns separate from both the operational domain and the network domain:
  - operational domain: invoices, payments, receipts, expenses, purchases, receivables, payables, suppliers, reports
  - network domain: profiles, discovery, connections, catalogs, purchase orders, RFQs, reorder, relationship history
  - finance-readiness domain: payment requests, reconciliation, ledger-ready movements, supplier-credit visibility, readiness snapshots, eligible invoices, partner-finance packages, finance alerts
- Existing screens were extended only where the finance layer adds real value:
  - dashboard
  - owner-away dashboard
  - notifications
  - reports
  - receivables
  - payables
  - purchases
  - suppliers
  - invoices
  - settings
  - audit log

### New or upgraded V5 modules

- Payment collection tools
  - payment-request creation from unpaid invoices
  - share/reference history
  - reminder logging
  - request-to-payment linking
- Reconciliation layer
  - invoice-payment and supplier-payment reconciliation records
  - unreconciled, partial, reconciled, and mismatch states
  - reconciliation queue with manual review controls
- Financial health layer
  - readiness signals derived from receivables, payables, collections, reconciliation, expense pressure, and activity
  - clear strengths and improvement prompts
- Financing readiness views
  - readiness history
  - partner-pack generation
  - eligible invoice review list
- Supplier credit foundations
  - supplier credit terms
  - due soon and overdue obligation summaries
- Finance reporting and alerts
  - finance-aware dashboard panels
  - finance notifications merged into the main alert center
  - report summaries for collections, mismatches, supplier pressure, and readiness

### Future-safe growth path

- The V5 layer is structured so future partner-finance and enterprise phases can extend cleanly without rewriting V1-V4:
  - `FinanceTransaction` gives the schema a ledger-ready movement model without pretending a regulated wallet exists
  - `FinanceReadinessSnapshot` stores explainable scoring history rather than opaque risk decisions
  - `PartnerFinancePackage` creates a clean handoff boundary for future lender/partner integrations
  - `PaymentRequest` and `ReconciliationRecord` separate collection control from actual payment processing and bank automation
- The app remains honest about current capability:
  - no real-time gateway processing is claimed
  - no lending approval engine is claimed
  - no regulated wallet is claimed

## B. Database / Domain Model Updates

### Preserved core entities

- `User`
- `Workspace`
- `WorkspaceMember`
- `WorkspaceSetting`
- `Customer`
- `Supplier`
- `Item`
- `Quote`
- `QuoteLineItem`
- `Invoice`
- `InvoiceLineItem`
- `RecurringInvoiceTemplate`
- `RecurringInvoiceLineItem`
- `Payment`
- `Receipt`
- `Expense`
- `Purchase`
- `PurchaseLineItem`
- `PurchasePayment`
- `CashEntry`
- `Attachment`
- `AppNotification`
- `Activity`
- `AuditLog`
- V3 entities for branches, approvals, stock, projects, documents, templates, and operational alerts
- V4 entities for business profiles, connections, catalogs, purchase orders, RFQs, relationship activity, and network notifications

### New V5 enums

- `PaymentRequestStatus`
- `PaymentRequestHistoryAction`
- `ReconciliationKind`
- `ReconciliationStatus`
- `ReconciliationHistoryAction`
- `FinanceTransactionType`
- `FinanceTransactionDirection`
- `FinanceTransactionStatus`
- `ReadinessBand`
- `InvoiceCandidateStatus`
- `SupplierCreditStatus`
- `FinanceNotificationType`
- `PartnerPackageStatus`
- `PartnerPackageConsentMode`

### Extended existing enums

- `AttachmentEntityType`
  - now supports `payment_request`
- `AuditEntityType`
  - now supports `payment_request`
  - `reconciliation`
  - `finance_transaction`
  - `financing_profile`
  - `invoice_financing_candidate`
  - `supplier_credit`
  - `partner_package`
  - `finance_settings`
- `AuditAction`
  - now supports `reconciled`
  - `flagged`
  - `reminded`
  - `matched`
  - `exported`

### New V5 entities

- `PaymentRequest`
  - payment collection request linked to an invoice
  - stores request reference, share code, requested amount, status, expiry, and optional linked payment
- `PaymentRequestHistoryEntry`
  - timeline of request creation, reminders, linking, and paid state changes
- `ReconciliationRecord`
  - single reconciliation record for an invoice payment or supplier payment
  - stores matched amount, unmatched amount, reference value, status, reviewer, and timestamps
- `ReconciliationHistoryEntry`
  - explainable reconciliation event trail
- `FinanceTransaction`
  - ledger-ready transaction structure for inflows and outflows
  - links to invoice, payment, purchase, or purchase-payment context where relevant
- `FinanceReadinessSnapshot`
  - stores readiness-scoring history and signal breakdowns as explainable snapshots
- `InvoiceFinancingCandidate`
  - one financing-readiness record per invoice with score, readiness label, reasons, blockers, and selection state
- `SupplierCreditTerm`
  - supplier credit profile with credit days, reminder days, limit estimate, and pressure status
- `FinanceNotification`
  - finance-specific notifications separated from core and network alerts
- `PartnerFinancePackage`
  - prepared summary package for future partner/lender handoff with consent mode and included invoice IDs

### Key relationship additions

- `Workspace`
  - now owns `paymentRequests`, `reconciliations`, `financeTransactions`, `financeReadinessSnapshots`, `invoiceFinancingCandidates`, `supplierCreditTerms`, `financeNotifications`, and `partnerFinancePackages`
- `Invoice`
  - now links to `paymentRequests`, `reconciliationRecords`, `financeTransactions`, and optional `financingCandidate`
- `Payment`
  - now links to optional `reconciliationRecord`, `linkedPaymentRequests`, and `financeTransactions`
- `Purchase`
  - now links to `reconciliationRecords` and `financeTransactions`
- `PurchasePayment`
  - now links to optional `reconciliationRecord` and `financeTransactions`
- `Supplier`
  - now links to optional `supplierCreditTerm`
- `User`
  - now links to created payment requests, reconciled finance records, captured finance snapshots, and generated partner-finance packages

### Migration-ready notes

- The runtime is still local-first for demo speed, but the Prisma model is now ready for a server-backed finance-readiness phase.
- Reconciliation is intentionally explicit and reviewable rather than hidden in a fake automation layer.
- Partner-finance preparation is modeled as package generation and readiness tracking, not direct application disbursement.
- Finance transactions are structured as ledger-ready events, not a bank ledger or stored-value wallet claim.

## C. UI / Page Map Updates

### Preserved V1-V4 pages

- Auth, onboarding, dashboard, owner-away, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, cash flow, unpaid tracker, recurring invoices, notifications, team, branches, approvals, stock, projects, documents, reports, settings, audit log, network pages, legal, and support

### Added V5 finance pages

- `/app/finance`
- `/app/finance/collections`
- `/app/finance/collections/[requestId]`
- `/app/finance/reconciliation`
- `/app/finance/readiness`
- `/app/finance/eligible-invoices`
- `/app/finance/supplier-credit`

### Upgraded existing pages for V5 integration

- `/app/dashboard`
- `/app/owner-away`
- `/app/notifications`
- `/app/reports`
- `/app/receivables`
- `/app/payables`
- `/app/purchases`
- `/app/suppliers/[supplierId]`
- `/app/invoices/[invoiceId]`
- `/app/settings`
- `/app/audit-log`

## D. Implementation Priority Order

1. Preserve and stabilize V1-V4 flows.
2. Add payment collection and request tools.
3. Add reconciliation state and workflow support.
4. Add finance dashboard and financial-health panels.
5. Add explainable readiness-scoring foundations.
6. Add financing-readiness history and partner-pack views.
7. Add invoice-financing candidate review.
8. Add supplier-credit visibility and reminders.
9. Add partner/lender handoff-ready structures.
10. Add finance notifications and existing-module integrations.
11. Add finance-oriented report summaries and polish.
12. Run seed/demo, validation, and consistency checks.

## E. Actual Implementation Summary

### V5 runtime layer

- Added `lib/v5-types.ts`, `lib/v5-calculations.ts`, `lib/v5-storage.ts`, and `lib/v5-seed.ts`.
- Added `FlowV5Provider` as the finance-domain runtime overlay.
- Extended the access layer with finance permissions:
  - `view_finance`
  - `view_financing_readiness`
  - `manage_payment_requests`
  - `manage_reconciliation`
  - `manage_supplier_credit`
  - `manage_partner_exports`
- Extended audit/action typing for finance-sensitive events.

### V5 UI surfaces

- Added a finance dashboard with readiness, collection, mismatch, supplier-pressure, and partner-pack panels.
- Added collection tooling to create, view, remind, and link payment requests.
- Added a reconciliation queue for invoice payments and supplier payments.
- Added readiness history and partner-pack generation.
- Added eligible-invoice review and selection.
- Added supplier-credit configuration and obligation summaries.

### V5 integration into existing modules

- Dashboard and owner-away now surface finance-readiness and collection attention.
- Notifications merges finance alerts with core, operational, and network notifications.
- Reports include reconciliation, collection, supplier-credit, and readiness summaries.
- Invoice detail now shows:
  - reconciliation status
  - financing-readiness label
  - payment reconciliation badges
  - payment request creation and history
- Receivables now show collection pressure and invoice reconciliation visibility.
- Payables and purchases surface supplier-credit watch context.
- Supplier detail links directly into supplier-credit visibility.
- Settings includes finance quick links and resets V5 demo state with the broader app demo reset.
- Audit log now includes V5 finance entities and actions.

## F. Seed / Demo Support

- V5 demo data adds:
  - invoice payment requests in multiple states
  - reconciled, partial, unreconciled, and mismatch payment records
  - supplier-credit profiles with due-soon and overdue exposure
  - readiness history snapshots
  - eligible invoice selections
  - a generated partner-finance package
  - finance notifications
  - finance audit-log entries
- V1-V4 demo data remains preserved, so the app still opens with realistic operational, collaboration, network, and finance activity together.

## G. Assumptions / Notes

- The product still runs as a local-first demo/runtime layer in this workspace. Prisma/Postgres is the production target model, not the active persistence engine yet.
- Payment requests are collection references and workflow aids. They are not direct payment-gateway charges unless a future gateway integration is added.
- Reconciliation remains manual or semi-manual by design. No unsupported bank-feed automation is claimed.
- Readiness indicators are explainable operational signals, not bank-issued credit scores or guaranteed finance approvals.
- Partner-finance package generation is an internal readiness/export step, not a live lender marketplace.
- Wallet readiness is architectural only in V5 through finance transaction modeling and clean service boundaries, not a user-facing regulated wallet.

## H. Manual Test Checklist

- Sign in and confirm the existing dashboard still loads.
- Verify existing V1-V4 flows still work for onboarding, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, branches, approvals, stock, projects, documents, reports, notifications, settings, network flows, and legal pages.
- Open an unpaid invoice and create a payment request from the invoice detail screen.
- Open `/app/finance/collections` and create a payment request from the collections form.
- Open a collection request detail page and log a reminder.
- Record a payment on the source invoice and link it to the payment request.
- Open `/app/finance/reconciliation` and reconcile an invoice payment.
- Mark another reconciliation record as partial and then as mismatch.
- Confirm the reconciliation status on the invoice detail page updates correctly.
- Open `/app/receivables` and verify overdue/open request visibility.
- Open `/app/payables` and confirm supplier-credit pressure context appears.
- Open `/app/finance` and verify readiness, unreconciled count, eligible invoices, and finance movement panels.
- Open `/app/finance/readiness`, capture a readiness snapshot, and generate a partner-finance package.
- Open `/app/finance/eligible-invoices` and flag or unflag an invoice for financing review.
- Open `/app/finance/supplier-credit`, update a supplier term, and confirm obligation summaries remain visible.
- Open `/app/notifications` and verify finance notifications appear and can be marked read.
- Open `/app/reports` and confirm finance summaries render alongside the existing reports.
- Verify role-based access:
  - staff can see limited finance views where allowed
  - managers/admins/owners can access readiness and reconciliation
  - partner-package generation remains restricted
- Open `/app/audit-log` and confirm V5 finance actions are visible and filterable.
- Open `/app/settings`, `/legal/terms`, `/legal/privacy`, and `/support` and confirm they still render.

## I. Preservation Confirmation

- Authentication, onboarding, dashboard, customers, suppliers, items, quotations, invoices, payments, receipts, expenses, unpaid tracking, receivables, payables, purchases, roles/access, audit trails, owner-away dashboard, branches, approvals, inventory-lite, low-stock alerts, cash-flow forecasting, projects/jobs, documents/files, analytics/reports, notifications, settings, legal/info pages, business network profiles, supplier discovery, business connections, supplier catalogs, purchase order exchange, RFQ flows, reorder flows, shared relationship history, trust/reliability indicators, and demo readiness were preserved.
- V5 was implemented as a safe extension layer on top of the V1-V4 app rather than a rebuild.
- No working V1-V4 module was intentionally removed or replaced with an unnecessary breaking redesign.
