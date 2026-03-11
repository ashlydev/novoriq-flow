export type UserRole = "owner" | "admin" | "manager" | "staff";

export type BusinessCategory =
  | "freelancer"
  | "agency"
  | "consulting"
  | "contractor"
  | "services"
  | "trading"
  | "wholesale";

export type CurrencyCode = "USD" | "ZAR" | "ZWG";

export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "mobile_money"
  | "card"
  | "other";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue";

export type PurchaseStatus =
  | "draft"
  | "confirmed"
  | "partial"
  | "paid"
  | "overdue";

export type RecurringFrequency = "weekly" | "monthly" | "quarterly";

export type NotificationType =
  | "invoice_due_soon"
  | "invoice_overdue"
  | "payment_received"
  | "invoice_paid"
  | "partial_payment_recorded"
  | "overdue_customer_balance"
  | "overdue_supplier_payable"
  | "expense_recorded"
  | "significant_expense"
  | "purchase_recorded"
  | "purchase_confirmed"
  | "suspicious_edit"
  | "recurring_invoice_due"
  | "onboarding"
  | "system";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export type CashEntryType = "cash_in" | "cash_out";

export type ItemKind = "service" | "product";

export type ExpenseCategory =
  | "rent"
  | "transport"
  | "utilities"
  | "subscriptions"
  | "supplies"
  | "marketing"
  | "salaries"
  | "operations"
  | "travel"
  | "fuel"
  | "meals"
  | "repairs"
  | "communications"
  | "misc";

export type ExpenseReviewState = "logged" | "flagged" | "approved";

export type AttachmentEntityType =
  | "invoice"
  | "expense"
  | "purchase"
  | "customer"
  | "supplier"
  | "payment_request";

export type AuditEntityType =
  | "invoice"
  | "payment"
  | "receipt"
  | "expense"
  | "purchase"
  | "purchase_payment"
  | "settings"
  | "customer"
  | "supplier"
  | "role"
  | "attachment"
  | "recurring_invoice"
  | "business_profile"
  | "business_connection"
  | "supplier_catalog"
  | "catalog_item"
  | "purchase_order"
  | "rfq"
  | "rfq_response"
  | "network_settings"
  | "payment_request"
  | "reconciliation"
  | "finance_transaction"
  | "financing_profile"
  | "invoice_financing_candidate"
  | "supplier_credit"
  | "partner_package"
  | "finance_settings"
  | "permission_profile"
  | "review_request"
  | "department"
  | "branch_control"
  | "control_policy"
  | "export_job"
  | "admin_console"
  | "enterprise_notification"
  | "assistant_session"
  | "automation_rule"
  | "automation_run"
  | "anomaly_event"
  | "recommendation"
  | "action_task"
  | "predictive_insight"
  | "intelligent_summary"
  | "assistant_draft"
  | "intelligence_settings"
  | "intelligence_notification";

export type AuditAction =
  | "created"
  | "edited"
  | "archived"
  | "deleted"
  | "recorded"
  | "reprinted"
  | "confirmed"
  | "role_changed"
  | "generated"
  | "uploaded"
  | "sent"
  | "accepted"
  | "rejected"
  | "fulfilled"
  | "responded"
  | "connected"
  | "disconnected"
  | "bookmarked"
  | "reconciled"
  | "flagged"
  | "reminded"
  | "matched"
  | "exported"
  | "assigned"
  | "returned"
  | "queued"
  | "downloaded"
  | "triggered"
  | "dismissed"
  | "snoozed"
  | "resolved"
  | "generated_draft"
  | "asked";

