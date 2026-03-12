"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { getInvoiceOutstanding } from "@/lib/calculations";
import {
  createFinanceExportPreview,
  getFinanceLedgerEntries,
  getFinancialHealthSnapshot,
  getInvoiceFinancingCandidates,
  getPaymentRequestEffectiveStatus,
  getReconciliationSummary,
  getSupplierCreditSummary,
  mergeFinanceAuditLogs
} from "@/lib/v5-calculations";
import { createEmptyFlowV5State, seedFlowV5State, upgradeFlowV5State } from "@/lib/v5-seed";
import {
  loadFlowV5State,
  loadRemoteFlowV5State,
  queueFlowV5StateSave,
  saveFlowV5State
} from "@/lib/v5-storage";
import {
  FinanceNotification,
  FlowV5State,
  PartnerFinancePackage,
  PaymentRequest,
  PaymentRequestStatus,
  ReconciliationHistoryEntry,
  ReconciliationRecord,
  ReconciliationStatus,
  SupplierCreditTerm
} from "@/lib/v5-types";

interface PaymentRequestPayload {
  amountRequested?: number;
  message?: string;
  expiresOn?: string;
}

interface ReconciliationPayload {
  status: ReconciliationStatus;
  matchedAmount?: number;
  note?: string;
}

interface SupplierCreditPayload {
  creditDays: number;
  reminderDays: number;
  creditLimitEstimate?: number;
  status: SupplierCreditTerm["status"];
  notes?: string;
}

interface FlowV5ContextValue {
  isHydrated: boolean;
  paymentRequests: PaymentRequest[];
  openPaymentRequests: PaymentRequest[];
  reconciliationRecords: ReconciliationRecord[];
  supplierCreditTerms: SupplierCreditTerm[];
  eligibleInvoices: ReturnType<typeof getInvoiceFinancingCandidates>;
  supplierCreditSummary: ReturnType<typeof getSupplierCreditSummary>;
  ledgerEntries: ReturnType<typeof getFinanceLedgerEntries>;
  financialHealth: ReturnType<typeof getFinancialHealthSnapshot>;
  readinessHistory: FlowV5State["readinessHistory"];
  partnerFinancePackages: PartnerFinancePackage[];
  financeNotifications: FinanceNotification[];
  unreadFinanceCount: number;
  financeAuditLogs: ReturnType<typeof mergeFinanceAuditLogs>;
  financeSummary: {
    openPaymentRequests: number;
    paidPaymentRequests: number;
    unreconciledCount: number;
    mismatchCount: number;
    eligibleInvoiceCount: number;
    supplierCreditDueSoonCount: number;
  };
  getPaymentRequest: (requestId: string) => PaymentRequest | undefined;
  getPaymentRequestsForInvoice: (invoiceId: string) => PaymentRequest[];
  getEffectivePaymentRequestStatus: (
    request: PaymentRequest
  ) => PaymentRequestStatus;
  getReconciliationForPayment: (paymentId: string) => ReconciliationRecord | undefined;
  getReconciliationForPurchasePayment: (
    purchasePaymentId: string
  ) => ReconciliationRecord | undefined;
  getInvoiceReconciliationStatus: (
    invoiceId: string
  ) => "no_payments" | "unreconciled" | "partial" | "reconciled" | "mismatch";
  createPaymentRequest: (
    invoiceId: string,
    payload: PaymentRequestPayload
  ) => { success: boolean; message: string; id?: string };
  markPaymentRequestViewed: (
    requestId: string
  ) => { success: boolean; message: string };
  sendPaymentRequestReminder: (
    requestId: string,
    note?: string
  ) => { success: boolean; message: string };
  linkPaymentRequestToPayment: (
    requestId: string,
    paymentId: string
  ) => { success: boolean; message: string };
  reconcilePayment: (
    paymentId: string,
    payload: ReconciliationPayload
  ) => { success: boolean; message: string };
  reconcilePurchasePayment: (
    purchasePaymentId: string,
    payload: ReconciliationPayload
  ) => { success: boolean; message: string };
  updateSupplierCreditTerm: (
    supplierId: string,
    payload: SupplierCreditPayload
  ) => { success: boolean; message: string };
  setInvoiceCandidateSelection: (
    invoiceId: string,
    isSelected: boolean,
    note?: string
  ) => { success: boolean; message: string };
  captureReadinessSnapshot: (note?: string) => { success: boolean; message: string };
  generatePartnerFinancePackage: (note?: string) => {
    success: boolean;
    message: string;
    id?: string;
  };
  markFinanceNotificationRead: (notificationId: string) => void;
  markAllFinanceNotificationsRead: () => void;
  resetV5DemoState: () => void;
}

const FlowV5Context = createContext<FlowV5ContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function createReference(prefix: string, count: number) {
  return `${prefix}-${new Date().getFullYear()}-${String(count).padStart(3, "0")}`;
}

