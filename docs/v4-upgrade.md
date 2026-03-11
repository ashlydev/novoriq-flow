# Novoriq Flow V4 Upgrade

## A. V4 Architecture Update

### Safe extension approach

- V1, V2, and V3 remain in place through the existing `BusinessOSProvider` and `FlowV3Provider`.
- V4 adds a separate `FlowV4Provider` for network-domain state, calculations, actions, notifications, and seeded relationship data.
- Internal operations remain distinct from external network workflows:
  - Internal domain: customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, branches, approvals, stock, projects, documents, reports.
  - Network domain: business profiles, discovery, connections, supplier catalogs, purchase order exchange, RFQs, reorder flows, relationship history, trust indicators, network notifications.
- Existing V1-V3 screens were extended only where integration adds value:
  - dashboard
  - notifications
  - reports
  - suppliers
  - purchases
  - settings
  - audit log

### New or upgraded V4 modules

- Business network identity
  - public/private business profiles
  - discovery preferences
  - controlled profile visibility
- Supplier discovery and connections
  - searchable business directory
  - explicit connection requests and accepted relationships
  - bookmarks and preferred supplier behavior
- Supplier catalogs
  - reusable catalog publishing
  - visibility by public, connections-only, or private access
  - item reuse from existing internal items
- Purchase order exchange
  - outgoing and incoming digital POs
  - buyer/supplier views of the same order lifecycle
  - PO-to-internal-purchase bridge
- RFQ workflow
  - multi-supplier sourcing
  - supplier responses
  - side-by-side comparison
  - accepted response conversion into purchase ordering
- Reorder center
  - repeat from prior POs
  - repeat from prior purchases linked to network businesses
- Relationship history and trust
  - network activity timeline
  - factual trust indicators derived from platform behavior
- Network alerts and dashboards
  - network notifications
  - network dashboard cards and report summaries

### Future-safe growth path

- V4 keeps cross-business workflow logic separate from core workspace accounting logic so future finance and enterprise phases can extend cleanly.
- Cross-business records are designed around explicit business-profile relationships rather than collapsing everything into internal supplier records.
- The Prisma model now supports future additions such as:
  - verification badges
  - subscription-gated network features
  - deeper procurement controls
  - external portal access
  - finance and settlement layers

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
- V2/V3 entities for branches, approvals, stock, projects, documents, templates, operational alerts

### New V4 enums

- `NetworkVisibility`
- `BusinessOperatingStatus`
- `NetworkBusinessType`
- `ConnectionStatus`
- `ConnectionRole`
- `CatalogStatus`
- `CatalogAvailability`
- `PurchaseOrderStatus`
- `RFQStatus`
- `RFQRecipientStatus`
- `RFQResponseStatus`
- `RelationshipActivityType`
- `NetworkNotificationType`

### Extended existing enums

- `AttachmentEntityType`
  - now supports `purchase_order`, `rfq`, `business_profile`, `supplier_catalog`
- `AuditEntityType`
  - now supports `business_profile`, `business_connection`, `supplier_catalog`, `catalog_item`, `purchase_order`, `rfq`, `rfq_response`, `network_settings`
- `AuditAction`
  - now supports `sent`, `accepted`, `rejected`, `fulfilled`, `responded`, `connected`, `disconnected`, `bookmarked`
- `RecordEntityType`
  - now supports `purchase_order`, `rfq`

### New V4 entities

- `BusinessProfile`
  - one network identity per workspace
  - separates public/shared business identity from internal workspace data
- `NetworkPreference`
  - workspace-level discovery, connection, and sharing defaults
- `BusinessBookmark`
  - saved suppliers or buyers for repeat review
- `SupplierBusinessLink`
  - links internal supplier records to network businesses safely
- `BusinessConnection`
  - explicit supplier/buyer relationship record with pending/accepted/rejected/disconnected state
- `SupplierCatalog`
  - published supplier catalog with controlled visibility
- `SupplierCatalogItem`
  - catalog items optionally linked back to internal items
- `NetworkPurchaseOrder`
  - buyer-to-supplier digital PO record
- `NetworkPurchaseOrderLineItem`
  - PO line detail
- `NetworkPurchaseOrderHistoryEntry`
  - status timeline for each PO
- `NetworkRFQ`
  - request-for-quote record for supplier sourcing
- `NetworkRFQLineItem`
  - requested lines on an RFQ
- `NetworkRFQRecipient`
  - targeted supplier records per RFQ
- `NetworkRFQResponse`
  - submitted supplier response
- `NetworkRFQResponseLineItem`
  - quoted response lines
- `RelationshipActivity`
  - workspace-scoped relationship feed for counterparty history
- `NetworkNotification`
  - network-specific alert stream, separate from internal operational notifications
- `BusinessTrustMetric`
  - derived/cached trust snapshot for response and completion behavior

### Migration-ready notes

- The app still runs local-first for demo speed, but the Prisma model is now ready for a Postgres-backed network phase.
- Internal suppliers remain preserved; `SupplierBusinessLink` avoids forcing a breaking merge between legacy supplier data and new cross-business identity.
- Network POs and RFQs are separate from internal purchases so procurement and payables stay understandable.
- `NetworkPurchaseOrder.linkedPurchaseId` provides a clean bridge into the internal purchase/payables workflow.
- Trust indicators remain factual and platform-derived; no ratings or fake verification structures were added.

## C. UI / Page Map Updates

### Preserved V1-V3 pages

