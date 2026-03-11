# Novoriq Flow V3 Upgrade

## A. V3 Architecture Update

### Safe extension approach

- V1 and V2 flows remain intact in the existing `BusinessOSProvider`.
- V3 is layered on top through `FlowV3Provider`, which adds branches, approvals, stock visibility, projects, documents, template controls, and operational alerts without rewriting the older modules.
- Existing invoice, quote, payment, receipt, expense, purchase, receivable, payable, onboarding, auth, and settings flows stay on their established screens and state model.
- V3-specific context is isolated in `lib/v3-types.ts`, `lib/v3-calculations.ts`, `lib/v3-storage.ts`, and `lib/v3-seed.ts`.

### New or upgraded V3 modules

- Team collaboration
  - User management, invite flow, role reassignment, active/inactive states, department notes.
- Branch foundation
  - Branch records, branch switcher, branch-aware summaries, branch-linked operational data through V3 record metadata.
- Approvals
  - Pending/approved/rejected flow with history, approver identity, notes, and V3 alert generation.
- Inventory-lite
  - Optional item-level stock tracking, reorder levels, stock adjustments, low-stock/out-of-stock visibility.
- Cash-flow forecasting
  - Upcoming receivables, upcoming payables, projected net, branch-aware forecast widgets.
- Project / job costing
  - Project records, branch/customer linkage, revenue and cost linking, profitability snapshots.
- Documents vault
  - Workspace document storage, category tagging, branch/project/entity linking, search.
- Advanced analytics and owner-away control
  - More operational dashboards, branch performance, project profitability, stock pressure, approval pressure, cash-flow visibility.
- Template controls
  - Invoice, quote, and receipt template styles with workspace branding/footer controls.

### Future-safe growth path

- The V3 overlay keeps the current app stable while leaving room for future server-backed repositories, feature gating, subscriptions, richer branch logic, deeper approval chains, integrations, and network/finance phases.
- The Prisma model introduces the V2/V3 entities in a migration-ready way so the local MVP state can later move into PostgreSQL without rethinking the domain.

## B. Database / Domain Model Updates

### Core preserved entities

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
- `Payment`
- `Receipt`
- `Expense`
- `Purchase`
- `PurchaseLineItem`
- `PurchasePayment`
- `RecurringInvoiceTemplate`
- `RecurringInvoiceLineItem`
- `CashEntry`
- `Attachment`
- `AppNotification`
- `Activity`
- `AuditLog`

### New V3 entities

- `Branch`
  - Workspace-level branch/location record.
- `TeamInvite`
  - Tracks pending/accepted/revoked team invitations.
- `TeamMemberProfile`
  - Stores operational team metadata separate from auth membership.
- `ApprovalRequest`
  - Approval record for sensitive actions.
- `ApprovalHistoryEntry`
  - Immutable decision trail for each approval.
- `StockProfile`
  - Per-item stock tracking settings.
- `StockAdjustment`
  - Controlled stock increases/decreases with actor attribution.
- `ProjectJob`
  - Job or project used for profitability tracking.
- `RecordAssignment`
  - Branch/project assignment overlay used to extend older V1/V2 record structures safely.
- `VaultDocument`
  - Structured business documents vault.
- `TemplateSetting`
  - Branded quote/invoice/receipt presentation controls.
- `OperationalAlert`
  - Role-aware V3 operational alert records.

### Migration-ready notes

- The local demo runtime still uses additive `recordMeta` for V3 branch/project assignment so V1/V2 flows are preserved without invasive rewrites.
- The Prisma schema formalizes the V2/V3 entities and relationships for a real Postgres migration.
- Partial-payment correctness remains source-of-truth on `Invoice` + `Payment` and `Purchase` + `PurchasePayment`.
- Branch and project linkage is modeled through `RecordAssignment` to keep migration safe while older records remain stable.

## C. UI / Page Map Updates

### Preserved V1/V2 pages

- `/`
- `/signin`
- `/signup`
- `/forgot-password`
- `/legal/terms`
- `/legal/privacy`
- `/support`
- `/app/onboarding`
- `/app/dashboard`
- `/app/owner-away`
- `/app/customers`
- `/app/customers/[customerId]`
- `/app/suppliers`
- `/app/suppliers/[supplierId]`
- `/app/items`
- `/app/items/[itemId]`
- `/app/quotes`
- `/app/quotes/new`
- `/app/quotes/[quoteId]`
- `/app/invoices`
- `/app/invoices/new`
- `/app/invoices/[invoiceId]`
- `/app/receivables`
- `/app/payables`
- `/app/purchases`
- `/app/purchases/[purchaseId]`
- `/app/receipts`
- `/app/receipts/[receiptId]`
- `/app/expenses`
- `/app/expenses/[expenseId]`
- `/app/cash-flow`
- `/app/unpaid`
- `/app/reports`
- `/app/notifications`
- `/app/team`
- `/app/audit-log`
- `/app/settings`