export function FlowV5Provider({ children }: { children: React.ReactNode }) {
  const {
    canAccess,
    currentRole,
    currentUser,
    currentWorkspace,
    workspaceData
  } = useBusinessOS();
  const { networkAuditLogs, networkSummary, purchaseOrders, supplierActivitySummary } = useFlowV4();
  const [state, setState] = useState<FlowV5State>(createEmptyFlowV5State);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteStateReady, setIsRemoteStateReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loaded = loadFlowV5State();
    setState(upgradeFlowV5State(loaded || seedFlowV5State));
    setIsHydrated(true);

    void loadRemoteFlowV5State().then((remoteState) => {
      if (!isMounted) {
        return;
      }

      if (remoteState) {
        setState(upgradeFlowV5State(remoteState));
      }

      setIsRemoteStateReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isRemoteStateReady) {
      return;
    }

    saveFlowV5State(state);
    queueFlowV5StateSave(state);
  }, [isHydrated, isRemoteStateReady, state]);

  useEffect(() => {
    if (!isHydrated || !currentWorkspace) {
      return;
    }

    setState((current) => {
      let changed = false;
      let nextState = current;
      const missingSupplierTerms = workspaceData.suppliers.filter(
        (supplier) =>
          !current.supplierCreditTerms.some(
            (term) =>
              term.workspaceId === currentWorkspace.id && term.supplierId === supplier.id
          )
      );

      if (missingSupplierTerms.length) {
        changed = true;
        nextState = {
          ...nextState,
          supplierCreditTerms: [
            ...missingSupplierTerms.map((supplier) => ({
              id: createId("supplier-credit"),
              workspaceId: currentWorkspace.id,
              supplierId: supplier.id,
              creditDays: workspaceData.settings?.defaultPurchaseDueDays || 14,
              reminderDays: 3,
              creditLimitEstimate: undefined,
              status: "watch" as const,
              notes: "Auto-created supplier credit profile.",
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            })),
            ...nextState.supplierCreditTerms
          ]
        };
      }

      const missingPaymentReconciliations = workspaceData.payments.filter(
        (payment) =>
          !current.reconciliationRecords.some((record) => record.paymentId === payment.id)
      );
      if (missingPaymentReconciliations.length) {
        changed = true;
        nextState = {
          ...nextState,
          reconciliationRecords: [
            ...missingPaymentReconciliations.map((payment) => ({
              id: createId("reconciliation"),
              workspaceId: currentWorkspace.id,
              kind: "invoice_payment" as const,
              paymentId: payment.id,
              invoiceId: payment.invoiceId,
              status: "unreconciled" as const,
              matchedAmount: payment.amount,
              unmatchedAmount: 0,
              referenceValue: payment.reference,
              note: "Awaiting manual finance review.",
              lastEvaluatedAt: createTimestamp(),
              isSystemGenerated: true,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp(),
              history: [
                {
                  id: createId("reconciliation-history"),
                  action: "created" as const,
                  note: "Auto-created from invoice payment.",
                  createdAt: createTimestamp()
                }
              ]
            })),
            ...nextState.reconciliationRecords
          ]
        };
      }

      const missingPurchaseReconciliations = workspaceData.purchasePayments.filter(
        (payment) =>
          !current.reconciliationRecords.some(
            (record) => record.purchasePaymentId === payment.id
          )
      );
      if (missingPurchaseReconciliations.length) {
        changed = true;
        nextState = {
          ...nextState,
          reconciliationRecords: [
            ...missingPurchaseReconciliations.map((payment) => ({
              id: createId("reconciliation"),
              workspaceId: currentWorkspace.id,
              kind: "supplier_payment" as const,
              purchasePaymentId: payment.id,
              purchaseId: payment.purchaseId,
              status: "unreconciled" as const,
              matchedAmount: payment.amount,
              unmatchedAmount: 0,
              referenceValue: payment.reference,
              note: "Awaiting manual supplier-payment review.",
              lastEvaluatedAt: createTimestamp(),
              isSystemGenerated: true,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp(),
              history: [
                {
                  id: createId("reconciliation-history"),
                  action: "created" as const,
                  note: "Auto-created from supplier payment.",
                  createdAt: createTimestamp()
                }
              ]
            })),
            ...nextState.reconciliationRecords
          ]
        };
      }

      return changed ? nextState : current;
    });
  }, [
    currentWorkspace,
    isHydrated,
    workspaceData.payments,
    workspaceData.purchasePayments,
    workspaceData.settings?.defaultPurchaseDueDays,
    workspaceData.suppliers
  ]);

  function ensureContext() {
    if (!currentWorkspace || !currentUser || !currentRole) {
      return { ok: false as const, message: "Workspace finance context is not ready." };
    }

    return {
      ok: true as const,
      workspaceId: currentWorkspace.id,
      userId: currentUser.id,
      role: currentRole
    };
  }

  function appendArtifacts(params: {
    notification?: FinanceNotification;
    audit?: FlowV5State["financeAuditLogs"][number];
  }) {
    return (current: FlowV5State): FlowV5State => ({
      ...current,
      financeNotifications: params.notification
        ? [params.notification, ...current.financeNotifications]
        : current.financeNotifications,
      financeAuditLogs: params.audit
        ? [params.audit, ...current.financeAuditLogs]
        : current.financeAuditLogs
    });
  }

  const paymentRequests = useMemo(
    () =>
      currentWorkspace
        ? state.paymentRequests.filter((request) => request.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.paymentRequests]
  );
  const reconciliationRecords = useMemo(
    () =>
      currentWorkspace
        ? state.reconciliationRecords.filter(
            (record) => record.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.reconciliationRecords]
  );
  const supplierCreditTerms = useMemo(
    () =>
      currentWorkspace
        ? state.supplierCreditTerms.filter(
            (record) => record.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.supplierCreditTerms]
  );
  const readinessHistory = useMemo(
    () =>
      currentWorkspace
        ? state.readinessHistory.filter(
            (entry) => entry.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.readinessHistory]
  );
  const partnerFinancePackages = useMemo(
    () =>
      currentWorkspace
        ? state.partnerFinancePackages.filter(
            (entry) => entry.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.partnerFinancePackages]
  );
  const candidateSelections = useMemo(
    () =>
      currentWorkspace
        ? state.invoiceCandidateSelections.filter(
            (entry) => entry.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.invoiceCandidateSelections]
  );
  const financeNotifications = useMemo(
    () =>
      currentWorkspace
        ? state.financeNotifications.filter(
            (notification) =>
              notification.workspaceId === currentWorkspace.id &&
              (!notification.visibleToRoles ||
                !currentRole ||
                notification.visibleToRoles.includes(currentRole))
          )
        : [],
    [currentRole, currentWorkspace, state.financeNotifications]
  );
  const unreadFinanceCount = financeNotifications.filter(
    (notification) => !notification.isRead
  ).length;
  const ledgerEntries = useMemo(
    () =>
      getFinanceLedgerEntries({
        workspaceId: currentWorkspace?.id,
        payments: workspaceData.payments,
        invoices: workspaceData.invoices,
        customers: workspaceData.customers,
        purchasePayments: workspaceData.purchasePayments,
        purchases: workspaceData.purchases,
        suppliers: workspaceData.suppliers,
        expenses: workspaceData.expenses,
        cashEntries: workspaceData.cashEntries
      }),
    [
      currentWorkspace?.id,
      workspaceData.cashEntries,
      workspaceData.customers,
      workspaceData.expenses,
      workspaceData.invoices,
      workspaceData.payments,
      workspaceData.purchasePayments,
      workspaceData.purchases,
      workspaceData.suppliers
    ]
  );
  const eligibleInvoices = useMemo(
    () =>
      getInvoiceFinancingCandidates({
        invoices: workspaceData.invoices,
        customers: workspaceData.customers,
        payments: workspaceData.payments,
        reconciliations: reconciliationRecords,
        selections: candidateSelections
      }),
    [
      candidateSelections,
      reconciliationRecords,
      workspaceData.customers,
      workspaceData.invoices,
      workspaceData.payments
    ]
  );
  const supplierCreditSummary = useMemo(
    () =>
      getSupplierCreditSummary({
        terms: supplierCreditTerms,
        suppliers: workspaceData.suppliers,
        purchases: workspaceData.purchases,
        purchasePayments: workspaceData.purchasePayments,
        dueSoonDays: workspaceData.settings?.dueSoonDays || 7
      }),
    [
      supplierCreditTerms,
      workspaceData.purchasePayments,
      workspaceData.purchases,
      workspaceData.settings?.dueSoonDays,
      workspaceData.suppliers
    ]
  );
  const financialHealth = useMemo(
    () =>
      getFinancialHealthSnapshot({
        invoices: workspaceData.invoices,
        payments: workspaceData.payments,
        purchases: workspaceData.purchases,
        purchasePayments: workspaceData.purchasePayments,
        expenses: workspaceData.expenses,
        cashEntries: workspaceData.cashEntries,
        reconciliations: reconciliationRecords,
        networkActivityCount:
          networkSummary.connectedBusinesses +
          purchaseOrders.length +
          supplierActivitySummary.reduce(
            (total, entry) => total + entry.orderCount + entry.responseCount,
            0
          )
      }),
    [
      networkSummary.connectedBusinesses,
      purchaseOrders.length,
      reconciliationRecords,
      supplierActivitySummary,
      workspaceData.cashEntries,
      workspaceData.expenses,
      workspaceData.invoices,
      workspaceData.payments,
      workspaceData.purchasePayments,
      workspaceData.purchases
    ]
  );
  const financeAuditLogs = useMemo(
    () =>
      mergeFinanceAuditLogs(
        workspaceData.auditLogs,
        networkAuditLogs,
        currentWorkspace
          ? state.financeAuditLogs.filter((log) => log.workspaceId === currentWorkspace.id)
          : []
      ),
    [currentWorkspace, networkAuditLogs, state.financeAuditLogs, workspaceData.auditLogs]
  );
  const openPaymentRequests = paymentRequests.filter((request) =>
    ["draft", "sent", "viewed"].includes(
      getPaymentRequestEffectiveStatus(
        request,
        workspaceData.invoices.find((record) => record.id === request.invoiceId),
        workspaceData.payments
      )
    )
  );
  const reconciliationSummary = getReconciliationSummary(reconciliationRecords);
  const financeSummary = {
    openPaymentRequests: openPaymentRequests.length,
    paidPaymentRequests: paymentRequests.filter(
      (request) =>
        getPaymentRequestEffectiveStatus(
          request,
          workspaceData.invoices.find((record) => record.id === request.invoiceId),
          workspaceData.payments
        ) === "paid"
    ).length,
    unreconciledCount: reconciliationSummary.unreconciled,
    mismatchCount: reconciliationSummary.mismatch,
    eligibleInvoiceCount: eligibleInvoices.filter(
      (candidate) => candidate.status !== "not_ready"
    ).length,
    supplierCreditDueSoonCount: supplierCreditSummary.rows.filter(
      (row) => row.dueSoon > 0 || row.overdue > 0
    ).length
  };

  function getPaymentRequest(requestId: string) {
    return paymentRequests.find((request) => request.id === requestId);
  }

  function getPaymentRequestsForInvoice(invoiceId: string) {
    return paymentRequests.filter((request) => request.invoiceId === invoiceId);
  }

  function getEffectivePaymentRequestStatus(request: PaymentRequest) {
    return getPaymentRequestEffectiveStatus(
      request,
      workspaceData.invoices.find((record) => record.id === request.invoiceId),
      workspaceData.payments
    );
  }

  function getReconciliationForPayment(paymentId: string) {
    return reconciliationRecords.find((record) => record.paymentId === paymentId);
  }

  function getReconciliationForPurchasePayment(purchasePaymentId: string) {
    return reconciliationRecords.find(
      (record) => record.purchasePaymentId === purchasePaymentId
    );
  }

  function getInvoiceReconciliationStatus(invoiceId: string) {
    const relatedPayments = workspaceData.payments.filter(
      (payment) => payment.invoiceId === invoiceId
    );
    if (!relatedPayments.length) {
      return "no_payments" as const;
    }

    const relatedRecords = reconciliationRecords.filter(
      (record) => record.invoiceId === invoiceId
    );
    if (relatedRecords.some((record) => record.status === "mismatch")) {
      return "mismatch" as const;
    }
    if (relatedRecords.every((record) => record.status === "reconciled")) {
      return "reconciled" as const;
    }
    if (relatedRecords.some((record) => record.status === "partial")) {
      return "partial" as const;
    }
    return "unreconciled" as const;
  }

  const createPaymentRequest = (
    invoiceId: string,
    payload: PaymentRequestPayload
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_payment_requests")) {
      return { success: false, message: "You do not have access to create payment requests." };
    }

    const invoice = workspaceData.invoices.find((record) => record.id === invoiceId);
    if (!invoice) {
      return { success: false, message: "Invoice not found." };
    }

    const invoiceOutstanding = getInvoiceOutstanding(invoice, workspaceData.payments);

    if (invoiceOutstanding <= 0) {
      return {
        success: false,
        message: "This invoice is already fully collected."
      };
    }

    const requestId = createId("payment-request");
    const reference = createReference("COL", paymentRequests.length + 1);
    const amountRequested = Math.min(
      payload.amountRequested || invoiceOutstanding,
      invoiceOutstanding
    );
    const timestamp = createTimestamp();

    setState((current) => ({
      ...appendArtifacts({
        notification: {
          id: createId("finance-note"),
          workspaceId: context.workspaceId,
          type: "payment_request_created",
          title: "Payment request created",
          message: `${reference} is ready to share from ${invoice.reference}.`,
          href: `/app/finance/collections/${requestId}`,
          relatedEntityType: "payment_request",
          relatedEntityId: requestId,
          isRead: false,
          createdAt: timestamp
        },
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "payment_request",
          entityId: requestId,
          action: "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Payment request created",
          summary: `${reference} was created for ${invoice.reference}.`,
          createdAt: timestamp
        }
      })(current),
      paymentRequests: [
        {
          id: requestId,
          workspaceId: context.workspaceId,
          invoiceId,
          reference,
          shareCode: `FLOW-${reference}`,
          shareUrl: `/app/finance/collections/${requestId}`,
          status: "sent",
          amountRequested,
          currency: currentWorkspace?.currency || "USD",
          message: payload.message?.trim(),
          expiresOn: payload.expiresOn,
          createdBy: context.userId,
          createdAt: timestamp,
          updatedAt: timestamp,
          history: [
            {
              id: createId("payment-request-history"),
              action: "created",
              note: payload.message?.trim(),
              actorUserId: context.userId,
              createdAt: timestamp
            }
          ]
        },
        ...current.paymentRequests
      ]
    }));

    return { success: true, message: "Payment request created.", id: requestId };
  };

  const markPaymentRequestViewed = (requestId: string) => {
    const context = ensureContext();
    if (!context.ok) {
      return { success: false, message: "Finance context is not ready." };
    }

    const request = paymentRequests.find((entry) => entry.id === requestId);
    if (!request) {
      return { success: false, message: "Payment request not found." };
    }

    setState((current) => ({
      ...current,
      paymentRequests: current.paymentRequests.map((entry) =>
        entry.id === requestId
          ? {
              ...entry,
              status: getEffectivePaymentRequestStatus(entry) === "paid" ? "paid" : "viewed",
              updatedAt: createTimestamp(),
              history: [
                ...entry.history,
                {
                  id: createId("payment-request-history"),
                  action: "viewed",
                  createdAt: createTimestamp()
                }
              ]
            }
          : entry
      )
    }));

    return { success: true, message: "Payment request marked as viewed." };
  };

  const sendPaymentRequestReminder = (requestId: string, note?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_payment_requests")) {
      return { success: false, message: "You do not have access to send payment reminders." };
    }

    const request = paymentRequests.find((entry) => entry.id === requestId);
    if (!request) {
      return { success: false, message: "Payment request not found." };
    }

    setState((current) => ({
      ...appendArtifacts({
        notification: {
          id: createId("finance-note"),
          workspaceId: context.workspaceId,
          type: "payment_request_reminder",
          title: "Payment reminder sent",
          message: `${request.reference} was reminded for follow-up.`,
          href: `/app/finance/collections/${request.id}`,
          relatedEntityType: "payment_request",
          relatedEntityId: request.id,
          isRead: false,
          createdAt: createTimestamp()
        },
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "payment_request",
          entityId: request.id,
          action: "reminded",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Payment request reminder sent",
          summary: note?.trim() || `${request.reference} reminder sent.`,
          createdAt: createTimestamp()
        }
      })(current),
      paymentRequests: current.paymentRequests.map((entry) =>
        entry.id === request.id
          ? {
              ...entry,
              lastReminderAt: createTimestamp(),
              updatedAt: createTimestamp(),
              history: [
                ...entry.history,
                {
                  id: createId("payment-request-history"),
                  action: "reminded",
                  note: note?.trim(),
                  actorUserId: context.userId,
                  createdAt: createTimestamp()
                }
              ]
            }
          : entry
      )
    }));

    return { success: true, message: "Payment reminder logged." };
  };

  const linkPaymentRequestToPayment = (requestId: string, paymentId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_payment_requests")) {
      return { success: false, message: "You do not have access to link payments." };
    }

    const request = paymentRequests.find((entry) => entry.id === requestId);
    const payment = workspaceData.payments.find((entry) => entry.id === paymentId);
    if (!request || !payment) {
      return { success: false, message: "Payment request or payment was not found." };
    }
    if (payment.invoiceId !== request.invoiceId) {
      return { success: false, message: "The selected payment belongs to another invoice." };
    }

    const invoice = workspaceData.invoices.find(
      (invoiceRecord) => invoiceRecord.id === request.invoiceId
    );
    const requestIsPaid =
      payment.amount >= request.amountRequested ||
      (invoice ? getInvoiceOutstanding(invoice, workspaceData.payments) <= 0 : false);
    const nextStatus: PaymentRequest["status"] = requestIsPaid
      ? "paid"
      : request.status === "draft"
        ? "sent"
        : request.status;

    setState((current) => ({
      ...appendArtifacts({
        notification:
          nextStatus === "paid"
            ? {
                id: createId("finance-note"),
                workspaceId: context.workspaceId,
                type: "payment_request_paid",
                title: "Payment request settled",
                message: `${request.reference} is now linked to a received payment.`,
                href: `/app/finance/collections/${request.id}`,
                relatedEntityType: "payment_request",
                relatedEntityId: request.id,
                isRead: false,
                createdAt: createTimestamp()
              }
            : undefined,
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "payment_request",
          entityId: request.id,
          action: nextStatus === "paid" ? "matched" : "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Payment request linked to payment",
          summary: `${request.reference} was linked to ${payment.reference || payment.id}.`,
          createdAt: createTimestamp()
        }
      })(current),
      paymentRequests: current.paymentRequests.map((entry) =>
        entry.id === request.id
          ? {
              ...entry,
              linkedPaymentId: payment.id,
              status: nextStatus,
              updatedAt: createTimestamp(),
              history: [
                ...entry.history,
                {
                  id: createId("payment-request-history"),
                  action: "linked",
                  paymentId: payment.id,
                  actorUserId: context.userId,
                  createdAt: createTimestamp()
                },
                ...(nextStatus === "paid"
                  ? [
                      {
                        id: createId("payment-request-history"),
                        action: "paid" as const,
                        paymentId: payment.id,
                        actorUserId: context.userId,
                        createdAt: createTimestamp()
                      }
                    ]
                  : [])
              ]
            }
          : entry
      )
    }));

    return { success: true, message: "Payment request linked to payment." };
  };

  function upsertReconciliationRecord(
    record: ReconciliationRecord,
    payload: ReconciliationPayload,
    context: ReturnType<typeof ensureContext> & { ok: true }
  ) {
    const matchedAmount = Math.max(0, payload.matchedAmount ?? record.matchedAmount);
    const baseAmount =
      record.kind === "invoice_payment"
        ? workspaceData.payments.find((entry) => entry.id === record.paymentId)?.amount || 0
        : workspaceData.purchasePayments.find(
            (entry) => entry.id === record.purchasePaymentId
          )?.amount || 0;
    const unmatchedAmount = Math.max(baseAmount - matchedAmount, 0);
    const timestamp = createTimestamp();
    const historyAction: ReconciliationHistoryEntry["action"] =
      payload.status === "reconciled"
        ? "reconciled"
        : payload.status === "mismatch"
          ? "flagged"
          : payload.status === "partial"
            ? "matched"
            : "reopened";

    return {
      ...record,
      status: payload.status,
      matchedAmount,
      unmatchedAmount,
      note: payload.note?.trim() || record.note,
      reconciledBy: context.userId,
      reconciledAt: payload.status === "unreconciled" ? undefined : timestamp,
      lastEvaluatedAt: timestamp,
      updatedAt: timestamp,
      history: [
        ...record.history,
        {
          id: createId("reconciliation-history"),
          action: historyAction,
          note: payload.note?.trim(),
          actorUserId: context.userId,
          previousStatus: record.status,
          nextStatus: payload.status,
          createdAt: timestamp
        }
      ]
    };
  }

  const reconcilePayment = (paymentId: string, payload: ReconciliationPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_reconciliation")) {
      return { success: false, message: "You do not have access to reconcile payments." };
    }

    const payment = workspaceData.payments.find((entry) => entry.id === paymentId);
    const record = reconciliationRecords.find((entry) => entry.paymentId === paymentId);
    if (!payment || !record) {
      return { success: false, message: "Payment reconciliation record was not found." };
    }

    const nextRecord = upsertReconciliationRecord(record, payload, context);
    setState((current) => ({
      ...appendArtifacts({
        notification: {
          id: createId("finance-note"),
          workspaceId: context.workspaceId,
          type:
            payload.status === "mismatch"
              ? "payment_mismatch_detected"
              : payload.status === "reconciled"
                ? "payment_reconciled"
                : "payment_received_pending_reconciliation",
          title:
            payload.status === "mismatch"
              ? "Payment mismatch detected"
              : payload.status === "reconciled"
                ? "Payment reconciled"
                : "Payment reconciliation updated",
          message:
            payload.note?.trim() ||
            `${payment.reference || payment.id} is now ${payload.status.replaceAll("_", " ")}.`,
          href: "/app/finance/reconciliation",
          relatedEntityType: "reconciliation",
          relatedEntityId: record.id,
          isRead: false,
          createdAt: createTimestamp()
        },
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "reconciliation",
          entityId: record.id,
          action:
            payload.status === "reconciled"
              ? "reconciled"
              : payload.status === "mismatch"
                ? "flagged"
                : "matched",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Invoice payment reconciliation updated",
          summary: `${payment.reference || payment.id} changed to ${payload.status}.`,
          createdAt: createTimestamp()
        }
      })(current),
      reconciliationRecords: current.reconciliationRecords.map((entry) =>
        entry.id === record.id ? nextRecord : entry
      )
    }));

    return { success: true, message: "Payment reconciliation updated." };
  };

  const reconcilePurchasePayment = (
    purchasePaymentId: string,
    payload: ReconciliationPayload
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_reconciliation")) {
      return {
        success: false,
        message: "You do not have access to reconcile supplier payments."
      };
    }

    const payment = workspaceData.purchasePayments.find((entry) => entry.id === purchasePaymentId);
    const record = reconciliationRecords.find(
      (entry) => entry.purchasePaymentId === purchasePaymentId
    );
    if (!payment || !record) {
      return { success: false, message: "Supplier payment reconciliation was not found." };
    }

    const nextRecord = upsertReconciliationRecord(record, payload, context);
    setState((current) => ({
      ...appendArtifacts({
        notification: {
          id: createId("finance-note"),
          workspaceId: context.workspaceId,
          type:
            payload.status === "mismatch"
              ? "payment_mismatch_detected"
              : payload.status === "reconciled"
                ? "payment_reconciled"
                : "payment_received_pending_reconciliation",
          title: "Supplier payment reconciliation updated",
          message:
            payload.note?.trim() ||
            `${payment.reference || payment.id} is now ${payload.status.replaceAll("_", " ")}.`,
          href: "/app/finance/reconciliation",
          relatedEntityType: "reconciliation",
          relatedEntityId: record.id,
          visibleToRoles: ["owner", "admin", "manager"],
          isRead: false,
          createdAt: createTimestamp()
        },
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "reconciliation",
          entityId: record.id,
          action:
            payload.status === "reconciled"
              ? "reconciled"
              : payload.status === "mismatch"
                ? "flagged"
                : "matched",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Supplier payment reconciliation updated",
          summary: `${payment.reference || payment.id} changed to ${payload.status}.`,
          createdAt: createTimestamp()
        }
      })(current),
      reconciliationRecords: current.reconciliationRecords.map((entry) =>
        entry.id === record.id ? nextRecord : entry
      )
    }));

    return { success: true, message: "Supplier payment reconciliation updated." };
  };

  const updateSupplierCreditTerm = (
    supplierId: string,
    payload: SupplierCreditPayload
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_supplier_credit")) {
      return { success: false, message: "You do not have access to manage supplier credit." };
    }

    const existing = supplierCreditTerms.find((entry) => entry.supplierId === supplierId);
    const termId = existing?.id || createId("supplier-credit");
    setState((current) => ({
      ...appendArtifacts({
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "supplier_credit",
          entityId: termId,
          action: existing ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: existing ? "Supplier credit terms updated" : "Supplier credit terms created",
          summary: payload.notes?.trim() || "Supplier credit settings changed.",
          createdAt: createTimestamp()
        }
      })(current),
      supplierCreditTerms: existing
        ? current.supplierCreditTerms.map((entry) =>
            entry.id === existing.id
              ? {
                  ...entry,
                  ...payload,
                  notes: payload.notes?.trim(),
                  updatedAt: createTimestamp()
                }
              : entry
          )
        : [
            {
              id: termId,
              workspaceId: context.workspaceId,
              supplierId,
              ...payload,
              notes: payload.notes?.trim(),
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.supplierCreditTerms
          ]
    }));

    return { success: true, message: "Supplier credit terms updated." };
  };

  const setInvoiceCandidateSelection = (
    invoiceId: string,
    isSelected: boolean,
    note?: string
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_financing_readiness")) {
      return {
        success: false,
        message: "You do not have access to manage financing readiness."
      };
    }

    const existing = candidateSelections.find((entry) => entry.invoiceId === invoiceId);
    const selectionId = existing?.id || createId("candidate-selection");

    setState((current) => ({
      ...appendArtifacts({
        notification: isSelected
          ? {
              id: createId("finance-note"),
              workspaceId: context.workspaceId,
              type: "eligible_invoice_flagged",
              title: "Eligible invoice flagged",
              message: "Invoice was marked for future financing review.",
              href: "/app/finance/eligible-invoices",
              relatedEntityType: "invoice_financing_candidate",
              relatedEntityId: invoiceId,
              visibleToRoles: ["owner", "admin", "manager"],
              isRead: false,
              createdAt: createTimestamp()
            }
          : undefined,
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "invoice_financing_candidate",
          entityId: invoiceId,
          action: isSelected ? "flagged" : "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: isSelected
            ? "Invoice flagged for financing review"
            : "Invoice financing flag updated",
          summary: note?.trim() || "Invoice financing readiness flag changed.",
          createdAt: createTimestamp()
        }
      })(current),
      invoiceCandidateSelections: existing
        ? current.invoiceCandidateSelections.map((entry) =>
            entry.id === existing.id
              ? {
                  ...entry,
                  isSelected,
                  note: note?.trim(),
                  updatedAt: createTimestamp()
                }
              : entry
          )
        : [
            {
              id: selectionId,
              workspaceId: context.workspaceId,
              invoiceId,
              isSelected,
              note: note?.trim(),
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.invoiceCandidateSelections
          ]
    }));

    return {
      success: true,
      message: isSelected
        ? "Invoice added to financing review."
        : "Invoice removed from financing review."
    };
  };

  const captureReadinessSnapshot = (note?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_financing_readiness")) {
      return { success: false, message: "You do not have access to capture readiness." };
    }

    const lastEntry = readinessHistory[0];
    setState((current) => ({
      ...appendArtifacts({
        notification:
          lastEntry && lastEntry.readinessBand !== financialHealth.readinessBand
            ? {
                id: createId("finance-note"),
                workspaceId: context.workspaceId,
                type: "financing_readiness_changed",
                title: "Financing readiness changed",
                message: `Readiness moved to ${financialHealth.readinessBand}.`,
                href: "/app/finance/readiness",
                relatedEntityType: "financing_profile",
                relatedEntityId: context.workspaceId,
                visibleToRoles: ["owner", "admin", "manager"],
                isRead: false,
                createdAt: createTimestamp()
              }
            : undefined,
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "financing_profile",
          entityId: context.workspaceId,
          action: "generated",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Finance readiness snapshot captured",
          summary: note?.trim() || "Capital readiness snapshot saved.",
          createdAt: createTimestamp()
        }
      })(current),
      readinessHistory: [
        {
          id: createId("readiness-history"),
          workspaceId: context.workspaceId,
          generatedAt: createTimestamp(),
          capitalReadinessScore: financialHealth.capitalReadinessScore,
          readinessBand: financialHealth.readinessBand,
          note: note?.trim()
        },
        ...current.readinessHistory
      ]
    }));

    return { success: true, message: "Readiness snapshot captured." };
  };

  const generatePartnerFinancePackage = (note?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_partner_exports")) {
      return {
        success: false,
        message: "You do not have access to generate partner finance packages."
      };
    }

    const preview = createFinanceExportPreview({
      snapshot: financialHealth,
      candidates: eligibleInvoices,
      supplierCreditSummary
    });
    const packageId = createId("partner-package");
    const reference = createReference("FINPACK", partnerFinancePackages.length + 1);
    const includedInvoiceIds = preview.candidateInvoices.map((candidate) => candidate.invoiceId);

    setState((current) => ({
      ...appendArtifacts({
        audit: {
          id: createId("finance-audit"),
          workspaceId: context.workspaceId,
          entityType: "partner_package",
          entityId: packageId,
          action: "exported",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Partner-ready finance package generated",
          summary: note?.trim() || `${reference} was prepared for future partner sharing.`,
          createdAt: createTimestamp()
        }
      })(current),
      partnerFinancePackages: [
        {
          id: packageId,
          workspaceId: context.workspaceId,
          reference,
          status: "generated",
          consentMode: "internal_only",
          includedInvoiceIds,
          createdBy: context.userId,
          summaryNote:
            note?.trim() ||
            `Readiness ${preview.readinessBand} (${preview.readinessScore}/100).`,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp()
        },
        ...current.partnerFinancePackages
      ]
    }));

    return {
      success: true,
      message: "Partner-ready finance package generated.",
      id: packageId
    };
  };

  const markFinanceNotificationRead = (notificationId: string) => {
    setState((current) => ({
      ...current,
      financeNotifications: current.financeNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const markAllFinanceNotificationsRead = () => {
    if (!currentWorkspace) {
      return;
    }

    setState((current) => ({
      ...current,
      financeNotifications: current.financeNotifications.map((notification) =>
        notification.workspaceId === currentWorkspace.id
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const resetV5DemoState = () => {
    setState(seedFlowV5State);
  };

  return (
    <FlowV5Context.Provider
      value={{
        isHydrated,
        paymentRequests,
        openPaymentRequests,
        reconciliationRecords,
        supplierCreditTerms,
        eligibleInvoices,
        supplierCreditSummary,
        ledgerEntries,
        financialHealth,
        readinessHistory,
        partnerFinancePackages,
        financeNotifications,
        unreadFinanceCount,
        financeAuditLogs,
        financeSummary,
        getPaymentRequest,
        getPaymentRequestsForInvoice,
        getEffectivePaymentRequestStatus,
        getReconciliationForPayment,
        getReconciliationForPurchasePayment,
        getInvoiceReconciliationStatus,
        createPaymentRequest,
        markPaymentRequestViewed,
        sendPaymentRequestReminder,
        linkPaymentRequestToPayment,
        reconcilePayment,
        reconcilePurchasePayment,
        updateSupplierCreditTerm,
        setInvoiceCandidateSelection,
        captureReadinessSnapshot,
        generatePartnerFinancePackage,
        markFinanceNotificationRead,
        markAllFinanceNotificationsRead,
        resetV5DemoState
      }}
    >
      {children}
    </FlowV5Context.Provider>
  );
}

export function useFlowV5() {
  const context = useContext(FlowV5Context);
  if (!context) {
    throw new Error("useFlowV5 must be used within FlowV5Provider.");
  }

  return context;
}
