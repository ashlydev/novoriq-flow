import {
  formatCurrency,
  getCashPressureIndicator,
  getDocumentSummaryForRecord,
  getInvoiceOutstanding,
  getInvoiceStatus,
  getPaidAmount,
  getPurchaseOutstanding,
  getPurchasePaidAmount,
  getPurchaseStatus,
  isPurchaseDueSoon
} from "@/lib/calculations";
import {
  AuditLog,
  CashEntry,
  Customer,
  Expense,
  Invoice,
  Payment,
  Purchase,
  PurchasePayment,
  Supplier
} from "@/lib/types";
import {
  FinanceLedgerEntry,
  FinancialHealthSnapshot,
  FlowV5State,
  InvoiceCandidateSelection,
  InvoiceFinancingCandidate,
  PaymentRequest,
  PaymentRequestStatus,
  ReadinessSignal,
  ReconciliationRecord,
  SupplierCreditTerm
} from "@/lib/v5-types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function percentage(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

function diffDays(fromDate: string, toDate = new Date().toISOString()) {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(0, 0, 0, 0);
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function withinDays(dateValue: string, days: number) {
  const boundary = new Date();
  boundary.setDate(boundary.getDate() - days);
  return new Date(dateValue) >= boundary;
}

function getPaymentRequestSelection(
  selections: InvoiceCandidateSelection[],
  invoiceId: string
) {
  return selections.find((selection) => selection.invoiceId === invoiceId);
}

export function getPaymentRequestEffectiveStatus(
  request: PaymentRequest,
  invoice: Invoice | undefined,
  payments: Payment[]
): PaymentRequestStatus {
  if (request.status === "cancelled") {
    return "cancelled";
  }

  if (request.linkedPaymentId) {
    return "paid";
  }

  if (invoice && getInvoiceOutstanding(invoice, payments) <= 0) {
    return "paid";
  }

  if (request.expiresOn && new Date(request.expiresOn) < new Date()) {
    return "expired";
  }

  return request.status;
}

export function getReconciliationSummary(records: ReconciliationRecord[]) {
  const reconciled = records.filter((record) => record.status === "reconciled").length;
  const partial = records.filter((record) => record.status === "partial").length;
  const mismatch = records.filter((record) => record.status === "mismatch").length;
  const unreconciled = records.filter((record) => record.status === "unreconciled").length;

  return {
    total: records.length,
    reconciled,
    partial,
    mismatch,
    unreconciled,
    coverageRate: Math.round(percentage(reconciled, records.length))
  };
}

export function getFinanceLedgerEntries(params: {
  workspaceId?: string;
  payments: Payment[];
  invoices: Invoice[];
  customers: Customer[];
  purchasePayments: PurchasePayment[];
  purchases: Purchase[];
  suppliers: Supplier[];
  expenses: Expense[];
  cashEntries: CashEntry[];
}) {
  if (!params.workspaceId) {
    return [] as FinanceLedgerEntry[];
  }

  const invoiceEntries: FinanceLedgerEntry[] = params.payments.map((payment) => {
    const invoice = params.invoices.find((record) => record.id === payment.invoiceId);
    const customer = params.customers.find((record) => record.id === invoice?.customerId);

    return {
      id: `ledger-payment-${payment.id}`,
      workspaceId: params.workspaceId || "",
      sourceType: "invoice_collection" as const,
      sourceId: payment.id,
      direction: "inflow" as const,
      amount: payment.amount,
      occurredAt: payment.paymentDate,
      label: invoice?.reference || "Invoice collection",
      description: payment.notes,
      counterpartyName: customer?.name,
      reference: payment.reference,
      invoiceId: payment.invoiceId,
      status: "posted" as const
    };
  });

  const supplierPaymentEntries: FinanceLedgerEntry[] = params.purchasePayments.map((payment) => {
    const purchase = params.purchases.find((record) => record.id === payment.purchaseId);
    const supplier = params.suppliers.find((record) => record.id === purchase?.supplierId);

    return {
      id: `ledger-purchase-payment-${payment.id}`,
      workspaceId: params.workspaceId || "",
      sourceType: "supplier_payment" as const,
      sourceId: payment.id,
      direction: "outflow" as const,
      amount: payment.amount,
      occurredAt: payment.paymentDate,
      label: purchase?.reference || "Supplier payment",
      description: payment.notes,
      counterpartyName: supplier?.name,
      reference: payment.reference,
      purchaseId: payment.purchaseId,
      status: "posted" as const
    };
  });

  const expenseEntries: FinanceLedgerEntry[] = params.expenses.map((expense) => {
    const supplier = params.suppliers.find((record) => record.id === expense.supplierId);
    return {
      id: `ledger-expense-${expense.id}`,
      workspaceId: params.workspaceId || "",
      sourceType: "expense_outflow" as const,
      sourceId: expense.id,
      direction: "outflow" as const,
      amount: expense.amount,
      occurredAt: expense.expenseDate,
      label: expense.description,
      description: expense.notes,
      counterpartyName: supplier?.name,
      status: "posted" as const
    };
  });

  const cashEntries: FinanceLedgerEntry[] = params.cashEntries.map((entry) => ({
    id: `ledger-cash-${entry.id}`,
    workspaceId: params.workspaceId || "",
    sourceType: entry.type === "cash_in" ? ("cash_in" as const) : ("cash_out" as const),
    sourceId: entry.id,
    direction: entry.type === "cash_in" ? ("inflow" as const) : ("outflow" as const),
    amount: entry.amount,
    occurredAt: entry.entryDate,
    label: entry.category,
    description: entry.notes,
    status: "posted" as const
  }));

  return [...invoiceEntries, ...supplierPaymentEntries, ...expenseEntries, ...cashEntries].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );
}

