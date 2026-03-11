"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { hasAnyRole, hasPermission, Permission } from "@/lib/access";
import {
  addDays,
  createReference,
  formatDate,
  getCustomerOutstandingTotal,
  getDashboardMetrics,
  getInvoiceOutstanding,
  getInvoiceStatus,
  getNextRecurringRunDate,
  getOwnerAwayAttentionCount,
  getPaidAmount,
  getPayablesAging,
  getPurchaseOutstanding,
  getPurchaseStatus,
  getReceivablesAging,
  getSupplierPayableTotal,
  roundCurrency,
  sortByNewest
} from "@/lib/calculations";
import {
  demoCredentials,
  onboardingDefaults,
  seedAppState,
  upgradeAppState
} from "@/lib/seed";
import {
  loadStoredSession,
  loadStoredState,
  saveStoredSession,
  saveStoredState
} from "@/lib/storage";
import {
  AppNotification,
  AppState,
  Attachment,
  AttachmentEntityType,
  AuditAction,
  AuditEntityType,
  AuditLog,
  CashEntry,
  Customer,
  Expense,
  Invoice,
  InvoiceStatus,
  Item,
  LineItem,
  Payment,
  Purchase,
  PurchaseLineItem,
  PurchasePayment,
  PurchaseStatus,
  Quote,
  QuoteStatus,
  RecurringInvoiceTemplate,
  Supplier,
  User,
  UserRole,
  Workspace,
  WorkspaceMember,
  WorkspaceSettings
} from "@/lib/types";

interface AuthPayload {
  fullName: string;
  email: string;
  password: string;
}

interface SignInPayload {
  email: string;
  password: string;
}

interface OnboardingPayload {
  businessName: string;
  category: Workspace["category"];
  currency: Workspace["currency"];
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  logoDataUrl?: string;
  invoicePrefix: string;
  quotePrefix: string;
  receiptPrefix: string;
  purchasePrefix: string;
  dueSoonDays: number;
  defaultInvoiceDueDays: number;
  defaultPurchaseDueDays: number;
  significantExpenseThreshold: number;
  termsSnippet?: string;
  accentColor: string;
}

interface CustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface SupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface ItemPayload {
  name: string;
  kind: Item["kind"];
  description?: string;
  sellingPrice: number;
  cost?: number;
  sku?: string;
  category?: string;
  isActive: boolean;
}

interface ExpensePayload {
  supplierId?: string;
  category: Expense["category"];
  amount: number;
  expenseDate: string;
  description: string;
  notes?: string;
  attachmentName?: string;
}

interface CashEntryPayload {
  type: CashEntry["type"];
  category: string;
  amount: number;
  entryDate: string;
  notes?: string;
}

interface QuotePayload {
  customerId: string;
  issueDate: string;
  expiryDate: string;
  status: QuoteStatus;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
}

interface InvoicePayload {
  customerId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
  linkedQuoteId?: string;
}

interface PurchasePayload {
  supplierId: string;
  purchaseDate: string;
  dueDate: string;
  status: PurchaseStatus;
  lineItems: PurchaseLineItem[];
  notes?: string;
}

interface RecurringInvoicePayload {
  customerId: string;
  label: string;
  frequency: RecurringInvoiceTemplate["frequency"];
  startDate: string;
  nextRunDate: string;
  dueInDays: number;
  isActive: boolean;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
}

interface PaymentPayload {
  amount: number;
  paymentDate: string;
  method: Payment["method"];
  reference?: string;
  notes?: string;
}