export type EntityRoute =
  | "/app/dashboard"
  | "/app/assistant"
  | "/app/actions"
  | "/app/automations"
  | "/app/anomalies"
  | "/app/recommendations"
  | "/app/predictive"
  | "/app/executive"
  | "/app/control-center"
  | "/app/branch-comparison"
  | "/app/departments"
  | "/app/permissions"
  | "/app/reviews"
  | "/app/procurement"
  | "/app/admin"
  | "/app/exports"
  | "/app/owner-away"
  | "/app/customers"
  | "/app/suppliers"
  | "/app/items"
  | "/app/quotes"
  | "/app/invoices"
  | "/app/recurring"
  | "/app/receivables"
  | "/app/payables"
  | "/app/purchases"
  | "/app/receipts"
  | "/app/expenses"
  | "/app/cash-flow"
  | "/app/unpaid"
  | "/app/reports"
  | "/app/notifications"
  | "/app/audit-log"
  | "/app/team"
  | "/app/settings"
  | "/app/finance"
  | "/app/finance/collections"
  | "/app/finance/reconciliation"
  | "/app/finance/readiness"
  | "/app/finance/eligible-invoices"
  | "/app/finance/supplier-credit";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  category: BusinessCategory;
  currency: CurrencyCode;
  phone?: string;
  email?: string;
  address?: string;
  logoDataUrl?: string;
  taxNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  createdAt: string;
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  attachmentIds?: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  attachmentIds?: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  workspaceId: string;
  name: string;
  kind: ItemKind;
  description?: string;
  sellingPrice: number;
  cost?: number;
  sku?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
}

export interface PurchaseLineItem {
  id: string;
  itemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
}

export interface Quote {
  id: string;
  workspaceId: string;
  customerId: string;
  reference: string;
  issueDate: string;
  expiryDate: string;
  status: QuoteStatus;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  convertedInvoiceId?: string;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  customerId: string;
  reference: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
  createdBy: string;
  linkedQuoteId?: string;
  recurringTemplateId?: string;
  attachmentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  workspaceId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  workspaceId: string;
  invoiceId: string;
  paymentId: string;
  reference: string;
  receiptDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  workspaceId: string;
  supplierId?: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  description: string;
  notes?: string;
  attachmentName?: string;
  attachmentIds?: string[];
  createdBy: string;
  reviewState: ExpenseReviewState;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  workspaceId: string;
  supplierId: string;
  reference: string;
  purchaseDate: string;
  dueDate: string;
  status: PurchaseStatus;
  lineItems: PurchaseLineItem[];
  notes?: string;
  attachmentIds?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePayment {
  id: string;
  workspaceId: string;
  purchaseId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface RecurringInvoiceTemplate {
  id: string;
  workspaceId: string;
  customerId: string;
  label: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextRunDate: string;
  dueInDays: number;
  isActive: boolean;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
  createdBy: string;
  generatedInvoiceIds: string[];
  lastGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashEntry {
  id: string;
  workspaceId: string;
  type: CashEntryType;
  category: string;
  amount: number;
  entryDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  workspaceId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href?: string;
  entityType?: AttachmentEntityType | "invoice" | "purchase" | "settings" | "receipt";
  entityId?: string;
  visibleToRoles?: UserRole[];
  isRead: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  href?: string;
  actorUserId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actorUserId: string;
  actorRole: UserRole;
  title: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface WorkspaceSettings {
  id: string;
  workspaceId: string;
  invoicePrefix: string;
  quotePrefix: string;
  receiptPrefix: string;
  purchasePrefix: string;
  dueSoonDays: number;
  defaultInvoiceDueDays: number;
  defaultPurchaseDueDays: number;
  significantExpenseThreshold: number;
  notificationsEnabled: boolean;
  paymentRemindersEnabled: boolean;
  brandAccent: string;
  termsSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  users: User[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  customers: Customer[];
  suppliers: Supplier[];
  items: Item[];
  quotes: Quote[];
  invoices: Invoice[];
  recurringInvoices: RecurringInvoiceTemplate[];
  payments: Payment[];
  receipts: Receipt[];
  expenses: Expense[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  cashEntries: CashEntry[];
  attachments: Attachment[];
  notifications: AppNotification[];
  activities: Activity[];
  auditLogs: AuditLog[];
  settings: WorkspaceSettings[];
}
