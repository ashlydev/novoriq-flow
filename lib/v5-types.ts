import { AuditLog, UserRole } from "@/lib/types";

export type PaymentRequestStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "paid"
  | "expired"
  | "cancelled";

export type PaymentRequestHistoryAction =
  | "created"
  | "shared"
  | "viewed"
  | "reminded"
  | "linked"
  | "paid"
  | "cancelled";

export type ReconciliationKind = "invoice_payment" | "supplier_payment";

export type ReconciliationStatus =
  | "unreconciled"
  | "reconciled"
  | "partial"
  | "mismatch";

export type ReconciliationHistoryAction =
  | "created"
  | "matched"
  | "reconciled"
  | "flagged"
  | "reopened";

export type FinanceTransactionType =
  | "invoice_collection"
  | "supplier_payment"
  | "expense_outflow"
  | "cash_in"
  | "cash_out";

export type FinanceTransactionDirection = "inflow" | "outflow";

export type ReadinessBand = "building" | "steady" | "strong";

export type HealthTone = "success" | "warning" | "danger" | "muted";

export type InvoiceCandidateStatus =
  | "strong_candidate"
  | "review"
  | "not_ready";

export type SupplierCreditStatus = "healthy" | "watch" | "pressure";

export type FinanceNotificationType =
  | "payment_request_created"
  | "payment_request_reminder"
  | "payment_request_paid"
  | "payment_received_pending_reconciliation"
  | "payment_reconciled"
  | "payment_mismatch_detected"
  | "invoice_unreconciled"
  | "overdue_receivable"
  | "overdue_payable"
  | "financing_readiness_changed"
  | "eligible_invoice_flagged"
  | "supplier_credit_due_soon"
  | "financial_health_warning";

export type PartnerPackageStatus = "draft" | "generated";

export interface PaymentRequestHistoryEntry {
  id: string;
  action: PaymentRequestHistoryAction;
  note?: string;
  paymentId?: string;
  actorUserId?: string;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  workspaceId: string;
  invoiceId: string;
  reference: string;
  shareCode: string;
  shareUrl: string;
  status: PaymentRequestStatus;
  amountRequested: number;
  currency: string;
  message?: string;
  expiresOn?: string;
  createdBy: string;
  linkedPaymentId?: string;
  lastReminderAt?: string;
  createdAt: string;
  updatedAt: string;
  history: PaymentRequestHistoryEntry[];
}

export interface ReconciliationHistoryEntry {
  id: string;
  action: ReconciliationHistoryAction;
  note?: string;
  actorUserId?: string;
  previousStatus?: ReconciliationStatus;
  nextStatus?: ReconciliationStatus;
  createdAt: string;
}

export interface ReconciliationRecord {
  id: string;
  workspaceId: string;
  kind: ReconciliationKind;
  paymentId?: string;
  purchasePaymentId?: string;
  invoiceId?: string;
  purchaseId?: string;
  status: ReconciliationStatus;
  matchedAmount: number;
  unmatchedAmount: number;
  referenceValue?: string;
  note?: string;
  reconciledBy?: string;
  reconciledAt?: string;
  lastEvaluatedAt: string;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  history: ReconciliationHistoryEntry[];
}

export interface FinanceLedgerEntry {
  id: string;
  workspaceId: string;
  sourceType: FinanceTransactionType;
  sourceId: string;
  direction: FinanceTransactionDirection;
  amount: number;
  occurredAt: string;
  label: string;
  description?: string;
  counterpartyName?: string;
  reference?: string;
  invoiceId?: string;
  purchaseId?: string;
  status: "posted" | "pending";
}

export interface ReadinessSignal {
  id: string;
  key: string;
  label: string;
  value: string;
  score: number;
  tone: HealthTone;
  explanation: string;
}

export interface FinancialHealthSnapshot {
  generatedAt: string;
  receivablesQualityScore: number;
  payablesPressureScore: number;
  collectionPerformanceScore: number;
  reconciliationCoverageScore: number;
  expensePressureScore: number;
  activityScore: number;
  capitalReadinessScore: number;
  readinessBand: ReadinessBand;
  cashPressureLabel: string;
  signals: ReadinessSignal[];
  strengths: string[];
  improvements: string[];
}

export interface ReadinessHistoryEntry {
  id: string;
  workspaceId: string;
  generatedAt: string;
  capitalReadinessScore: number;
  readinessBand: ReadinessBand;
  note?: string;
}

export interface InvoiceCandidateSelection {
  id: string;
  workspaceId: string;
  invoiceId: string;
  isSelected: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFinancingCandidate {
  invoiceId: string;
  reference: string;
  customerId: string;
  customerName: string;
  outstandingAmount: number;
  status: InvoiceCandidateStatus;
  score: number;
  reasons: string[];
  blockers: string[];
  selected: boolean;
  readinessLabel: string;
}

export interface SupplierCreditTerm {
  id: string;
  workspaceId: string;
  supplierId: string;
  creditDays: number;
  reminderDays: number;
  creditLimitEstimate?: number;
  status: SupplierCreditStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerFinancePackage {
  id: string;
  workspaceId: string;
  reference: string;
  status: PartnerPackageStatus;
  consentMode: "internal_only" | "partner_ready";
  includedInvoiceIds: string[];
  createdBy: string;
  summaryNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceNotification {
  id: string;
  workspaceId: string;
  type: FinanceNotificationType;
  title: string;
  message: string;
  href?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  visibleToRoles?: UserRole[];
  isRead: boolean;
  createdAt: string;
}

export interface FlowV5State {
  paymentRequests: PaymentRequest[];
  reconciliationRecords: ReconciliationRecord[];
  supplierCreditTerms: SupplierCreditTerm[];
  readinessHistory: ReadinessHistoryEntry[];
  invoiceCandidateSelections: InvoiceCandidateSelection[];
  partnerFinancePackages: PartnerFinancePackage[];
  financeNotifications: FinanceNotification[];
  financeAuditLogs: AuditLog[];
}
