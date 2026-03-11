import {
  getInvoiceOutstanding,
  getInvoiceStatus,
  getInvoiceTotal,
  getPurchaseOutstanding,
  getPurchaseStatus,
  getPurchaseTotal,
  roundCurrency,
  startOfDay
} from "@/lib/calculations";
import {
  Expense,
  Invoice,
  Item,
  Payment,
  Purchase,
  PurchasePayment,
  Quote,
  Receipt
} from "@/lib/types";
import {
  ApprovalRequest,
  Branch,
  FlowV3State,
  ManagedRecordType,
  ProjectJob,
  RecordMeta,
  StockAdjustment,
  StockProfile,
  TeamMemberProfile
} from "@/lib/v3-types";

function daysBetween(fromDate: string, toDate: Date) {
  const left = startOfDay(new Date(fromDate)).getTime();
  const right = startOfDay(toDate).getTime();
  return Math.floor((left - right) / 86400000);
}

export function getPrimaryBranch(branches: Branch[], workspaceId?: string) {
  return branches.find((branch) => branch.workspaceId === workspaceId && branch.isPrimary);
}

export function getRecordMeta(
  recordMeta: RecordMeta[],
  entityType: ManagedRecordType,
  entityId: string
) {
  return recordMeta.find(
    (record) => record.entityType === entityType && record.entityId === entityId
  );
}

export function filterByBranch<T extends { id: string }>(
  records: T[],
  entityType: ManagedRecordType,
  recordMeta: RecordMeta[],
  branchId?: string
) {
  if (!branchId || branchId === "all") {
    return records;
  }

  return records.filter(
    (record) => getRecordMeta(recordMeta, entityType, record.id)?.branchId === branchId
  );
}

export function getUpcomingReceivables(params: {
  invoices: Invoice[];
  payments: Payment[];
  recordMeta: RecordMeta[];
  branchId?: string;
  days?: number;
}) {
  const today = new Date();
  return filterByBranch(params.invoices, "invoice", params.recordMeta, params.branchId)
    .map((invoice) => ({
      invoice,
      outstanding: getInvoiceOutstanding(invoice, params.payments),
      daysUntilDue: daysBetween(invoice.dueDate, today)
    }))
    .filter(
      (entry) =>
        entry.outstanding > 0 &&
        getInvoiceStatus(entry.invoice, params.payments) !== "draft" &&
        entry.daysUntilDue >= 0 &&
        entry.daysUntilDue <= (params.days || 30)
    )
    .sort((left, right) => left.daysUntilDue - right.daysUntilDue);
}

export function getUpcomingPayables(params: {
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  recordMeta: RecordMeta[];
  branchId?: string;
  days?: number;
}) {
  const today = new Date();
  return filterByBranch(params.purchases, "purchase", params.recordMeta, params.branchId)
    .map((purchase) => ({
      purchase,
      outstanding: getPurchaseOutstanding(purchase, params.purchasePayments),
      daysUntilDue: daysBetween(purchase.dueDate, today)
    }))
    .filter(
      (entry) =>
        entry.outstanding > 0 &&
        getPurchaseStatus(entry.purchase, params.purchasePayments) !== "draft" &&
        entry.daysUntilDue >= 0 &&
        entry.daysUntilDue <= (params.days || 30)
    )
    .sort((left, right) => left.daysUntilDue - right.daysUntilDue);
}

