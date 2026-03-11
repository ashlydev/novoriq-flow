# Novoriq Flow V6 Upgrade

## A. V6 Architecture Update

### Safe extension approach

- V1-V5 remain intact through the existing provider stack:
  - `BusinessOSProvider`
  - `FlowV3Provider`
  - `FlowV4Provider`
  - `FlowV5Provider`
- V6 adds `FlowV6Provider` as a separate enterprise overlay for:
  - advanced permission profiles
  - departments and department assignments
  - maker-checker reviews
  - branch control settings
  - procurement policies
  - export jobs
  - enterprise notifications
  - executive summaries and audit overlays
- Existing operational, network, and finance domains stay separate:
  - operational domain: customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables
  - network domain: business profiles, discovery, connections, catalogs, POs, RFQs, reorder, relationship history
  - finance-readiness domain: payment requests, reconciliation, readiness, invoice candidates, supplier-credit visibility
  - enterprise domain: permissions, governance, departments, branch controls, executive summaries, exports, enterprise alerts

### New or upgraded V6 modules

- Advanced permissions
  - role-module permission profiles
  - action-level access by module
  - branch and department scope flags
  - sensitive-data visibility flags
- Maker-checker controls
  - dedicated review queue
  - submit, approve, reject, and return flows
  - history and reviewer traceability
- Advanced auditability
  - enterprise audit entries merged with existing audit streams
  - structured metadata for permission, review, department, branch-control, and export actions
- Branch governance
  - branch comparison page
  - branch risk/control settings
  - branch review pressure visibility
- Department structure
  - department records
  - department assignments
  - department summary panels
- Procurement controls
  - procurement threshold policies
  - procurement watchlist
  - purchase submission into maker-checker review
- Admin console
  - owner/admin control overview
  - links into permissions, departments, reviews, branches, and exports
- Export and integration center
  - report/export job creation
  - export status history
  - integration-readiness positioning
- Enterprise notifications
  - approval, branch risk, permission, procurement, and system admin alerts

### Future enterprise scale path

- V6 keeps enterprise control data separate from core transactions so future enterprise scaling can remain clean.
- Permission profiles are modeled as role-module records, which can later support:
  - feature gating
  - more granular custom permission sets
  - larger account structures
- Maker-checker reviews are modeled as a focused review layer, not a generic no-code workflow engine.
- Export jobs are modeled as readiness infrastructure for future:
  - scheduled reports
  - partner integrations
  - webhooks or API-facing delivery
- Departments and branch controls create a clean path toward larger organizational structures without turning Flow into HR or a full ERP.

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
- V3 branch, approval, stock, project, and document entities
- V4 network entities
- V5 finance entities

### New V6 enums

- `EnterpriseModuleKey`
- `PermissionAction`
- `ScopeAccess`
- `DepartmentStatus`
- `DepartmentMemberRole`
- `MakerCheckerEntityType`
- `MakerCheckerStatus`
- `MakerCheckerHistoryAction`
- `BranchRiskLevel`
- `ExportJobFormat`
- `ExportJobStatus`
- `EnterpriseNotificationType`

### Extended existing enums

- `AuditEntityType`
  - now supports `permission_profile`
  - `review_request`
  - `department`
  - `branch_control`
  - `control_policy`
  - `export_job`
  - `admin_console`
  - `enterprise_notification`
- `AuditAction`
  - now supports `assigned`
  - `returned`
  - `queued`
  - `downloaded`

### New V6 entities

- `PermissionProfile`
  - role + module permission record
  - stores actions, branch scope, department scope, and sensitive visibility
- `Department`
  - lightweight operational department structure
  - optional branch and manager linkage
- `DepartmentMembership`
  - assigns users/workspace members into departments with lead/member role
- `MakerCheckerReview`
  - focused maker-checker review record for sensitive actions
- `MakerCheckerReviewHistoryEntry`
  - review submission, approval, rejection, and return trail
- `ControlPolicy`
  - spend or workflow control policy for enterprise-sensitive areas
- `BranchControlSetting`
  - branch threshold, spend limit, and risk profile record
- `ExportJob`
  - export request/history model for enterprise reporting and future integrations
- `EnterpriseNotification`
  - enterprise-grade alert stream separate from core, operational, network, and finance alerts

### Key relationship additions

- `User`
  - now relates to updated permission profiles
  - managed departments
  - maker-checker review requests and decisions
  - control policy updates
  - branch control updates
  - export jobs
- `Workspace`
  - now owns permission profiles, departments, department memberships, maker-checker reviews, control policies, branch control settings, export jobs, and enterprise notifications
- `Branch`
  - now relates to departments, maker-checker reviews, branch control settings, and enterprise notifications
- `WorkspaceMember`
  - now supports department memberships

### Migration-ready notes

- The current app still runs local-first for demo speed, but the schema is now ready for server-backed enterprise governance.
- V6 does not replace the V3 approval model; it adds a parallel enterprise review layer for maker-checker use cases.
- Permission profiles are structured for future custom role/profile support without breaking the V1-V5 role foundation.
- Export jobs are modeled as internal business exports, not a public developer platform yet.

## C. UI / Page Map Updates

### Preserved V1-V5 pages

- Auth, onboarding, dashboard, owner-away, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, cash flow, unpaid tracker, recurring invoices, notifications, team, branches, approvals, stock, projects, documents, reports, settings, audit log, network pages, finance pages, legal, support

### Added V6 pages

- `/app/executive`
- `/app/control-center`
- `/app/branch-comparison`
- `/app/departments`
- `/app/permissions`
- `/app/reviews`
- `/app/procurement`
- `/app/admin`
- `/app/exports`