interface AttachmentPayload {
  entityType: AttachmentEntityType;
  entityId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

interface ProfilePayload {
  fullName: string;
  email: string;
  phone?: string;
}

interface SettingsPayload {
  notificationsEnabled: boolean;
  paymentRemindersEnabled: boolean;
  dueSoonDays: number;
  invoicePrefix: string;
  quotePrefix: string;
  receiptPrefix: string;
  purchasePrefix: string;
  defaultInvoiceDueDays: number;
  defaultPurchaseDueDays: number;
  significantExpenseThreshold: number;
  termsSnippet?: string;
  brandAccent: string;
}

interface WorkspaceScopedData {
  customers: Customer[];
  suppliers: Supplier[];
  items: Item[];
  quotes: Quote[];
  invoices: Invoice[];
  recurringInvoices: RecurringInvoiceTemplate[];
  payments: Payment[];
  receipts: AppState["receipts"];
  expenses: Expense[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  cashEntries: CashEntry[];
  attachments: Attachment[];
  notifications: AppNotification[];
  activities: AppState["activities"];
  auditLogs: AuditLog[];
  settings?: WorkspaceSettings;
  teamMembers: Array<{ member: WorkspaceMember; user?: User }>;
}

interface BusinessOSContextValue {
  isHydrated: boolean;
  state: AppState;
  currentUser?: User;
  currentWorkspace?: Workspace;
  membership?: WorkspaceMember;
  currentRole?: UserRole;
  hasWorkspace: boolean;
  workspaceData: WorkspaceScopedData;
  dashboardMetrics: ReturnType<typeof getDashboardMetrics>;
  unreadNotificationsCount: number;
  outstandingByCustomer: Array<{ customer: Customer; amount: number }>;
  supplierPayables: Array<{ supplier: Supplier; amount: number }>;
  receivablesAging: ReturnType<typeof getReceivablesAging>;
  payablesAging: ReturnType<typeof getPayablesAging>;
  ownerAwayAttentionCount: number;
  signIn: (payload: SignInPayload) => Promise<{ success: boolean; message: string }>;
  signUp: (payload: AuthPayload) => Promise<{ success: boolean; message: string }>;
  signOut: () => void;
  canAccess: (permission: Permission) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  createWorkspaceFromOnboarding: (
    payload: OnboardingPayload
  ) => { success: boolean; message: string };
  updateProfile: (payload: ProfilePayload) => { success: boolean; message: string };
  updateWorkspace: (
    payload: Partial<OnboardingPayload>
  ) => { success: boolean; message: string };
  updateSettings: (
    payload: SettingsPayload
  ) => { success: boolean; message: string };
  changeMemberRole: (
    memberId: string,
    role: UserRole
  ) => { success: boolean; message: string };
  saveCustomer: (
    payload: CustomerPayload,
    customerId?: string
  ) => { success: boolean; message: string; id?: string };
  archiveCustomer: (customerId: string) => { success: boolean; message: string };
  saveSupplier: (
    payload: SupplierPayload,
    supplierId?: string
  ) => { success: boolean; message: string; id?: string };
  archiveSupplier: (supplierId: string) => { success: boolean; message: string };
  saveItem: (
    payload: ItemPayload,
    itemId?: string
  ) => { success: boolean; message: string; id?: string };
  archiveItem: (itemId: string) => { success: boolean; message: string };
  saveExpense: (
    payload: ExpensePayload,
    expenseId?: string
  ) => { success: boolean; message: string; id?: string };
  archiveExpense: (expenseId: string) => { success: boolean; message: string };
  saveCashEntry: (
    payload: CashEntryPayload
  ) => { success: boolean; message: string; id?: string };
  saveQuote: (
    payload: QuotePayload,
    quoteId?: string
  ) => { success: boolean; message: string; id?: string };
  updateQuoteStatus: (quoteId: string, status: QuoteStatus) => void;
  convertQuoteToInvoice: (
    quoteId: string
  ) => { success: boolean; message: string; id?: string };
  saveInvoice: (
    payload: InvoicePayload,
    invoiceId?: string
  ) => { success: boolean; message: string; id?: string };
  recordPayment: (
    invoiceId: string,
    payload: PaymentPayload
  ) => { success: boolean; message: string; receiptId?: string };
  logReceiptReprint: (receiptId: string) => void;
  savePurchase: (
    payload: PurchasePayload,
    purchaseId?: string
  ) => { success: boolean; message: string; id?: string };
  recordPurchasePayment: (
    purchaseId: string,
    payload: PaymentPayload
  ) => { success: boolean; message: string; id?: string };
  saveRecurringInvoice: (
    payload: RecurringInvoicePayload,
    recurringInvoiceId?: string
  ) => { success: boolean; message: string; id?: string };
  toggleRecurringInvoice: (
    recurringInvoiceId: string,
    isActive: boolean
  ) => { success: boolean; message: string };
  runRecurringInvoice: (
    recurringInvoiceId: string
  ) => { success: boolean; message: string; id?: string };
  addAttachment: (
    payload: AttachmentPayload
  ) => { success: boolean; message: string; id?: string };
  deleteAttachment: (attachmentId: string) => { success: boolean; message: string };
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoState: () => void;
}

const emptyMetrics = {
  totalInvoices: 0,
  totalInvoiced: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  totalExpenses: 0,
  totalPurchases: 0,
  totalPayables: 0,
  estimatedProfit: 0,
  overdueCount: 0,
  dueSoonCount: 0,
  overduePayablesCount: 0,
  dueSoonPayablesCount: 0,
  todayCollections: 0,
  todayExpenses: 0,
  todayOutgoingPayments: 0
};

const BusinessOSContext = createContext<BusinessOSContextValue | undefined>(
  undefined
);

function createId() {
  return crypto.randomUUID();
}

function createTimestamp() {
  return new Date().toISOString();
}

async function hashString(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((valuePart) => valuePart.toString(16).padStart(2, "0"))
    .join("");
}

function getMembership(state: AppState, userId: string | null) {
  if (!userId) {
    return undefined;
  }

  return state.workspaceMembers.find((member) => member.userId === userId);
}

function withWorkspace<T extends { workspaceId: string; createdAt: string }>(
  records: T[],
  workspaceId?: string
) {
  if (!workspaceId) {
    return [];
  }

  return sortByNewest(records.filter((record) => record.workspaceId === workspaceId));
}

function buildWorkspaceData(
  state: AppState,
  workspaceId?: string,
  currentRole?: UserRole
): WorkspaceScopedData {
  const settings = state.settings.find((setting) => setting.workspaceId === workspaceId);
  return {
    customers: withWorkspace(state.customers, workspaceId).filter(
      (customer) => !customer.isArchived
    ),
    suppliers: withWorkspace(state.suppliers, workspaceId).filter(
      (supplier) => !supplier.isArchived
    ),
    items: withWorkspace(state.items, workspaceId),
    quotes: withWorkspace(state.quotes, workspaceId),
    invoices: withWorkspace(state.invoices, workspaceId),
    recurringInvoices: withWorkspace(state.recurringInvoices, workspaceId),
    payments: withWorkspace(state.payments, workspaceId),
    receipts: withWorkspace(state.receipts, workspaceId),
    expenses: withWorkspace(state.expenses, workspaceId).filter(
      (expense) => !expense.isArchived
    ),
    purchases: withWorkspace(state.purchases, workspaceId),
    purchasePayments: withWorkspace(state.purchasePayments, workspaceId),
    cashEntries: withWorkspace(state.cashEntries, workspaceId),
    attachments: withWorkspace(state.attachments, workspaceId),
    notifications: withWorkspace(state.notifications, workspaceId).filter(
      (notification) =>
        !notification.visibleToRoles ||
        !currentRole ||
        notification.visibleToRoles.includes(currentRole)
    ),
    activities: withWorkspace(state.activities, workspaceId),
    auditLogs: withWorkspace(state.auditLogs, workspaceId),
    settings,
    teamMembers: withWorkspace(state.workspaceMembers, workspaceId).map((member) => ({
      member,
      user: state.users.find((user) => user.id === member.userId)
    }))
  };
}

function createNotificationRecord(params: {
  workspaceId: string;
  type: AppNotification["type"];
  severity: AppNotification["severity"];
  title: string;
  message: string;
  href?: string;
  entityType?: AppNotification["entityType"];
  entityId?: string;
  visibleToRoles?: UserRole[];
}): AppNotification {
  return {
    id: createId(),
    workspaceId: params.workspaceId,
    type: params.type,
    severity: params.severity,
    title: params.title,
    message: params.message,
    href: params.href,
    entityType: params.entityType,
    entityId: params.entityId,
    visibleToRoles: params.visibleToRoles,
    isRead: false,
    createdAt: createTimestamp()
  };
}

function createActivityRecord(params: {
  workspaceId: string;
  title: string;
  description: string;
  href?: string;
  actorUserId?: string;
}) {
  return {
    id: createId(),
    workspaceId: params.workspaceId,
    title: params.title,
    description: params.description,
    href: params.href,
    actorUserId: params.actorUserId,
    createdAt: createTimestamp()
  };
}

function createAuditLogRecord(params: {
  workspaceId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actorUserId: string;
  actorRole: UserRole;
  title: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return {
    id: createId(),
    workspaceId: params.workspaceId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    title: params.title,
    summary: params.summary,
    metadata: params.metadata,
    createdAt: createTimestamp()
  };
}

function appendArtifacts(
  state: AppState,
  artifacts: {
    activities?: AppState["activities"];
    notifications?: AppNotification[];
    auditLogs?: AuditLog[];
  }
) {
  return {
    ...state,
    activities: artifacts.activities
      ? [...artifacts.activities, ...state.activities]
      : state.activities,
    notifications: artifacts.notifications
      ? [...artifacts.notifications, ...state.notifications]
      : state.notifications,
    auditLogs: artifacts.auditLogs
      ? [...artifacts.auditLogs, ...state.auditLogs]
      : state.auditLogs
  };
}

function ensureMinimumLineItems(lineItems: LineItem[]) {
  return lineItems.filter(
    (lineItem) => lineItem.name.trim() && lineItem.quantity > 0 && lineItem.unitPrice >= 0
  );
}

function ensureMinimumPurchaseLineItems(lineItems: PurchaseLineItem[]) {
  return lineItems.filter(
    (lineItem) => lineItem.name.trim() && lineItem.quantity > 0 && lineItem.unitCost >= 0
  );
}

function requireWorkspaceContext(
  userId: string | null,
  membership?: WorkspaceMember,
  currentRole?: UserRole
) {
  if (!userId || !membership || !currentRole) {
    return { ok: false as const, message: "Finish sign in and onboarding first." };
  }

  return {
    ok: true as const,
    workspaceId: membership.workspaceId,
    userId,
    role: currentRole
  };
}

function ensurePermission(
  role: UserRole | undefined,
  permission: Permission,
  message = "You do not have permission for this action."
) {
  if (!hasPermission(role, permission)) {
    return { ok: false as const, message };
  }

  return { ok: true as const };
}

function updateEntityAttachmentIds(
  state: AppState,
  entityType: AttachmentEntityType,
  entityId: string,
  attachmentId: string,
  mode: "add" | "remove"
) {
  const mutateIds = (ids?: string[]) => {
    const currentIds = ids || [];
    if (mode === "add") {
      return currentIds.includes(attachmentId)
        ? currentIds
        : [...currentIds, attachmentId];
    }

    return currentIds.filter((recordId) => recordId !== attachmentId);
  };

  if (entityType === "customer") {
    return {
      ...state,
      customers: state.customers.map((customer) =>
        customer.id === entityId
          ? { ...customer, attachmentIds: mutateIds(customer.attachmentIds) }
          : customer
      )
    };
  }

  if (entityType === "supplier") {
    return {
      ...state,
      suppliers: state.suppliers.map((supplier) =>
        supplier.id === entityId
          ? { ...supplier, attachmentIds: mutateIds(supplier.attachmentIds) }
          : supplier
      )
    };
  }

  if (entityType === "invoice") {
    return {
      ...state,
      invoices: state.invoices.map((invoice) =>
        invoice.id === entityId
          ? { ...invoice, attachmentIds: mutateIds(invoice.attachmentIds) }
          : invoice
      )
    };
  }

  if (entityType === "expense") {
    return {
      ...state,
      expenses: state.expenses.map((expense) =>
        expense.id === entityId
          ? { ...expense, attachmentIds: mutateIds(expense.attachmentIds) }
          : expense
      )
    };
  }

  return {
    ...state,
    purchases: state.purchases.map((purchase) =>
      purchase.id === entityId
        ? { ...purchase, attachmentIds: mutateIds(purchase.attachmentIds) }
        : purchase
    )
  };
}

function buildTeamMembers(state: AppState, workspaceId?: string) {
  return withWorkspace(state.workspaceMembers, workspaceId).map((member) => ({
    member,
    user: state.users.find((user) => user.id === member.userId)
  }));
}

export function BusinessOSProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedAppState);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedState = loadStoredState();
    const storedSession = loadStoredSession();