export function getSupplierCreditSummary(params: {
  terms: SupplierCreditTerm[];
  suppliers: Supplier[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  dueSoonDays?: number;
}) {
  const dueSoonDays = params.dueSoonDays || 7;
  const rows = params.terms.map((term) => {
    const supplier = params.suppliers.find((record) => record.id === term.supplierId);
    const purchases = params.purchases.filter((purchase) => purchase.supplierId === term.supplierId);
    const outstanding = purchases.reduce(
      (total, purchase) => total + getPurchaseOutstanding(purchase, params.purchasePayments),
      0
    );
    const overdue = purchases
      .filter((purchase) => getPurchaseStatus(purchase, params.purchasePayments) === "overdue")
      .reduce(
        (total, purchase) => total + getPurchaseOutstanding(purchase, params.purchasePayments),
        0
      );
    const dueSoon = purchases
      .filter((purchase) => isPurchaseDueSoon(purchase, params.purchasePayments, dueSoonDays))
      .reduce(
        (total, purchase) => total + getPurchaseOutstanding(purchase, params.purchasePayments),
        0
      );

    return {
      term,
      supplier,
      purchases,
      outstanding,
      overdue,
      dueSoon
    };
  });

  return {
    rows,
    totalOutstanding: rows.reduce((total, row) => total + row.outstanding, 0),
    totalOverdue: rows.reduce((total, row) => total + row.overdue, 0),
    totalDueSoon: rows.reduce((total, row) => total + row.dueSoon, 0),
    pressureCount: rows.filter((row) => row.term.status === "pressure").length
  };
}

export function getInvoiceFinancingCandidates(params: {
  invoices: Invoice[];
  customers: Customer[];
  payments: Payment[];
  reconciliations: ReconciliationRecord[];
  selections: InvoiceCandidateSelection[];
}) {
  return params.invoices
    .map((invoice) => {
      const customer = params.customers.find((record) => record.id === invoice.customerId);
      const total = getDocumentSummaryForRecord(invoice).total;
      const outstanding = getInvoiceOutstanding(invoice, params.payments);
      const status = getInvoiceStatus(invoice, params.payments);
      const customerPaidInvoices = params.invoices.filter(
        (record) =>
          record.customerId === invoice.customerId &&
          record.id !== invoice.id &&
          getInvoiceStatus(record, params.payments) === "paid"
      ).length;
      const paymentCount = params.payments.filter((payment) => payment.invoiceId === invoice.id).length;
      const mismatchCount = params.reconciliations.filter(
        (record) => record.invoiceId === invoice.id && record.status === "mismatch"
      ).length;
      const daysOverdue = diffDays(invoice.dueDate);
      const reasons: string[] = [];
      const blockers: string[] = [];
      let score = 35;

      if (outstanding <= 0) {
        blockers.push("Invoice is already fully collected.");
      } else {
        reasons.push(`Outstanding value ${formatCurrency(outstanding, "USD")} still open.`);
      }

      if (outstanding >= 500) {
        score += 18;
        reasons.push("Invoice size is meaningful for future financing review.");
      } else if (outstanding >= 250) {
        score += 10;
      } else {
        blockers.push("Outstanding amount is still small for financing review.");
      }

      if (customerPaidInvoices >= 1) {
        score += 15;
        reasons.push("Customer has prior paid invoice history.");
      } else {
        blockers.push("Customer payment history is still limited.");
      }

      if (paymentCount > 0) {
        score += 10;
        reasons.push("There is already visible collection behavior on this invoice.");
      }

      if (status === "overdue" && daysOverdue > 7) {
        score -= 20;
        blockers.push("Invoice is materially overdue.");
      } else if (status !== "overdue") {
        score += 12;
        reasons.push("Invoice is still within an acceptable collection window.");
      }

      if (mismatchCount > 0) {
        score -= 18;
        blockers.push("Payment reconciliation mismatch still needs review.");
      } else {
        score += 10;
      }

      const selection = getPaymentRequestSelection(params.selections, invoice.id);
      const normalizedScore = clamp(score);
      const candidateStatus =
        blockers.length === 0 && normalizedScore >= 70
          ? "strong_candidate"
          : normalizedScore >= 45
            ? "review"
            : "not_ready";

      return {
        invoiceId: invoice.id,
        reference: invoice.reference,
        customerId: invoice.customerId,
        customerName: customer?.name || "Unknown customer",
        outstandingAmount: outstanding,
        status: candidateStatus,
        score: normalizedScore,
        reasons,
        blockers,
        selected: selection?.isSelected || false,
        readinessLabel:
          candidateStatus === "strong_candidate"
            ? "Strong candidate"
            : candidateStatus === "review"
              ? "Needs review"
              : "Not ready"
      } satisfies InvoiceFinancingCandidate;
    })
    .sort((left, right) => right.score - left.score);
}

export function getFinancialHealthSnapshot(params: {
  invoices: Invoice[];
  payments: Payment[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  expenses: Expense[];
  cashEntries: CashEntry[];
  reconciliations: ReconciliationRecord[];
  networkActivityCount?: number;
}) {
  const totalInvoiced = params.invoices.reduce(
    (total, invoice) => total + getDocumentSummaryForRecord(invoice).total,
    0
  );
  const totalCollected = params.payments.reduce((total, payment) => total + payment.amount, 0);
  const totalReceivables = params.invoices.reduce(
    (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
    0
  );
  const overdueReceivables = params.invoices
    .filter((invoice) => getInvoiceStatus(invoice, params.payments) === "overdue")
    .reduce(
      (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
      0
    );
  const totalPayables = params.purchases.reduce(
    (total, purchase) => total + getPurchaseOutstanding(purchase, params.purchasePayments),
    0
  );
  const overduePayables = params.purchases
    .filter((purchase) => getPurchaseStatus(purchase, params.purchasePayments) === "overdue")
    .reduce(
      (total, purchase) => total + getPurchaseOutstanding(purchase, params.purchasePayments),
      0
    );
  const totalExpenses = params.expenses.reduce((total, expense) => total + expense.amount, 0);
  const reconciliationSummary = getReconciliationSummary(params.reconciliations);
  const collectionRate = percentage(totalCollected, totalInvoiced);
  const receivableOverdueRate = percentage(overdueReceivables, totalReceivables || 1);
  const payableOverdueRate = percentage(overduePayables, totalPayables || 1);
  const expensePressure = totalCollected ? totalExpenses / totalCollected : 1;
  const financeEventCount = [
    ...params.payments.filter((payment) => withinDays(payment.createdAt, 90)),
    ...params.purchasePayments.filter((payment) => withinDays(payment.createdAt, 90)),
    ...params.expenses.filter((expense) => withinDays(expense.createdAt, 90)),
    ...params.cashEntries.filter((entry) => withinDays(entry.createdAt, 90))
  ].length;
  const cashPressure = getCashPressureIndicator({
    payments: params.payments,
    expenses: params.expenses,
    purchasePayments: params.purchasePayments
  });

  const receivablesQualityScore = Math.round(
    clamp(100 - receivableOverdueRate * 0.7 - percentage(totalReceivables, totalInvoiced || 1) * 0.2)
  );
  const payablesPressureScore = Math.round(clamp(100 - payableOverdueRate * 0.8));
  const collectionPerformanceScore = Math.round(clamp(collectionRate));
  const reconciliationCoverageScore = Math.round(
    clamp(reconciliationSummary.coverageRate - reconciliationSummary.mismatch * 8)
  );
  const expensePressureScore = Math.round(
    clamp(100 - Math.max(0, expensePressure - 0.35) * 90)
  );
  const activityScore = Math.round(
    clamp(financeEventCount * 6 + (params.networkActivityCount || 0) * 2)
  );
  const capitalReadinessScore = Math.round(
    clamp(
      receivablesQualityScore * 0.22 +
        payablesPressureScore * 0.18 +
        collectionPerformanceScore * 0.22 +
        reconciliationCoverageScore * 0.18 +
        expensePressureScore * 0.1 +
        activityScore * 0.1
    )
  );

  const readinessBand: FinancialHealthSnapshot["readinessBand"] =
    capitalReadinessScore >= 70
      ? "strong"
      : capitalReadinessScore >= 45
        ? "steady"
        : "building";

  const signals: ReadinessSignal[] = [
    {
      id: "receivables-quality",
      key: "receivables_quality",
      label: "Receivables quality",
      value: `${receivablesQualityScore}/100`,
      score: receivablesQualityScore,
      tone:
        receivablesQualityScore >= 70
          ? "success"
          : receivablesQualityScore >= 45
            ? "warning"
            : "danger",
      explanation: "Lower overdue exposure and healthier current invoices improve this."
    },
    {
      id: "collection-performance",
      key: "collection_performance",
      label: "Collection performance",
      value: `${Math.round(collectionRate)}%`,
      score: collectionPerformanceScore,
      tone:
        collectionPerformanceScore >= 70
          ? "success"
          : collectionPerformanceScore >= 45
            ? "warning"
            : "danger",
      explanation: "Collected cash versus invoiced value shows how reliably sales convert into cash."
    },
    {
      id: "reconciliation-coverage",
      key: "reconciliation_coverage",
      label: "Reconciliation coverage",
      value: `${reconciliationSummary.coverageRate}%`,
      score: reconciliationCoverageScore,
      tone:
        reconciliationCoverageScore >= 70
          ? "success"
          : reconciliationCoverageScore >= 45
            ? "warning"
            : "danger",
      explanation: "More reconciled payments reduce ambiguity for finance readiness."
    },
    {
      id: "supplier-pressure",
      key: "supplier_pressure",
      label: "Supplier pressure",
      value: `${payablesPressureScore}/100`,
      score: payablesPressureScore,
      tone:
        payablesPressureScore >= 70
          ? "success"
          : payablesPressureScore >= 45
            ? "warning"
            : "danger",
      explanation: "Lower overdue supplier balances improve supplier-credit readiness."
    },
    {
      id: "activity-level",
      key: "activity_level",
      label: "Business activity",
      value: `${activityScore}/100`,
      score: activityScore,
      tone:
        activityScore >= 70
          ? "success"
          : activityScore >= 45
            ? "warning"
            : "muted",
      explanation: "Consistent invoice, payment, purchase, and cash movement activity gives stronger operating evidence."
    }
  ];

  const strengths = signals
    .filter((signal) => signal.score >= 70)
    .map((signal) => `${signal.label} is holding up well.`);
  const improvements = [
    receivablesQualityScore < 60
      ? "Reduce overdue invoices and collect current receivables faster."
      : null,
    reconciliationCoverageScore < 70
      ? "Reconcile more payments so collections and references are easier to trust."
      : null,
    payablesPressureScore < 60
      ? "Bring overdue supplier obligations back under control."
      : null,
    expensePressureScore < 60
      ? "Keep expense growth aligned with collections."
      : null
  ].filter(Boolean) as string[];

  return {
    generatedAt: new Date().toISOString(),
    receivablesQualityScore,
    payablesPressureScore,
    collectionPerformanceScore,
    reconciliationCoverageScore,
    expensePressureScore,
    activityScore,
    capitalReadinessScore,
    readinessBand,
    cashPressureLabel: cashPressure.label,
    signals,
    strengths,
    improvements
  } satisfies FinancialHealthSnapshot;
}

export function getFinanceSummary(params: {
  paymentRequests: PaymentRequest[];
  invoices: Invoice[];
  payments: Payment[];
  reconciliations: ReconciliationRecord[];
  candidateSelections: InvoiceCandidateSelection[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  supplierCreditTerms: SupplierCreditTerm[];
}) {
  const openRequests = params.paymentRequests.filter((request) => {
    const invoice = params.invoices.find((record) => record.id === request.invoiceId);
    return ["draft", "sent", "viewed"].includes(
      getPaymentRequestEffectiveStatus(request, invoice, params.payments)
    );
  }).length;
  const paidRequests = params.paymentRequests.filter((request) => {
    const invoice = params.invoices.find((record) => record.id === request.invoiceId);
    return getPaymentRequestEffectiveStatus(request, invoice, params.payments) === "paid";
  }).length;
  const reconciliationSummary = getReconciliationSummary(params.reconciliations);
  const supplierCreditSummary = getSupplierCreditSummary({
    terms: params.supplierCreditTerms,
    suppliers: [],
    purchases: params.purchases,
    purchasePayments: params.purchasePayments
  });
  const candidateCount = getInvoiceFinancingCandidates({
    invoices: params.invoices,
    customers: [],
    payments: params.payments,
    reconciliations: params.reconciliations,
    selections: params.candidateSelections
  }).filter((candidate) => candidate.status !== "not_ready").length;

  return {
    openRequests,
    paidRequests,
    unreconciledCount: reconciliationSummary.unreconciled,
    mismatchCount: reconciliationSummary.mismatch,
    candidateCount,
    supplierCreditPressureCount: supplierCreditSummary.pressureCount
  };
}

export function mergeFinanceAuditLogs(
  baseLogs: AuditLog[],
  networkLogs: AuditLog[],
  financeLogs: AuditLog[]
) {
  return [...baseLogs, ...networkLogs, ...financeLogs].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function createFinanceExportPreview(params: {
  snapshot: FinancialHealthSnapshot;
  candidates: InvoiceFinancingCandidate[];
  supplierCreditSummary: ReturnType<typeof getSupplierCreditSummary>;
}) {
  return {
    readinessBand: params.snapshot.readinessBand,
    readinessScore: params.snapshot.capitalReadinessScore,
    candidateInvoices: params.candidates
      .filter((candidate) => candidate.selected || candidate.status === "strong_candidate")
      .slice(0, 5),
    supplierPressure: params.supplierCreditSummary.totalOverdue,
    improvementAreas: params.snapshot.improvements.slice(0, 3)
  };
}
