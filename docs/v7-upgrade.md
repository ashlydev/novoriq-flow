# Novoriq Flow V7 Upgrade

## A. V7 Architecture Update

### Safe extension approach

- V1-V6 remain intact through the existing provider stack:
  - `BusinessOSProvider`
  - `FlowV3Provider`
  - `FlowV4Provider`
  - `FlowV5Provider`
  - `FlowV6Provider`
- V7 adds `FlowV7Provider` as a separate intelligence overlay for:
  - grounded assistant sessions
  - rule-based automations and run history
  - explainable anomaly detection
  - recommendations and action tasks
  - predictive insight cards
  - AI-assisted draft generation
  - intelligence notifications and audit entries
- Core transactional logic is still owned by existing providers:
  - V1/V2 core operations remain the source of truth for customers, suppliers, items, quotes, invoices, payments, receipts, expenses, purchases, receivables, payables, settings, and auth
  - V3 remains the source for branches, approvals, stock-lite, projects, documents, and templates
  - V4 remains the source for network activity, supplier discovery, catalogs, POs, RFQs, and reorder history
  - V5 remains the source for collections, reconciliation, readiness, supplier-credit, and finance-readiness metrics
  - V6 remains the source for enterprise permissions, maker-checker reviews, departments, branch controls, exports, and enterprise oversight

### New or upgraded V7 modules

- Assistant / Copilot
  - role-aware, grounded business Q&A
  - answer history by session
  - hard facts, derived insights, follow-up prompts, and source links
- Workflow automation engine
  - simple rule records
  - preset templates
  - execution history
  - manual run support for demo/local-first mode
- Smart alerts and anomalies
  - expense spike alerts
  - collection slowdown alerts
  - overdue growth alerts
  - approval delay alerts
  - branch risk alerts
  - reconciliation mismatch alerts
- Recommendations layer
  - collections focus
  - supplier pressure follow-up
  - branch attention
  - approval bottleneck cleanup
  - stock and finance suggestions
- Action center
  - lightweight tasks from automation, anomalies, recommendations, and assistant flows
  - done, snooze, dismiss states
- Predictive insights
  - cash pressure outlook
  - overdue growth risk
  - approval backlog risk
  - branch attention risk
  - collection risk
  - supplier dependency pressure
- Explainability
  - every anomaly, recommendation, assistant answer, and predictive card includes explicit reasoning
- V7 notification and audit overlay
  - new intelligence notifications
  - automation and assistant actions merged into the audit trail

### Future growth path

- The V7 intelligence layer is modular and separate from transactional logic, so future LLM or partner integrations can plug in without rewriting core business flows.
- Assistant logic is currently rule-based and grounded for trust; it can later move behind an abstract provider without changing page contracts.
- Automation is intentionally narrow and explainable, which leaves room for future scheduled jobs, background workers, and usage-based feature rollout.
- Predictive cards are explicitly labeled as predictive and rule-derived, not opaque underwriting or autonomous decisioning.

## B. Database / Domain Model Updates

### Preserved core entities

- All V1-V6 entities remain preserved.
- No V1-V6 operational, network, finance, or enterprise entity was removed.

### New V7 enums

- `AssistantIntent`
- `AutomationTemplateKey`
- `AutomationTriggerType`
- `AutomationRunStatus`
- `AnomalyType`
- `AnomalyStatus`
- `RecommendationCategory`
- `RecommendationPriority`
- `TaskPriority`
- `TaskStatus`
- `DraftKind`
- `PredictiveInsightType`
- `SummaryScope`
- `IntelligenceNotificationType`
- `IntelligenceSensitivity`

### Extended existing enums

- `AuditEntityType`
  - now supports `assistant_session`
  - `automation_rule`
  - `automation_run`
  - `anomaly_event`
  - `recommendation`
  - `action_task`
  - `predictive_insight`
  - `intelligent_summary`
  - `assistant_draft`
  - `intelligence_settings`
  - `intelligence_notification`
- `AuditAction`
  - now supports `triggered`
  - `dismissed`
  - `snoozed`
  - `resolved`
  - `generated_draft`
  - `asked`
- `EnterpriseModuleKey`
  - now supports `intelligence`

### New V7 entities

- `AssistantSession`
- `AssistantInteraction`
- `AutomationRule`
- `AutomationRun`
- `AnomalyEvent`
- `RecommendationRecord`
- `ActionTask`
- `AssistantDraft`
- `PredictiveInsight`
- `IntelligentSummary`
- `IntelligenceNotification`
- `IntelligenceSetting`

### Key relationship additions

- `User`
  - now relates to assistant sessions
  - created automation rules
  - reviewed anomalies
  - assigned action tasks
  - created assistant drafts
  - updated intelligence settings
- `Workspace`
  - now owns assistant sessions, automation rules/runs, anomalies, recommendations, action tasks, assistant drafts, predictive insights, intelligent summaries, intelligence notifications, and intelligence settings

### Migration-ready notes

- The current runtime remains local-first for speed and demoability.
- The Prisma model is now ready for a server-backed intelligence layer with persisted sessions, automations, anomaly review state, and predictive records.
- V7 does not claim autonomous finance or approval execution.
- V7 does not introduce unsafe auto-send or auto-approve behavior.

## C. UI / Page Map Updates

### Added V7 pages

- `/app/assistant`
- `/app/actions`
- `/app/automations`
- `/app/anomalies`
- `/app/recommendations`
- `/app/predictive`

### Upgraded existing pages for V7 integration

- `/app/dashboard`
- `/app/control-center`
- `/app/executive`
- `/app/owner-away`
- `/app/finance`
- `/app/invoices/[invoiceId]`
- `/app/notifications`
- `/app/audit-log`
- `/app/admin`
- `/app/reports`
- `/app/settings`
- shared app shell/navigation