    if (storedState) {
      setState(upgradeAppState(storedState));
    }

    setCurrentUserId(storedSession.currentUserId);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveStoredState(state);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveStoredSession({ currentUserId });
  }, [currentUserId, isHydrated]);

  const currentUser = state.users.find((user) => user.id === currentUserId);
  const membership = getMembership(state, currentUserId);
  const currentWorkspace = membership
    ? state.workspaces.find((workspace) => workspace.id === membership.workspaceId)
    : undefined;
  const currentRole = membership?.role || currentUser?.role;
  const workspaceData = buildWorkspaceData(state, membership?.workspaceId, currentRole);
  const dashboardMetrics = membership
    ? getDashboardMetrics({
        invoices: workspaceData.invoices,
        payments: workspaceData.payments,
        expenses: workspaceData.expenses,
        dueSoonDays: workspaceData.settings?.dueSoonDays ?? onboardingDefaults.dueSoonDays,
        purchases: workspaceData.purchases,
        purchasePayments: workspaceData.purchasePayments,
        cashEntries: workspaceData.cashEntries
      })
    : emptyMetrics;
  const receivablesAging = getReceivablesAging(
    workspaceData.invoices,
    workspaceData.payments
  );
  const payablesAging = getPayablesAging(
    workspaceData.purchases,
    workspaceData.purchasePayments
  );
  const ownerAwayAttentionCount = getOwnerAwayAttentionCount({
    invoices: workspaceData.invoices,
    payments: workspaceData.payments,
    purchases: workspaceData.purchases,
    purchasePayments: workspaceData.purchasePayments,
    dueSoonDays: workspaceData.settings?.dueSoonDays || 7
  });
  const unreadNotificationsCount = workspaceData.notifications.filter(
    (notification) => !notification.isRead
  ).length;
  const outstandingByCustomer = workspaceData.customers
    .map((customer) => ({
      customer,
      amount: getCustomerOutstandingTotal(
        customer.id,
        workspaceData.invoices,
        workspaceData.payments
      )
    }))
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount);
  const supplierPayables = workspaceData.suppliers
    .map((supplier) => ({
      supplier,
      amount: getSupplierPayableTotal(
        supplier.id,
        workspaceData.purchases,
        workspaceData.purchasePayments
      )
    }))
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount);

  const canAccess = (permission: Permission) => hasPermission(currentRole, permission);
  const hasRole = (roles: UserRole[]) => hasAnyRole(currentRole, roles);

  const signIn = async (payload: SignInPayload) => {
    const email = payload.email.trim().toLowerCase();
    const user = state.users.find((record) => record.email.toLowerCase() === email);

    if (!user) {
      return { success: false, message: "No account matches that email." };
    }

    const passwordHash = await hashString(payload.password);
    if (passwordHash !== user.passwordHash) {
      return { success: false, message: "Incorrect email or password." };
    }

    setCurrentUserId(user.id);

    const friendlyDemoMessage =
      user.email === demoCredentials.email
        ? "Owner demo ready."
        : `${user.role[0].toUpperCase()}${user.role.slice(1)} demo ready.`;

    return {
      success: true,
      message: getMembership(state, user.id)
        ? friendlyDemoMessage
        : "Account ready. Finish your business setup."
    };
  };

  const signUp = async (payload: AuthPayload) => {
    const email = payload.email.trim().toLowerCase();
    if (state.users.some((user) => user.email.toLowerCase() === email)) {
      return { success: false, message: "That email is already in use." };
    }

    const timestamp = createTimestamp();
    const newUser: User = {
      id: createId(),
      fullName: payload.fullName.trim(),
      email,
      role: "owner",
      passwordHash: await hashString(payload.password),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    setState((current) => ({ ...current, users: [newUser, ...current.users] }));
    setCurrentUserId(newUser.id);

    return {
      success: true,
      message: "Account created. Let’s set up your workspace."
    };
  };

  const signOut = () => {
    setCurrentUserId(null);
  };

  const createWorkspaceFromOnboarding = (payload: OnboardingPayload) => {
    if (membership) {
      return { success: false, message: "This account already has a workspace." };
    }

    if (!currentUserId) {
      return { success: false, message: "Sign in before starting onboarding." };
    }

    const timestamp = createTimestamp();
    const workspaceId = createId();
    const workspace: Workspace = {
      id: workspaceId,
      name: payload.businessName.trim(),
      category: payload.category,
      currency: payload.currency,
      phone: payload.phone?.trim(),
      email: payload.email?.trim(),
      address: payload.address?.trim(),
      taxNumber: payload.taxNumber?.trim(),
      logoDataUrl: payload.logoDataUrl,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const member: WorkspaceMember = {
      id: createId(),
      workspaceId,
      userId: currentUserId,
      role: "owner",
      createdAt: timestamp
    };
    const settings: WorkspaceSettings = {
      id: createId(),
      workspaceId,
      invoicePrefix: payload.invoicePrefix.trim() || "INV",
      quotePrefix: payload.quotePrefix.trim() || "Q",
      receiptPrefix: payload.receiptPrefix.trim() || "RCPT",
      purchasePrefix: payload.purchasePrefix.trim() || "PUR",
      dueSoonDays: payload.dueSoonDays,
      defaultInvoiceDueDays: payload.defaultInvoiceDueDays,
      defaultPurchaseDueDays: payload.defaultPurchaseDueDays,
      significantExpenseThreshold: payload.significantExpenseThreshold,
      notificationsEnabled: true,
      paymentRemindersEnabled: true,
      brandAccent: payload.accentColor || "#c9a95a",
      termsSnippet: payload.termsSnippet?.trim(),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          workspaces: [workspace, ...current.workspaces],
          workspaceMembers: [member, ...current.workspaceMembers],
          settings: [settings, ...current.settings]
        },
        {
          activities: [
            createActivityRecord({
              workspaceId,
              title: "Workspace created",
              description: `${workspace.name} is ready for setup.`,
              href: "/app/dashboard",
              actorUserId: currentUserId
            })
          ],
          notifications: [
            createNotificationRecord({
              workspaceId,
              type: "onboarding",
              severity: "success",
              title: "Workspace setup complete",
              message: "Your workspace is ready. Start by creating a customer or invoice.",
              href: "/app/dashboard",
              visibleToRoles: ["owner", "admin", "manager", "staff"]
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId,
              entityType: "settings",
              entityId: settings.id,
              action: "created",
              actorUserId: currentUserId,
              actorRole: "owner",
              title: "Workspace onboarded",
              summary: `${workspace.name} was created with initial settings.`,
              metadata: { currency: workspace.currency, businessName: workspace.name }
            })
          ]
        }
      )
    );

    return { success: true, message: "Workspace created." };
  };

  const updateProfile = (payload: ProfilePayload) => {
    if (!currentUserId) {
      return { success: false, message: "No active user." };
    }

    const timestamp = createTimestamp();
    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUserId
          ? {
              ...user,
              fullName: payload.fullName.trim(),
              email: payload.email.trim(),
              phone: payload.phone?.trim(),
              updatedAt: timestamp
            }
          : user
      )
    }));

    return { success: true, message: "Profile updated." };
  };

  const updateWorkspace = (payload: Partial<OnboardingPayload>) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_settings");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const timestamp = createTimestamp();
    setState((current) =>
      appendArtifacts(
        {
          ...current,
          workspaces: current.workspaces.map((workspace) =>
            workspace.id === context.workspaceId
              ? {
                  ...workspace,
                  name: payload.businessName?.trim() ?? workspace.name,
                  category: payload.category ?? workspace.category,
                  currency: payload.currency ?? workspace.currency,
                  phone: payload.phone?.trim() ?? workspace.phone,
                  email: payload.email?.trim() ?? workspace.email,
                  address: payload.address?.trim() ?? workspace.address,
                  taxNumber: payload.taxNumber?.trim() ?? workspace.taxNumber,
                  logoDataUrl: payload.logoDataUrl ?? workspace.logoDataUrl,
                  updatedAt: timestamp
                }
              : workspace
          )
        },
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "settings",
              entityId: context.workspaceId,
              action: "edited",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Business settings updated",
              summary: "Business profile details were updated.",
              metadata: { businessName: payload.businessName ?? null }
            })
          ]
        }
      )
    );

    return { success: true, message: "Business settings saved." };
  };

  const updateSettings = (payload: SettingsPayload) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_settings");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const timestamp = createTimestamp();
    setState((current) =>
      appendArtifacts(
        {
          ...current,
          settings: current.settings.map((setting) =>
            setting.workspaceId === context.workspaceId
              ? {
                  ...setting,
                  notificationsEnabled: payload.notificationsEnabled,
                  paymentRemindersEnabled: payload.paymentRemindersEnabled,
                  dueSoonDays: payload.dueSoonDays,
                  invoicePrefix: payload.invoicePrefix.trim(),
                  quotePrefix: payload.quotePrefix.trim(),
                  receiptPrefix: payload.receiptPrefix.trim(),
                  purchasePrefix: payload.purchasePrefix.trim(),
                  defaultInvoiceDueDays: payload.defaultInvoiceDueDays,
                  defaultPurchaseDueDays: payload.defaultPurchaseDueDays,
                  significantExpenseThreshold: payload.significantExpenseThreshold,
                  termsSnippet: payload.termsSnippet?.trim(),
                  brandAccent: payload.brandAccent,
                  updatedAt: timestamp
                }
              : setting
          )
        },
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "settings",
              entityId: context.workspaceId,
              action: "edited",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Preferences updated",
              summary: "Document, alert, and threshold settings changed.",
              metadata: {
                dueSoonDays: payload.dueSoonDays,
                significantExpenseThreshold: payload.significantExpenseThreshold
              }
            })
          ]
        }
      )
    );

    return { success: true, message: "Preferences updated." };
  };

  const changeMemberRole = (memberId: string, role: UserRole) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_roles");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const member = state.workspaceMembers.find((record) => record.id === memberId);
    if (!member) {
      return { success: false, message: "Team member not found." };
    }

    const user = state.users.find((record) => record.id === member.userId);
    setState((current) =>
      appendArtifacts(
        {
          ...current,
          workspaceMembers: current.workspaceMembers.map((record) =>
            record.id === memberId ? { ...record, role } : record
          ),
          users: current.users.map((record) =>
            record.id === member.userId ? { ...record, role } : record
          )
        },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: "Role updated",
              description: `${user?.fullName || "A user"} is now ${role}.`,
              href: "/app/team",
              actorUserId: context.userId
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "role",
              entityId: memberId,
              action: "role_changed",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Role changed",
              summary: `${user?.fullName || "Workspace member"} role changed to ${role}.`,
              metadata: { role }
            })
          ]
        }
      )
    );

    return { success: true, message: "Role updated." };
  };

  const saveCustomer = (payload: CustomerPayload, customerId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    if (!payload.name.trim()) {
      return { success: false, message: "Customer name is required." };
    }

    const existing = state.customers.find((record) => record.id === customerId);
    const timestamp = createTimestamp();
    const customer: Customer = {
      id: customerId ?? createId(),
      workspaceId: context.workspaceId,
      name: payload.name.trim(),
      email: payload.email?.trim(),
      phone: payload.phone?.trim(),
      address: payload.address?.trim(),
      notes: payload.notes?.trim(),
      attachmentIds: existing?.attachmentIds || [],
      isArchived: false,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        customerId
          ? {
              ...current,
              customers: current.customers.map((record) =>
                record.id === customerId ? customer : record
              )
            }
          : { ...current, customers: [customer, ...current.customers] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: customerId ? "Customer updated" : "Customer added",
              description: `${customer.name} is now in your customer list.`,
              href: `/app/customers/${customer.id}`,
              actorUserId: context.userId
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "customer",
              entityId: customer.id,
              action: customerId ? "edited" : "created",
              actorUserId: context.userId,
              actorRole: context.role,
              title: customerId ? "Customer updated" : "Customer created",
              summary: `${customer.name} record was ${customerId ? "updated" : "created"}.`,
              metadata: { customerName: customer.name }
            })
          ]
        }
      )
    );

    return { success: true, message: "Customer saved.", id: customer.id };
  };

  const archiveCustomer = (customerId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          customers: current.customers.map((customer) =>
            customer.id === customerId ? { ...customer, isArchived: true } : customer
          )
        },
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "customer",
              entityId: customerId,
              action: "archived",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Customer archived",
              summary: "Customer record was archived."
            })
          ]
        }
      )
    );

    return { success: true, message: "Customer archived." };
  };

  const saveSupplier = (payload: SupplierPayload, supplierId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    if (!payload.name.trim()) {
      return { success: false, message: "Supplier name is required." };
    }

    const existing = state.suppliers.find((record) => record.id === supplierId);
    const timestamp = createTimestamp();
    const supplier: Supplier = {
      id: supplierId ?? createId(),
      workspaceId: context.workspaceId,
      name: payload.name.trim(),
      email: payload.email?.trim(),
      phone: payload.phone?.trim(),
      address: payload.address?.trim(),
      notes: payload.notes?.trim(),
      attachmentIds: existing?.attachmentIds || [],
      isArchived: false,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        supplierId
          ? {
              ...current,
              suppliers: current.suppliers.map((record) =>
                record.id === supplierId ? supplier : record
              )
            }
          : { ...current, suppliers: [supplier, ...current.suppliers] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: supplierId ? "Supplier updated" : "Supplier added",
              description: `${supplier.name} can now be linked to purchases and expenses.`,
              href: `/app/suppliers/${supplier.id}`,
              actorUserId: context.userId
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "supplier",
              entityId: supplier.id,
              action: supplierId ? "edited" : "created",
              actorUserId: context.userId,
              actorRole: context.role,
              title: supplierId ? "Supplier updated" : "Supplier created",
              summary: `${supplier.name} supplier record was ${supplierId ? "updated" : "created"}.`,
              metadata: { supplierName: supplier.name }
            })
          ]
        }
      )
    );

    return { success: true, message: "Supplier saved.", id: supplier.id };
  };

  const archiveSupplier = (supplierId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          suppliers: current.suppliers.map((supplier) =>
            supplier.id === supplierId ? { ...supplier, isArchived: true } : supplier
          )
        },
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "supplier",
              entityId: supplierId,
              action: "archived",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Supplier archived",
              summary: "Supplier record was archived."
            })
          ]
        }
      )
    );

    return { success: true, message: "Supplier archived." };
  };

  const saveItem = (payload: ItemPayload, itemId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    if (!payload.name.trim()) {
      return { success: false, message: "Item name is required." };
    }

    const existing = state.items.find((record) => record.id === itemId);
    const timestamp = createTimestamp();
    const item: Item = {
      id: itemId ?? createId(),
      workspaceId: context.workspaceId,
      name: payload.name.trim(),
      kind: payload.kind,
      description: payload.description?.trim(),
      sellingPrice: Number(payload.sellingPrice),
      cost: payload.cost ? Number(payload.cost) : undefined,
      sku: payload.sku?.trim(),
      category: payload.category?.trim(),
      isActive: payload.isActive,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        itemId
          ? {
              ...current,
              items: current.items.map((record) => (record.id === itemId ? item : record))
            }
          : { ...current, items: [item, ...current.items] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: itemId ? "Item updated" : "Item created",
              description: `${item.name} is ready for quotes, invoices, and purchases.`,
              href: `/app/items/${item.id}`,
              actorUserId: context.userId
            })
          ]
        }
      )
    );

    return { success: true, message: "Item saved.", id: item.id };
  };

  const archiveItem = (itemId: string) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, isActive: false } : item
      )
    }));

    return { success: true, message: "Item archived." };
  };

  const saveExpense = (payload: ExpensePayload, expenseId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    if (!payload.description.trim() || payload.amount <= 0) {
      return {
        success: false,
        message: "Expense description and amount are required."
      };
    }

    const threshold = workspaceData.settings?.significantExpenseThreshold || 300;
    const existing = state.expenses.find((record) => record.id === expenseId);
    const timestamp = createTimestamp();
    const reviewState =
      Number(payload.amount) >= threshold ? "flagged" : existing?.reviewState || "logged";
    const expense: Expense = {
      id: expenseId ?? createId(),
      workspaceId: context.workspaceId,
      supplierId: payload.supplierId || undefined,
      category: payload.category,
      amount: Number(payload.amount),
      expenseDate: payload.expenseDate,
      description: payload.description.trim(),
      notes: payload.notes?.trim(),
      attachmentName: payload.attachmentName?.trim(),
      attachmentIds: existing?.attachmentIds || [],
      createdBy: existing?.createdBy || context.userId,
      reviewState,
      isArchived: false,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    const suspiciousEdit =
      expenseId && context.role === "staff"
        ? createNotificationRecord({
            workspaceId: context.workspaceId,
            type: "suspicious_edit",
            severity: "critical",
            title: "Staff edited an expense",
            message: `${payload.description.trim()} was edited by staff and may need review.`,
            href: `/app/expenses/${expense.id}`,
            entityType: "expense",
            entityId: expense.id,
            visibleToRoles: ["owner", "admin"]
          })
        : undefined;

    setState((current) =>
      appendArtifacts(
        expenseId
          ? {
              ...current,
              expenses: current.expenses.map((record) =>
                record.id === expenseId ? expense : record
              )
            }
          : { ...current, expenses: [expense, ...current.expenses] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: expenseId ? "Expense updated" : "Expense recorded",
              description: `${expense.description} was added at ${formatDate(expense.expenseDate)}.`,
              href: `/app/expenses/${expense.id}`,
              actorUserId: context.userId
            })
          ],
          notifications: [
            createNotificationRecord({
              workspaceId: context.workspaceId,
              type: reviewState === "flagged" ? "significant_expense" : "expense_recorded",
              severity: reviewState === "flagged" ? "critical" : "warning",
              title:
                reviewState === "flagged" ? "Significant expense alert" : "Expense recorded",
              message:
                reviewState === "flagged"
                  ? `${expense.description} crossed the review threshold.`
                  : `${expense.description} was added to expenses.`,
              href: `/app/expenses/${expense.id}`,
              entityType: "expense",
              entityId: expense.id,
              visibleToRoles:
                reviewState === "flagged"
                  ? ["owner", "admin", "manager"]
                  : ["owner", "admin", "manager", "staff"]
            }),
            ...(suspiciousEdit ? [suspiciousEdit] : [])
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "expense",
              entityId: expense.id,
              action: expenseId ? "edited" : "created",
              actorUserId: context.userId,
              actorRole: context.role,
              title: expenseId ? "Expense updated" : "Expense created",
              summary: `${expense.description} expense was ${expenseId ? "updated" : "recorded"}.`,
              metadata: { amount: expense.amount, reviewState }
            })
          ]
        }
      )
    );

    return { success: true, message: "Expense saved.", id: expense.id };
  };

  const archiveExpense = (expenseId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          expenses: current.expenses.map((expense) =>
            expense.id === expenseId ? { ...expense, isArchived: true } : expense
          )
        },
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "expense",
              entityId: expenseId,
              action: "archived",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Expense archived",
              summary: "Expense record was archived."
            })
          ]
        }
      )
    );

    return { success: true, message: "Expense archived." };
  };

  const saveCashEntry = (payload: CashEntryPayload) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    if (!payload.category.trim() || payload.amount <= 0) {
      return { success: false, message: "Category and amount are required." };
    }

    const cashEntry: CashEntry = {
      id: createId(),
      workspaceId: context.workspaceId,
      type: payload.type,
      category: payload.category.trim(),
      amount: Number(payload.amount),
      entryDate: payload.entryDate,
      notes: payload.notes?.trim(),
      createdBy: context.userId,
      createdAt: createTimestamp()
    };

    setState((current) =>
      appendArtifacts(
        { ...current, cashEntries: [cashEntry, ...current.cashEntries] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: payload.type === "cash_in" ? "Cash in recorded" : "Cash out recorded",
              description: `${cashEntry.category} entry added.`,
              href: "/app/cash-flow",
              actorUserId: context.userId
            })
          ]
        }
      )
    );

    return { success: true, message: "Cash movement saved.", id: cashEntry.id };
  };

  const saveQuote = (payload: QuotePayload, quoteId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const cleanItems = ensureMinimumLineItems(payload.lineItems);
    if (!payload.customerId || cleanItems.length === 0) {
      return {
        success: false,
        message: "Pick a customer and add at least one line item."
      };
    }

    const existing = state.quotes.find((record) => record.id === quoteId);
    const timestamp = createTimestamp();
    const quote: Quote = {
      id: quoteId ?? createId(),
      workspaceId: context.workspaceId,
      customerId: payload.customerId,
      reference:
        existing?.reference ||
        createReference(workspaceData.settings?.quotePrefix ?? "Q", workspaceData.quotes.length),
      issueDate: payload.issueDate,
      expiryDate: payload.expiryDate,
      status: payload.status,
      lineItems: cleanItems,
      discountAmount: Number(payload.discountAmount) || 0,
      taxRate: Number(payload.taxRate) || 0,
      notes: payload.notes?.trim(),
      createdBy: existing?.createdBy || context.userId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      convertedInvoiceId: existing?.convertedInvoiceId
    };

    setState((current) =>
      appendArtifacts(
        quoteId
          ? {
              ...current,
              quotes: current.quotes.map((record) => (record.id === quoteId ? quote : record))
            }
          : { ...current, quotes: [quote, ...current.quotes] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: quoteId ? "Quote updated" : "Quote created",
              description: `${quote.reference} is ready for the customer.`,
              href: `/app/quotes/${quote.id}`,
              actorUserId: context.userId
            })
          ]
        }
      )
    );

    return { success: true, message: "Quote saved.", id: quote.id };
  };

  const updateQuoteStatus = (quoteId: string, status: QuoteStatus) => {
    setState((current) => ({
      ...current,
      quotes: current.quotes.map((quote) =>
        quote.id === quoteId ? { ...quote, status, updatedAt: createTimestamp() } : quote
      )
    }));
  };

  const saveInvoice = (payload: InvoicePayload, invoiceId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const cleanItems = ensureMinimumLineItems(payload.lineItems);
    if (!payload.customerId || cleanItems.length === 0) {
      return {
        success: false,
        message: "Pick a customer and add at least one line item."
      };
    }

    const existing = state.invoices.find((record) => record.id === invoiceId);
    const timestamp = createTimestamp();
    const invoice: Invoice = {
      id: invoiceId ?? createId(),
      workspaceId: context.workspaceId,
      customerId: payload.customerId,
      reference:
        existing?.reference ||
        createReference(
          workspaceData.settings?.invoicePrefix ?? "INV",
          workspaceData.invoices.length
        ),
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: payload.status,
      lineItems: cleanItems,
      discountAmount: Number(payload.discountAmount) || 0,
      taxRate: Number(payload.taxRate) || 0,
      notes: payload.notes?.trim(),
      createdBy: existing?.createdBy || context.userId,
      linkedQuoteId: payload.linkedQuoteId ?? existing?.linkedQuoteId,
      recurringTemplateId: existing?.recurringTemplateId,
      attachmentIds: existing?.attachmentIds || [],
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    const notifications: AppNotification[] = [];
    if (invoiceId && context.role === "staff") {
      notifications.push(
        createNotificationRecord({
          workspaceId: context.workspaceId,
          type: "suspicious_edit",
          severity: "critical",
          title: "Staff edited an invoice",
          message: `${invoice.reference} was edited by staff and may need review.`,
          href: `/app/invoices/${invoice.id}`,
          entityType: "invoice",
          entityId: invoice.id,
          visibleToRoles: ["owner", "admin"]
        })
      );
    }

    setState((current) =>
      appendArtifacts(
        invoiceId
          ? {
              ...current,
              invoices: current.invoices.map((record) =>
                record.id === invoiceId ? invoice : record
              )
            }
          : { ...current, invoices: [invoice, ...current.invoices] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: invoiceId ? "Invoice updated" : "Invoice created",
              description: `${invoice.reference} is live for collection.`,
              href: `/app/invoices/${invoice.id}`,
              actorUserId: context.userId
            })
          ],
          notifications,
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "invoice",
              entityId: invoice.id,
              action: invoiceId ? "edited" : "created",
              actorUserId: context.userId,
              actorRole: context.role,
              title: invoiceId ? "Invoice updated" : "Invoice created",
              summary: `${invoice.reference} was ${invoiceId ? "updated" : "created"}.`,
              metadata: { amount: roundCurrency(getInvoiceOutstanding(invoice, [])) }
            })
          ]
        }
      )
    );

    return { success: true, message: "Invoice saved.", id: invoice.id };
  };

  const convertQuoteToInvoice = (quoteId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const quote = state.quotes.find((record) => record.id === quoteId);
    if (!quote) {
      return { success: false, message: "Quote not found." };
    }

    const invoiceId = createId();
    const settings = workspaceData.settings;
    const issueDate = createTimestamp();
    const dueDate = addDays(new Date(), settings?.defaultInvoiceDueDays || 14).toISOString();
    const invoice: Invoice = {
      id: invoiceId,
      workspaceId: context.workspaceId,
      customerId: quote.customerId,
      reference: createReference(settings?.invoicePrefix ?? "INV", workspaceData.invoices.length),
      issueDate,
      dueDate,
      status: "sent",
      lineItems: quote.lineItems,
      discountAmount: quote.discountAmount,
      taxRate: quote.taxRate,
      notes: quote.notes,
      createdBy: context.userId,
      linkedQuoteId: quote.id,
      attachmentIds: [],
      createdAt: issueDate,
      updatedAt: issueDate
    };

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          invoices: [invoice, ...current.invoices],
          quotes: current.quotes.map((record) =>
            record.id === quoteId
              ? {
                  ...record,
                  status: "converted",
                  convertedInvoiceId: invoiceId,
                  updatedAt: createTimestamp()
                }
              : record
          )
        },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: "Quote converted",
              description: `${quote.reference} became ${invoice.reference}.`,
              href: `/app/invoices/${invoice.id}`,
              actorUserId: context.userId
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "invoice",
              entityId: invoice.id,
              action: "generated",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Quote converted to invoice",
              summary: `${quote.reference} was converted into ${invoice.reference}.`,
              metadata: { quoteReference: quote.reference }
            })
          ]
        }
      )
    );

    return { success: true, message: "Quote converted to invoice.", id: invoice.id };
  };

  const recordPayment = (invoiceId: string, payload: PaymentPayload) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const invoice = state.invoices.find((record) => record.id === invoiceId);
    if (!invoice) {
      return { success: false, message: "Invoice not found." };
    }

    const outstanding = getInvoiceOutstanding(invoice, workspaceData.payments);
    if (payload.amount <= 0 || payload.amount > outstanding) {
      return {
        success: false,
        message: `Payment must be between 0 and ${outstanding.toFixed(2)}.`
      };
    }

    const payment: Payment = {
      id: createId(),
      workspaceId: context.workspaceId,
      invoiceId,
      amount: Number(payload.amount),
      paymentDate: payload.paymentDate,
      method: payload.method,
      reference: payload.reference?.trim(),
      notes: payload.notes?.trim(),
      createdBy: context.userId,
      createdAt: createTimestamp()
    };
    const receipt = {
      id: createId(),
      workspaceId: context.workspaceId,
      invoiceId,
      paymentId: payment.id,
      reference: createReference(
        workspaceData.settings?.receiptPrefix ?? "RCPT",
        workspaceData.receipts.length
      ),
      receiptDate: payload.paymentDate,
      createdAt: createTimestamp()
    };

    const nextPayments = [payment, ...state.payments];
    const refreshedStatus = getInvoiceStatus(invoice, nextPayments);
    const nextPaidAmount = getPaidAmount(nextPayments, invoiceId);

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          payments: [payment, ...current.payments],
          receipts: [receipt, ...current.receipts],
          invoices: current.invoices.map((record) =>
            record.id === invoiceId
              ? {
                  ...record,
                  status: refreshedStatus,
                  updatedAt: createTimestamp()
                }
              : record
          )
        },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: "Payment recorded",
              description: `${invoice.reference} received ${payment.amount.toFixed(2)}.`,
              href: `/app/receipts/${receipt.id}`,
              actorUserId: context.userId
            })
          ],
          notifications: [
            createNotificationRecord({
              workspaceId: context.workspaceId,
              type: refreshedStatus === "paid" ? "invoice_paid" : "partial_payment_recorded",
              severity: "success",
              title:
                refreshedStatus === "paid"
                  ? "Invoice fully paid"
                  : "Partial payment recorded",
              message: `${invoice.reference} now has ${nextPaidAmount.toFixed(2)} collected.`,
              href: `/app/invoices/${invoice.id}`,
              entityType: "invoice",
              entityId: invoice.id,
              visibleToRoles: ["owner", "admin", "manager", "staff"]
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "payment",
              entityId: payment.id,
              action: "recorded",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Invoice payment recorded",
              summary: `${payment.amount.toFixed(2)} was recorded against ${invoice.reference}.`,
              metadata: { invoiceReference: invoice.reference, amount: payment.amount }
            }),
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "receipt",
              entityId: receipt.id,
              action: "generated",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Receipt generated",
              summary: `${receipt.reference} was generated for ${invoice.reference}.`,
              metadata: { receiptReference: receipt.reference }
            })
          ]
        }
      )
    );

    return {
      success: true,
      message: "Payment recorded and receipt generated.",
      receiptId: receipt.id
    };
  };

  const logReceiptReprint = (receiptId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return;
    }

    setState((current) =>
      appendArtifacts(current, {
        auditLogs: [
          createAuditLogRecord({
            workspaceId: context.workspaceId,
            entityType: "receipt",
            entityId: receiptId,
            action: "reprinted",
            actorUserId: context.userId,
            actorRole: context.role,
            title: "Receipt reprinted",
            summary: "Receipt was reprinted from the detail page."
          })
        ]
      })
    );
  };

  const savePurchase = (payload: PurchasePayload, purchaseId?: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_purchases");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const cleanItems = ensureMinimumPurchaseLineItems(payload.lineItems);
    if (!payload.supplierId || cleanItems.length === 0) {
      return {
        success: false,
        message: "Pick a supplier and add at least one line item."
      };
    }

    const existing = state.purchases.find((record) => record.id === purchaseId);
    const timestamp = createTimestamp();
    const purchase: Purchase = {
      id: purchaseId ?? createId(),
      workspaceId: context.workspaceId,
      supplierId: payload.supplierId,
      reference:
        existing?.reference ||
        createReference(
          workspaceData.settings?.purchasePrefix ?? "PUR",
          workspaceData.purchases.length
        ),
      purchaseDate: payload.purchaseDate,
      dueDate: payload.dueDate,
      status: payload.status,
      lineItems: cleanItems,
      notes: payload.notes?.trim(),
      attachmentIds: existing?.attachmentIds || [],
      createdBy: existing?.createdBy || context.userId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        purchaseId
          ? {
              ...current,
              purchases: current.purchases.map((record) =>
                record.id === purchaseId ? purchase : record
              )
            }
          : { ...current, purchases: [purchase, ...current.purchases] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: purchaseId ? "Purchase updated" : "Purchase recorded",
              description: `${purchase.reference} was saved for supplier follow-up.`,
              href: `/app/purchases/${purchase.id}`,
              actorUserId: context.userId
            })
          ],
          notifications: [
            createNotificationRecord({
              workspaceId: context.workspaceId,
              type: purchase.status === "draft" ? "purchase_recorded" : "purchase_confirmed",
              severity: purchase.status === "draft" ? "info" : "warning",
              title:
                purchase.status === "draft"
                  ? "Purchase saved as draft"
                  : "Purchase confirmed",
              message: `${purchase.reference} is now ${purchase.status}.`,
              href: `/app/purchases/${purchase.id}`,
              entityType: "purchase",
              entityId: purchase.id,
              visibleToRoles: ["owner", "admin", "manager", "staff"]
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "purchase",
              entityId: purchase.id,
              action: purchaseId ? "edited" : "created",
              actorUserId: context.userId,
              actorRole: context.role,
              title: purchaseId ? "Purchase updated" : "Purchase created",
              summary: `${purchase.reference} was ${purchaseId ? "updated" : "created"}.`,
              metadata: { status: purchase.status }
            })
          ]
        }
      )
    );

    return { success: true, message: "Purchase saved.", id: purchase.id };
  };

  const recordPurchasePayment = (purchaseId: string, payload: PaymentPayload) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "record_supplier_payments");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const purchase = state.purchases.find((record) => record.id === purchaseId);
    if (!purchase) {
      return { success: false, message: "Purchase not found." };
    }

    const outstanding = getPurchaseOutstanding(purchase, workspaceData.purchasePayments);
    if (payload.amount <= 0 || payload.amount > outstanding) {
      return {
        success: false,
        message: `Payment must be between 0 and ${outstanding.toFixed(2)}.`
      };
    }

    const purchasePayment: PurchasePayment = {
      id: createId(),
      workspaceId: context.workspaceId,
      purchaseId,
      amount: Number(payload.amount),
      paymentDate: payload.paymentDate,
      method: payload.method,
      reference: payload.reference?.trim(),
      notes: payload.notes?.trim(),
      createdBy: context.userId,
      createdAt: createTimestamp()
    };

    const nextPurchasePayments = [purchasePayment, ...state.purchasePayments];
    const refreshedStatus = getPurchaseStatus(purchase, nextPurchasePayments);

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          purchasePayments: [purchasePayment, ...current.purchasePayments],
          purchases: current.purchases.map((record) =>
            record.id === purchaseId
              ? {
                  ...record,
                  status: refreshedStatus,
                  updatedAt: createTimestamp()
                }
              : record
          )
        },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: "Supplier payment recorded",
              description: `${purchase.reference} was paid ${purchasePayment.amount.toFixed(2)}.`,
              href: `/app/purchases/${purchase.id}`,
              actorUserId: context.userId
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "purchase_payment",
              entityId: purchasePayment.id,
              action: "recorded",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Supplier payment recorded",
              summary: `${purchasePayment.amount.toFixed(2)} was recorded against ${purchase.reference}.`,
              metadata: { purchaseReference: purchase.reference, amount: purchasePayment.amount }
            })
          ]
        }
      )
    );

    return { success: true, message: "Supplier payment recorded.", id: purchasePayment.id };
  };

  const saveRecurringInvoice = (
    payload: RecurringInvoicePayload,
    recurringInvoiceId?: string
  ) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_recurring");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const cleanItems = ensureMinimumLineItems(payload.lineItems);
    if (!payload.customerId || !payload.label.trim() || cleanItems.length === 0) {
      return {
        success: false,
        message: "Recurring invoices need a label, customer, and line items."
      };
    }

    const existing = state.recurringInvoices.find(
      (record) => record.id === recurringInvoiceId
    );
    const timestamp = createTimestamp();
    const template: RecurringInvoiceTemplate = {
      id: recurringInvoiceId ?? createId(),
      workspaceId: context.workspaceId,
      customerId: payload.customerId,
      label: payload.label.trim(),
      frequency: payload.frequency,
      startDate: payload.startDate,
      nextRunDate: payload.nextRunDate,
      dueInDays: Number(payload.dueInDays),
      isActive: payload.isActive,
      lineItems: cleanItems,
      discountAmount: Number(payload.discountAmount) || 0,
      taxRate: Number(payload.taxRate) || 0,
      notes: payload.notes?.trim(),
      createdBy: existing?.createdBy || context.userId,
      generatedInvoiceIds: existing?.generatedInvoiceIds || [],
      lastGeneratedAt: existing?.lastGeneratedAt,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        recurringInvoiceId
          ? {
              ...current,
              recurringInvoices: current.recurringInvoices.map((record) =>
                record.id === recurringInvoiceId ? template : record
              )
            }
          : { ...current, recurringInvoices: [template, ...current.recurringInvoices] },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: recurringInvoiceId
                ? "Recurring invoice updated"
                : "Recurring invoice created",
              description: `${template.label} is scheduled ${template.frequency}.`,
              href: "/app/recurring",
              actorUserId: context.userId
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "recurring_invoice",
              entityId: template.id,
              action: recurringInvoiceId ? "edited" : "created",
              actorUserId: context.userId,
              actorRole: context.role,
              title: recurringInvoiceId
                ? "Recurring invoice updated"
                : "Recurring invoice created",
              summary: `${template.label} was ${recurringInvoiceId ? "updated" : "created"}.`,
              metadata: { frequency: template.frequency, nextRunDate: template.nextRunDate }
            })
          ]
        }
      )
    );

    return { success: true, message: "Recurring invoice saved.", id: template.id };
  };

  const toggleRecurringInvoice = (recurringInvoiceId: string, isActive: boolean) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_recurring");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          recurringInvoices: current.recurringInvoices.map((record) =>
            record.id === recurringInvoiceId
              ? { ...record, isActive, updatedAt: createTimestamp() }
              : record
          )
        },
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "recurring_invoice",
              entityId: recurringInvoiceId,
              action: "edited",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Recurring invoice toggled",
              summary: `Recurring template was ${isActive ? "activated" : "paused"}.`,
              metadata: { isActive }
            })
          ]
        }
      )
    );

    return { success: true, message: "Recurring template updated." };
  };

  const runRecurringInvoice = (recurringInvoiceId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "manage_recurring");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const template = state.recurringInvoices.find((record) => record.id === recurringInvoiceId);
    if (!template) {
      return { success: false, message: "Recurring invoice template not found." };
    }

    const timestamp = createTimestamp();
    const invoiceId = createId();
    const issueDate = timestamp;
    const dueDate = addDays(new Date(), template.dueInDays).toISOString();
    const invoice: Invoice = {
      id: invoiceId,
      workspaceId: context.workspaceId,
      customerId: template.customerId,
      reference: createReference(
        workspaceData.settings?.invoicePrefix ?? "INV",
        workspaceData.invoices.length
      ),
      issueDate,
      dueDate,
      status: "draft",
      lineItems: template.lineItems,
      discountAmount: template.discountAmount,
      taxRate: template.taxRate,
      notes: template.notes,
      createdBy: context.userId,
      recurringTemplateId: template.id,
      attachmentIds: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    setState((current) =>
      appendArtifacts(
        {
          ...current,
          invoices: [invoice, ...current.invoices],
          recurringInvoices: current.recurringInvoices.map((record) =>
            record.id === recurringInvoiceId
              ? {
                  ...record,
                  generatedInvoiceIds: [invoiceId, ...record.generatedInvoiceIds],
                  lastGeneratedAt: timestamp,
                  nextRunDate: getNextRecurringRunDate(record.nextRunDate, record.frequency),
                  updatedAt: timestamp
                }
              : record
          )
        },
        {
          activities: [
            createActivityRecord({
              workspaceId: context.workspaceId,
              title: "Recurring invoice generated",
              description: `${template.label} generated ${invoice.reference}.`,
              href: `/app/invoices/${invoice.id}`,
              actorUserId: context.userId
            })
          ],
          notifications: [
            createNotificationRecord({
              workspaceId: context.workspaceId,
              type: "recurring_invoice_due",
              severity: "warning",
              title: "Recurring invoice generated",
              message: `${invoice.reference} was generated from ${template.label}.`,
              href: `/app/invoices/${invoice.id}`,
              entityType: "invoice",
              entityId: invoice.id,
              visibleToRoles: ["owner", "admin", "manager"]
            })
          ],
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "recurring_invoice",
              entityId: recurringInvoiceId,
              action: "generated",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Recurring invoice generated",
              summary: `${template.label} produced ${invoice.reference}.`,
              metadata: { invoiceReference: invoice.reference }
            })
          ]
        }
      )
    );

    return { success: true, message: "Recurring invoice generated.", id: invoice.id };
  };

  const addAttachment = (payload: AttachmentPayload) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "attach_files");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const attachment: Attachment = {
      id: createId(),
      workspaceId: context.workspaceId,
      entityType: payload.entityType,
      entityId: payload.entityId,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      dataUrl: payload.dataUrl,
      uploadedBy: context.userId,
      createdAt: createTimestamp()
    };

    setState((current) =>
      appendArtifacts(
        updateEntityAttachmentIds(
          { ...current, attachments: [attachment, ...current.attachments] },
          payload.entityType,
          payload.entityId,
          attachment.id,
          "add"
        ),
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "attachment",
              entityId: attachment.id,
              action: "uploaded",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Attachment uploaded",
              summary: `${attachment.fileName} was attached to ${payload.entityType}.`,
              metadata: { entityType: payload.entityType, entityId: payload.entityId }
            })
          ]
        }
      )
    );

    return { success: true, message: "Attachment uploaded.", id: attachment.id };
  };

  const deleteAttachment = (attachmentId: string) => {
    const context = requireWorkspaceContext(currentUserId, membership, currentRole);
    if (!context.ok) {
      return { success: false, message: context.message };
    }

    const permissionCheck = ensurePermission(context.role, "attach_files");
    if (!permissionCheck.ok) {
      return { success: false, message: permissionCheck.message };
    }

    const attachment = state.attachments.find((record) => record.id === attachmentId);
    if (!attachment) {
      return { success: false, message: "Attachment not found." };
    }

    setState((current) =>
      appendArtifacts(
        updateEntityAttachmentIds(
          {
            ...current,
            attachments: current.attachments.filter((record) => record.id !== attachmentId)
          },
          attachment.entityType,
          attachment.entityId,
          attachment.id,
          "remove"
        ),
        {
          auditLogs: [
            createAuditLogRecord({
              workspaceId: context.workspaceId,
              entityType: "attachment",
              entityId: attachment.id,
              action: "deleted",
              actorUserId: context.userId,
              actorRole: context.role,
              title: "Attachment deleted",
              summary: `${attachment.fileName} was removed.`,
              metadata: { entityType: attachment.entityType, entityId: attachment.entityId }
            })
          ]
        }
      )
    );

    return { success: true, message: "Attachment removed." };
  };

  const markNotificationRead = (notificationId: string) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const markAllNotificationsRead = () => {
    if (!membership) {
      return;
    }

    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.workspaceId === membership.workspaceId &&
        (!notification.visibleToRoles ||
          !currentRole ||
          notification.visibleToRoles.includes(currentRole))
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const resetDemoState = () => {
    setState(seedAppState);
    setCurrentUserId(null);
  };

  return (
    <BusinessOSContext.Provider
      value={{
        isHydrated,
        state,
        currentUser,
        currentWorkspace,
        membership,
        currentRole,
        hasWorkspace: Boolean(membership),
        workspaceData: {
          ...workspaceData,
          teamMembers: buildTeamMembers(state, membership?.workspaceId)
        },
        dashboardMetrics,
        unreadNotificationsCount,
        outstandingByCustomer,
        supplierPayables,
        receivablesAging,
        payablesAging,
        ownerAwayAttentionCount,
        signIn,
        signUp,
        signOut,
        canAccess,
        hasRole,
        createWorkspaceFromOnboarding,
        updateProfile,
        updateWorkspace,
        updateSettings,
        changeMemberRole,
        saveCustomer,
        archiveCustomer,
        saveSupplier,
        archiveSupplier,
        saveItem,
        archiveItem,
        saveExpense,
        archiveExpense,
        saveCashEntry,
        saveQuote,
        updateQuoteStatus,
        convertQuoteToInvoice,
        saveInvoice,
        recordPayment,
        logReceiptReprint,
        savePurchase,
        recordPurchasePayment,
        saveRecurringInvoice,
        toggleRecurringInvoice,
        runRecurringInvoice,
        addAttachment,
        deleteAttachment,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoState
      }}
    >
      {children}
    </BusinessOSContext.Provider>
  );
}

export function useBusinessOS() {
  const context = useContext(BusinessOSContext);
  if (!context) {
    throw new Error("useBusinessOS must be used within BusinessOSProvider.");
  }

  return context;
}