### Upgraded existing pages for V6 integration

- `/app/dashboard`
- `/app/owner-away`
- `/app/reports`
- `/app/notifications`
- `/app/approvals`
- `/app/audit-log`
- `/app/purchases`
- `/app/team`
- `/app/settings`
- shared app shell/navigation

## D. Implementation Priority Order

1. Preserve and stabilize V1-V5 flows.
2. Extend access control with enterprise-ready permission surfaces.
3. Add maker-checker controls and queue handling.
4. Extend audit visibility and metadata.
5. Add branch control settings and comparison views.
6. Add department structure and assignments.
7. Add procurement control policies and workflow submission.
8. Add admin console overview.
9. Add executive/control dashboards and analytics panels.
10. Add export center and integration-readiness surface.
11. Add enterprise notifications and tie them into the shared alert center.
12. Run seed/demo, validation, and final consistency checks.

## E. Actual Implementation Summary

### V6 runtime layer

- Added:
  - `lib/v6-types.ts`
  - `lib/v6-calculations.ts`
  - `lib/v6-seed.ts`
  - `lib/v6-storage.ts`
  - `components/shared/flow-v6-provider.tsx`
- Added advanced permission flags to `lib/access.ts`.
- Extended audit entity/action typing in `lib/types.ts`.
- Wrapped the app with `FlowV6Provider` in `app/layout.tsx`.

### V6 enterprise pages

- Added an executive dashboard.
- Added an operational control center.
- Added a branch comparison and branch-control page.
- Added department management and assignment page.
- Added permission management page.
- Added maker-checker queue page.
- Added procurement controls page.
- Added admin console.
- Added export center.

### V6 integration into existing surfaces

- App shell now exposes enterprise navigation and enterprise unread counts.
- Notifications merges enterprise alerts with core, operational, network, and finance notifications.
- Audit log now supports V6 entities/actions and search.
- Approvals page links into the maker-checker queue.
- Reports now include branch-control, department, and procurement watch summaries.
- Purchases page now surfaces procurement review pressure.
- Dashboard and owner-away now show enterprise risk indicators.
- Team page now links to departments and permissions and surfaces V6 department assignment context.
- Settings now links to enterprise control surfaces and resets V6 demo state.

## F. Seed / Demo Support

- V6 seed data adds:
  - permission profiles for all base roles
  - multiple departments and department memberships
  - branch control settings
  - procurement/finance/settings maker-checker records in different states
  - procurement control policies
  - export jobs
  - enterprise notifications
  - enterprise audit entries
- V1-V5 demo data remains preserved, so the product still opens with realistic operational, network, finance, and now enterprise-control activity.

## G. Assumptions / Notes

- The workspace still runs as a local-first runtime in this repo; Prisma/Postgres is the production target model.
- Advanced permissions are implemented as practical role-module profiles rather than a fully custom enterprise permission matrix.
- Maker-checker is implemented as a focused enterprise review queue, not a general workflow engine.
- Departments are operational grouping units only; V6 does not become a payroll or HR suite.
- Export center focuses on business exports and readiness, not a full external developer platform.
- Enterprise dashboards remain mobile-usable while offering more depth on wider screens.

## H. Manual Test Checklist

- Sign in and confirm the existing V1-V5 dashboard still loads.
- Verify existing V1-V5 flows still work for onboarding, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, branches, approvals, stock, projects, documents, reports, notifications, finance pages, network pages, settings, and legal pages.
- Open `/app/permissions`, switch role/module, change allowed actions, and save the permission profile.
- Open `/app/reviews`, submit a new maker-checker review request from an existing purchase or expense.
- Approve, reject, or return a pending review and confirm the status/history update.
- Open `/app/audit-log`, search for permission, review, department, export, or branch-control actions, and confirm entries render.
- Open `/app/branch-comparison`, inspect branch summaries, and update one branch control setting.
- Open `/app/departments`, create a department and assign a team member to it.
- Open `/app/procurement`, save a procurement control policy and submit a high-value purchase for review.
- Open `/app/admin`, verify control links, summary counts, and enterprise alerts.
- Open `/app/exports`, create an export job and confirm it appears in job history.
- Open `/app/notifications`, confirm enterprise alerts appear and can be marked read.
- Open `/app/executive`, `/app/control-center`, and `/app/reports` and verify enterprise summaries render.
- Verify role/access:
  - owner/admin can manage permissions
  - managers can access control/branch/procurement dashboards where expected
  - staff do not automatically gain admin-only controls
- Open `/app/settings`, `/legal/terms`, `/legal/privacy`, and `/support` and confirm they remain accessible.

## I. Preservation Confirmation

- Authentication, onboarding, dashboard, customers, suppliers, items, quotations, invoices, payments, receipts, expenses, unpaid tracking, receivables, payables, purchases, roles/access, audit trails, owner-away dashboard, branches, approvals, inventory-lite, low-stock alerts, cash-flow forecasting, projects/jobs, documents/files, analytics/reports, notifications, settings, legal/info pages, business network profiles, supplier discovery, business connections, supplier catalogs, purchase order exchange, RFQ flows, reorder flows, shared relationship history, trust/reliability indicators, payment collection/request tools, reconciliation, finance dashboard, readiness indicators, invoice financing readiness, supplier credit workflow foundations, partner/lender readiness structures, and demo readiness were preserved.
- V6 was implemented as a safe extension layer on top of V1-V5 rather than a rebuild.
- No working V1-V5 module was intentionally removed or replaced with an unnecessary breaking redesign.