- Auth, onboarding, dashboard, owner-away, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, cash flow, unpaid tracker, recurring invoices, notifications, team, branches, approvals, stock, projects, documents, reports, settings, audit log, legal, support

### Added V4 network pages

- `/app/network`
- `/app/network/profile`
- `/app/network/businesses/[businessId]`
- `/app/network/connections`
- `/app/network/catalogs`
- `/app/network/catalogs/[catalogId]`
- `/app/network/orders`
- `/app/network/orders/[orderId]`
- `/app/network/rfqs`
- `/app/network/rfqs/[rfqId]`
- `/app/network/reorders`
- `/app/network/activity`

### Upgraded existing pages for V4 integration

- `/app/dashboard`
- `/app/notifications`
- `/app/reports`
- `/app/suppliers`
- `/app/suppliers/[supplierId]`
- `/app/purchases`
- `/app/settings`
- `/app/audit-log`

## D. Implementation Priority Order

1. Preserve and stabilize V1-V3 flows.
2. Add business network profiles.
3. Add supplier discovery and search.
4. Add controlled business connections.
5. Add supplier catalogs.
6. Add digital purchase order exchange.
7. Add RFQ workflow and supplier responses.
8. Add reorder flow.
9. Add relationship history and trust indicators.
10. Add network notifications and dashboard/report integrations.
11. Tighten search/filter behavior and consistency.
12. Run seed/demo, validation, and final polish passes.

## E. Actual Implementation Summary

### V4 runtime layer

- Added `lib/v4-types.ts`, `lib/v4-calculations.ts`, `lib/v4-storage.ts`, and `lib/v4-seed.ts`.
- Added `FlowV4Provider` as the network-domain runtime overlay.
- Added V4 permission flags to the access layer.
- Extended audit/action typing for network events.

### V4 UI surfaces

- Added discovery, profile, connections, catalogs, PO, RFQ, reorder, and activity routes.
- Added network actions and panels to the dashboard.
- Added network summaries to reports.
- Merged network alerts into notifications.
- Exposed supplier-to-network links from supplier screens.
- Added network settings links and demo reset behavior.
- Extended audit-log filtering for network entities and actions.

### V4 behavior and integration

- Auto-creates a current business network profile from the active workspace.
- Auto-builds an outbound catalog from existing workspace items.
- Maps known suppliers to matching network businesses where possible.
- Supports connection requests, connection responses, bookmarks, catalog publishing, PO exchange, RFQ response/acceptance, and repeat ordering.
- Keeps network notifications and relationship activity scoped to the active workspace context.

## F. Seed / Demo Support

- V4 demo data adds:
  - multiple external business profiles
  - accepted and pending connections
  - linked suppliers
  - visible supplier catalogs and catalog items
  - outgoing and incoming purchase orders
  - RFQs with multiple recipients and responses
  - reorder opportunities
  - network notifications
  - relationship activity feed
  - network audit history
- V1-V3 demo data remains preserved for internal operations and financial control flows.

## G. Assumptions / Notes

- The current workspace remains a local-first MVP runtime; Prisma/Postgres is the production target model, not the active persistence engine yet.
- Each real network business is modeled as a workspace-backed `BusinessProfile` in the production schema, even though the local demo seed simulates external businesses in client state.
- Shared history and trust indicators are intentionally factual and lightweight.
- External portal behavior is limited to structured shared workflows, not a full separate portal product.
- Catalogs are intentionally simpler than e-commerce storefronts.

## H. Manual Test Checklist

- Sign in and confirm the existing dashboard still loads.
- Verify existing V1-V3 flows still work for onboarding, customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, branches, approvals, stock, projects, documents, reports, notifications, settings, and legal pages.
- Open `/app/network/profile`, edit the business network profile, save it, and confirm the profile updates.
- Open `/app/network`, search for a supplier by name/category/location, and confirm discovery filters work.
- Open a business profile and send a connection request.
- Open connections and accept or reject a pending request.
- Open catalogs, publish or edit a supplier catalog, and add a catalog item.
- Open a visible supplier catalog and create a purchase order from a catalog item.
- Open the purchase order detail as the supplier-side participant and accept or reject it.
- Create an RFQ to one or more suppliers.
- Open the RFQ detail as a supplier-side participant and submit a response.
- Return as the requester, compare supplier responses, and accept one.
- Confirm the accepted RFQ creates a purchase order when conversion succeeds.
- Open reorder center and repeat an order from a prior PO or purchase.
- Open `/app/network/activity` and verify shared relationship history is visible.
- Open dashboard and reports and confirm network cards/summaries reflect the seeded activity.
- Open notifications and verify network alerts can be marked read.
- Verify role-based access for discovery, catalogs, connections, PO creation, and RFQs.
- Open audit log and confirm network actions are filterable and visible.
- Open settings and confirm network visibility/profile links remain accessible.
- Open legal and support pages and confirm they still render.

## I. Preservation Confirmation

- Authentication, onboarding, dashboard, customers, suppliers, items, quotations, invoices, payments, receipts, expenses, unpaid tracking, receivables, payables, purchases, roles/access, audit trails, owner-away dashboard, branches, approvals, inventory-lite, low-stock alerts, cash-flow forecasting, projects/jobs, documents/files, analytics/reports, notifications, settings, legal/info pages, and demo readiness were preserved.
- V4 was implemented as a safe extension layer on top of the V1-V3 app rather than a rebuild.
- No working V1-V3 module was intentionally removed or replaced with an unnecessary breaking redesign.