export function getCashFlowForecast(params: {
  invoices: Invoice[];
  payments: Payment[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  recordMeta: RecordMeta[];
  branchId?: string;
  days?: number;
}) {
  const upcomingReceivables = getUpcomingReceivables({
    invoices: params.invoices,
    payments: params.payments,
    recordMeta: params.recordMeta,
    branchId: params.branchId,
    days: params.days
  });
  const upcomingPayables = getUpcomingPayables({
    purchases: params.purchases,
    purchasePayments: params.purchasePayments,
    recordMeta: params.recordMeta,
    branchId: params.branchId,
    days: params.days
  });

  const receivableTotal = roundCurrency(
    upcomingReceivables.reduce((total, entry) => total + entry.outstanding, 0)
  );
  const payableTotal = roundCurrency(
    upcomingPayables.reduce((total, entry) => total + entry.outstanding, 0)
  );

  return {
    receivableTotal,
    payableTotal,
    projectedNet: roundCurrency(receivableTotal - payableTotal),
    upcomingReceivables,
    upcomingPayables
  };
}

export function getStockOnHand(params: {
  itemId: string;
  stockProfiles: StockProfile[];
  purchases: Purchase[];
  stockAdjustments: StockAdjustment[];
  branchId?: string;
  recordMeta: RecordMeta[];
}) {
  const profile = params.stockProfiles.find((record) => record.itemId === params.itemId);
  const openingQuantity = profile?.openingQuantity || 0;
  const purchasedQuantity = filterByBranch(
    params.purchases,
    "purchase",
    params.recordMeta,
    params.branchId
  )
    .filter((purchase) => purchase.status !== "draft")
    .reduce((total, purchase) => {
      const matchingQuantity = purchase.lineItems
        .filter((lineItem) => lineItem.itemId === params.itemId)
        .reduce((lineTotal, lineItem) => lineTotal + lineItem.quantity, 0);
      return total + matchingQuantity;
    }, 0);
  const adjustments = params.stockAdjustments
    .filter(
      (adjustment) =>
        adjustment.itemId === params.itemId &&
        (!params.branchId || params.branchId === "all" || adjustment.branchId === params.branchId)
    )
    .reduce(
      (total, adjustment) =>
        total + (adjustment.direction === "increase" ? adjustment.quantity : -adjustment.quantity),
      0
    );

  return roundCurrency(openingQuantity + purchasedQuantity + adjustments);
}

export function getLowStockItems(params: {
  items: Item[];
  stockProfiles: StockProfile[];
  purchases: Purchase[];
  stockAdjustments: StockAdjustment[];
  recordMeta: RecordMeta[];
  branchId?: string;
}) {
  return params.items
    .map((item) => {
      const profile = params.stockProfiles.find((record) => record.itemId === item.id);
      const quantity = getStockOnHand({
        itemId: item.id,
        stockProfiles: params.stockProfiles,
        purchases: params.purchases,
        stockAdjustments: params.stockAdjustments,
        branchId: params.branchId,
        recordMeta: params.recordMeta
      });

      return {
        item,
        profile,
        quantity,
        status:
          !profile?.isTracked
            ? "not_tracked"
            : quantity <= 0
              ? "out_of_stock"
              : quantity <= profile.reorderLevel
                ? "low_stock"
                : "healthy"
      };
    })
    .filter((entry) => entry.profile?.isTracked)
    .sort((left, right) => left.quantity - right.quantity);
}

export function getBranchSummaries(params: {
  branches: Branch[];
  recordMeta: RecordMeta[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
}) {
  return params.branches
    .filter((branch) => branch.status === "active")
    .map((branch) => {
      const invoices = filterByBranch(params.invoices, "invoice", params.recordMeta, branch.id);
      const expenses = filterByBranch(params.expenses, "expense", params.recordMeta, branch.id);
      const purchases = filterByBranch(params.purchases, "purchase", params.recordMeta, branch.id);
      const receivables = invoices.reduce(
        (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
        0
      );
      const payables = purchases.reduce(
        (total, purchase) => total + getPurchaseOutstanding(purchase, params.purchasePayments),
        0
      );
      const revenue = invoices.reduce((total, invoice) => total + getInvoiceTotal(invoice), 0);
      const spend = expenses.reduce((total, expense) => total + expense.amount, 0);

      return {
        branch,
        revenue: roundCurrency(revenue),
        receivables: roundCurrency(receivables),
        payables: roundCurrency(payables),
        expenses: roundCurrency(spend)
      };
    })
    .sort((left, right) => right.revenue - left.revenue);
}

export function getProjectSummary(params: {
  project: ProjectJob;
  recordMeta: RecordMeta[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
}) {
  const invoiceIds = params.recordMeta
    .filter((record) => record.entityType === "invoice" && record.projectId === params.project.id)
    .map((record) => record.entityId);
  const expenseIds = params.recordMeta
    .filter((record) => record.entityType === "expense" && record.projectId === params.project.id)
    .map((record) => record.entityId);
  const purchaseIds = params.recordMeta
    .filter((record) => record.entityType === "purchase" && record.projectId === params.project.id)
    .map((record) => record.entityId);

  const invoices = params.invoices.filter((invoice) => invoiceIds.includes(invoice.id));
  const expenses = params.expenses.filter((expense) => expenseIds.includes(expense.id));
  const purchases = params.purchases.filter((purchase) => purchaseIds.includes(purchase.id));

  const invoicedRevenue = roundCurrency(
    invoices.reduce((total, invoice) => total + getInvoiceTotal(invoice), 0)
  );
  const collectedRevenue = roundCurrency(
    invoices.reduce((total, invoice) => total + (getInvoiceTotal(invoice) - getInvoiceOutstanding(invoice, params.payments)), 0)
  );
  const directExpenses = roundCurrency(
    expenses.reduce((total, expense) => total + expense.amount, 0)
  );
  const directPurchases = roundCurrency(
    purchases.reduce((total, purchase) => total + getPurchaseTotal(purchase), 0)
  );

  return {
    project: params.project,
    invoicedRevenue,
    collectedRevenue,
    costBase: roundCurrency(directExpenses + directPurchases),
    estimatedProfit: roundCurrency(collectedRevenue - directExpenses - directPurchases),
    expenseCount: expenses.length,
    purchaseCount: purchases.length,
    invoiceCount: invoices.length
  };
}

export function getProjectSummaries(params: {
  projects: ProjectJob[];
  recordMeta: RecordMeta[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
}) {
  return params.projects.map((project) =>
    getProjectSummary({
      project,
      recordMeta: params.recordMeta,
      invoices: params.invoices,
      payments: params.payments,
      expenses: params.expenses,
      purchases: params.purchases,
      purchasePayments: params.purchasePayments
    })
  );
}

export function getApprovalCounts(approvals: ApprovalRequest[]) {
  return approvals.reduce(
    (accumulator, approval) => {
      accumulator[approval.status] += 1;
      return accumulator;
    },
    {
      pending: 0,
      approved: 0,
      rejected: 0
    }
  );
}

export function mergeOperationalAlerts(
  persisted: FlowV3State["operationalAlerts"],
  generated: FlowV3State["operationalAlerts"]
) {
  const byId = new Map<string, FlowV3State["operationalAlerts"][number]>();
  [...generated, ...persisted].forEach((alert) => {
    const existing = byId.get(alert.id);
    byId.set(alert.id, existing ? { ...existing, ...alert } : alert);
  });
  return Array.from(byId.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function getRecentUserActivity(
  teamProfiles: TeamMemberProfile[],
  actorId?: string
) {
  const profile = teamProfiles.find((record) => record.userId === actorId);
  return profile?.lastActiveAt;
}

export function getBranchRecordCount(params: {
  branchId: string;
  recordMeta: RecordMeta[];
  entityType: ManagedRecordType;
}) {
  return params.recordMeta.filter(
    (record) => record.branchId === params.branchId && record.entityType === params.entityType
  ).length;
}

export function getDocumentUsageCount(documents: FlowV3State["vaultDocuments"], projectId?: string) {
  if (!projectId) {
    return documents.length;
  }

  return documents.filter((document) => document.projectId === projectId).length;
}

export function getRecordCountsByProject(
  projectId: string,
  recordMeta: RecordMeta[]
) {
  const scoped = recordMeta.filter((record) => record.projectId === projectId);
  return {
    invoices: scoped.filter((record) => record.entityType === "invoice").length,
    expenses: scoped.filter((record) => record.entityType === "expense").length,
    purchases: scoped.filter((record) => record.entityType === "purchase").length
  };
}

export function filterRecordSetByMeta<T extends { id: string }>(params: {
  records: T[];
  entityType: ManagedRecordType;
  recordMeta: RecordMeta[];
  branchId?: string;
  projectId?: string;
}) {
  return params.records.filter((record) => {
    const meta = getRecordMeta(params.recordMeta, params.entityType, record.id);
    const matchesBranch =
      !params.branchId || params.branchId === "all" ? true : meta?.branchId === params.branchId;
    const matchesProject = !params.projectId ? true : meta?.projectId === params.projectId;
    return matchesBranch && matchesProject;
  });
}

export function getLinkedRecordCounts(params: {
  projectId: string;
  invoices: Invoice[];
  expenses: Expense[];
  purchases: Purchase[];
  recordMeta: RecordMeta[];
}) {
  return {
    invoices: filterRecordSetByMeta({
      records: params.invoices,
      entityType: "invoice",
      recordMeta: params.recordMeta,
      projectId: params.projectId
    }),
    expenses: filterRecordSetByMeta({
      records: params.expenses,
      entityType: "expense",
      recordMeta: params.recordMeta,
      projectId: params.projectId
    }),
    purchases: filterRecordSetByMeta({
      records: params.purchases,
      entityType: "purchase",
      recordMeta: params.recordMeta,
      projectId: params.projectId
    })
  };
}

export function getRecordLabel(recordType: ManagedRecordType) {
  return recordType.replace("_", " ");
}

export function getBaseRecordOptions(params: {
  quotes: Quote[];
  invoices: Invoice[];
  payments: Payment[];
  receipts: Receipt[];
  expenses: Expense[];
  purchases: Purchase[];
}) {
  return {
    quotes: params.quotes.map((record) => ({
      id: record.id,
      label: record.reference
    })),
    invoices: params.invoices.map((record) => ({
      id: record.id,
      label: record.reference
    })),
    payments: params.payments.map((record) => ({
      id: record.id,
      label: record.reference || record.id
    })),
    receipts: params.receipts.map((record) => ({
      id: record.id,
      label: record.reference
    })),
    expenses: params.expenses.map((record) => ({
      id: record.id,
      label: record.description
    })),
    purchases: params.purchases.map((record) => ({
      id: record.id,
      label: record.reference
    }))
  };
}