### Added or materially upgraded in V3

- `/app/branches`
- `/app/branches/[branchId]`
- `/app/approvals`
- `/app/stock`
- `/app/projects`
- `/app/projects/[projectId]`
- `/app/documents`

### Upgraded V3 surfaces

- Dashboard
- Owner-away dashboard
- Team page
- Settings page
- Notifications page
- Reports page
- Quote detail
- Invoice detail
- Receipt detail
- Purchase detail
- Expense detail
- Item create/detail screens

## D. Implementation Priority Order

1. Preserve and stabilize V1/V2 base flows.
2. Add team collaboration upgrades.
3. Add branch foundation and branch selector.
4. Add approvals workflow.
5. Add inventory-lite and low-stock logic.
6. Add cash-flow forecasting.
7. Add project/job costing.
8. Add documents vault.
9. Upgrade analytics and owner-away visibility.
10. Upgrade template controls and notifications.
11. Tighten API/domain separation for future backend work.
12. Run seed, consistency, and final polish passes.

## E. Actual Implementation Summary

### V3 runtime layer

- Added `FlowV3Provider` to extend the preserved app with V3 state and actions.
- Added V3 local persistence and upgrade-safe seed/bootstrap logic.
- Added V3 calculations for branches, approvals, stock, forecasts, project profitability, and alerts.

### V3 pages and UX

- Added team invite and user management enhancements.
- Added branch list/detail management.
- Added approvals queue and decision flow.
- Added stock control and low-stock watchlist.
- Added project/job list/detail and record-linking flow.
- Added business documents vault.
- Upgraded dashboard, owner-away, reports, notifications, settings, quotes, invoices, receipts, expenses, purchases, and item flows for V3 visibility.

### Architecture readiness

- Updated permissions for new V3 areas.
- Updated app shell navigation and branch switching.
- Extended Prisma schema to include V2/V3 entities cleanly.

## F. Seed / Demo Support

- V3 demo seed adds:
  - multiple users and roles
  - active branches
  - pending team invite
  - approvals in multiple states
  - stock-enabled items with low-stock scenarios
  - branch/project-linked records
  - projects with profitability pressure
  - vault documents
  - operational alerts
- V1/V2 seed remains intact for invoices, quotes, payments, receipts, purchases, expenses, receivables, payables, notifications, and dashboard activity.

## G. Assumptions / Notes

- The current product still runs as a local-first demo application because no live backend/auth infrastructure was provisioned in the workspace.
- V3 preserves the existing V1/V2 provider and extends it rather than rewriting the state engine.
- Branch/project linkage is implemented safely through V3 metadata overlay in the client runtime.
- Template customization is intentionally controlled and simple; there is no drag-and-drop template builder in V3.
- Inventory remains intentionally lighter than ZimTill and is not a retail-grade stock engine.
- Forecasting is due-date based and clearly separated from actuals.

## H. Manual Test Checklist

- Sign in with a seeded role and confirm the dashboard loads.
- Verify existing V1/V2 flows still work for customers, suppliers, quotes, invoices, payments, receipts, expenses, receivables, payables, purchases, notifications, and settings.
- Invite a team user and confirm the invite appears in team management.
- Change a team member role and status and confirm the team list updates.
- Create a branch, edit it, and confirm it appears in the branch selector.
- Switch branch focus and confirm branch-aware summaries update.
- Create or edit an item with stock tracking enabled and confirm reorder settings persist.
- Record a stock adjustment and confirm the stock watchlist updates.
- Trigger a low-stock or out-of-stock scenario and confirm alerts surface on stock/dashboard/notifications.
- Create or confirm a purchase and verify supplier payable totals remain consistent.
- Open approvals, review a pending item, approve it, and confirm history and notifications update.
- Reject an approval and confirm the rejection state/history is visible.
- Create a project/job and confirm it appears in the project list.
- Link an invoice to a project and confirm project revenue/profitability changes.
- Link an expense or purchase to a project and confirm project cost/profitability changes.
- Upload a document and confirm it appears in the documents vault with branch/project/entity context.
- Open dashboard, owner-away, and reports and confirm V3 cards and analytics render consistently.
- Verify role-sensitive navigation and access restrictions for staff vs manager/admin/owner.
- Open audit log and confirm preserved audit data still renders.
- Change template settings and confirm quote/invoice/receipt detail pages reflect the selected styles.
- Open legal and support pages and confirm branding/content still renders.

## I. Preservation Confirmation

- Authentication, onboarding, dashboard, customers, suppliers, items, quotations, invoices, payments, receipts, expenses, unpaid tracking, receivables, payables, purchases, notifications, settings, legal/info pages, and seed/demo support were preserved.
- V3 was implemented as a safe extension layer on top of the V1/V2 app rather than a rebuild.
- No core V1/V2 module was intentionally removed or replaced with a breaking redesign.