## D. Implementation Priority Order

1. Preserve and stabilize V1-V6 flows.
2. Add assistant/copilot foundation.
3. Add intelligent summaries.
4. Add automation engine and templates.
5. Add anomaly detection.
6. Add recommendations.
7. Add action center tasks.
8. Add AI-assisted drafting.
9. Add predictive insights.
10. Add explainability and role-aware filtering.
11. Integrate V7 into dashboards, notifications, audit, admin, and settings.
12. Extend schema and validate.

## E. Actual Implementation Summary

### V7 runtime layer

- Added:
  - `lib/v7-types.ts`
  - `lib/v7-calculations.ts`
  - `lib/v7-seed.ts`
  - `lib/v7-storage.ts`
  - `components/shared/flow-v7-provider.tsx`
- Extended `lib/access.ts` for V7 assistant, automation, anomaly, recommendation, action-center, predictive, and draft permissions.
- Extended `lib/types.ts` with V7 audit entities/actions and page routes.
- Extended `lib/v6-types.ts` and `lib/v6-seed.ts` so V6 permission profiles recognize the new intelligence module.
- Wrapped the app in `FlowV7Provider` in `app/layout.tsx`.

### V7 pages and UX

- Added a grounded assistant page.
- Added an action center.
- Added automations management with template-based creation.
- Added anomaly review page.
- Added recommendations page.
- Added predictive insights page.
- Added AI-assisted draft generation to invoice detail.

### V7 integration into existing surfaces

- Updated navigation and unread counts in the app shell.
- Added intelligence pulse panels to the dashboard.
- Added anomaly/action visibility to the control center.
- Added predictive and recommendation sections to the executive dashboard.
- Added predictive and recommendation support to the finance dashboard.
- Added owner-away intelligence summary panels.
- Merged intelligence notifications into the shared notifications page.
- Merged intelligence audit entries into the audit log page.
- Added intelligence controls and demo reset handling to settings.
- Added intelligence visibility to the admin console.
- Added summary/predictive/recommendation sections to reports.

## F. Seed / Demo Support

- Added seeded assistant sessions and interactions.
- Added seeded automation rules and automation runs.
- Added seeded action tasks.
- Added seeded assistant draft content.
- Added seeded intelligence notifications.
- Added seeded V7 audit entries.
- Added default intelligence settings.
- Derived anomalies, recommendations, summaries, and predictive insights from the live seeded business data so the app feels active on first load.

## G. Assumptions and Notes

- V7 is implemented as a grounded, rule-based intelligence layer in this workspace.
- No external LLM provider is required for the current implementation.
- Assistant answers, summaries, anomalies, and recommendations are based on real app data and existing calculations.
- Predictive insights are labeled predictive and are intentionally lightweight.
- Automation runs are manual/demo-triggered in local-first mode rather than background-job scheduled.
- Draft generation produces editable text only. It does not auto-send anything.

## H. Manual Test Checklist

1. Sign in with a demo account.
2. Verify V1-V6 flows still open and behave normally.
3. Open `/app/assistant` and ask:
   - `What invoices are overdue right now?`
   - `What suppliers need payment this week?`
   - `Summarize the last 7 days of business activity`
4. Verify the assistant answer includes source links, hard facts, and derived insight language.
5. Open `/app/automations` and create a rule from a template.
6. Run an automation manually and verify:
   - a new automation run appears
   - a notification appears
   - a task appears when relevant
7. Open `/app/anomalies` and verify anomaly cards explain why they were triggered.
8. Mark an anomaly reviewed and dismiss another; confirm state updates.
9. Open `/app/recommendations` and create a task from a recommendation.
10. Open `/app/actions` and verify open tasks, snooze, dismiss, and done actions.
11. Open an invoice detail page and generate:
   - overdue payment reminder draft
   - invoice cover note draft
12. Open `/app/predictive` and confirm predictive labeling is explicit.
13. Open `/app/notifications` and confirm intelligence notifications appear and can be marked read.
14. Open `/app/audit-log` and verify V7 audit entities/actions are filterable.
15. Open `/app/settings` and update intelligence settings.
16. Reset demo data from settings and confirm V7 demo data is restored.
17. Open legal and support pages to confirm they remain accessible.

## I. Preservation Confirmation

- V1 functionality preserved:
  - auth
  - onboarding
  - dashboard
  - customers
  - suppliers
  - items
  - quotes
  - invoices
  - payments
  - receipts
  - expenses
  - unpaid tracking
  - settings
  - legal/info pages
- V2 functionality preserved:
  - receivables
  - payables
  - partial payments
  - purchases
  - improved expenses
  - roles/access foundations
  - audit trail
  - owner-away dashboard
  - better reports
  - notifications upgrade
- V3 functionality preserved:
  - team/user collaboration
  - branches
  - approvals
  - inventory-lite
  - low-stock alerts
  - cash-flow forecasting
  - project/job costing
  - documents
  - advanced analytics
  - custom templates
- V4 functionality preserved:
  - business profiles
  - supplier discovery
  - business connections
  - supplier catalogs
  - PO exchange
  - RFQs
  - reorder flows
  - relationship history
  - trust indicators
- V5 functionality preserved:
  - payment requests
  - reconciliation
  - finance dashboard
  - readiness indicators
  - invoice financing readiness
  - supplier credit foundations
  - partner-finance readiness
- V6 functionality preserved:
  - advanced permissions
  - maker-checker
  - enterprise auditability
  - departments
  - branch controls
  - procurement controls
  - admin console
  - export center
  - enterprise notifications

No major V1-V6 workflow was removed or unnecessarily broken. V7 is layered on top as an intelligence and automation extension.
