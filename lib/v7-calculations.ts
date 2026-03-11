import {
  formatCurrency,
  getInvoiceOutstanding,
  getInvoiceStatus,
  getPurchaseOutstanding,
  getPurchaseStatus,
  roundCurrency
} from "@/lib/calculations";
import {
  Activity,
  AuditLog,
  Customer,
  Expense,
  Invoice,
  Payment,
  Purchase,
  PurchasePayment,
  Supplier,
  UserRole
} from "@/lib/types";
import { ApprovalRequest, Branch } from "@/lib/v3-types";
import { NetworkPurchaseOrder } from "@/lib/v4-types";
import { FinancialHealthSnapshot } from "@/lib/v5-types";
import { EnterpriseReview } from "@/lib/v6-types";
import {
  ActionTask,
  AnomalyEvent,
  AssistantIntent,
  AssistantSource,
  IntelligentSummary,
  PredictiveInsight,
  Recommendation
} from "@/lib/v7-types";

interface AssistantAnswerResult {
  intent: AssistantIntent;
  answer: string;
  hardFacts: string[];
  derivedInsights: string[];
  followUps: string[];
  sources: AssistantSource[];
}

function startOfDay(dateValue: string | Date) {
  const date = typeof dateValue === "string" ? new Date(dateValue) : new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function diffDays(fromDate: string, toDate = new Date().toISOString()) {
  return Math.floor(
    (startOfDay(toDate).getTime() - startOfDay(fromDate).getTime()) / 86400000
  );
}

function isWithinWindow(dateValue: string, days: number, endDate = new Date()) {
  const value = new Date(dateValue).getTime();
  const end = endDate.getTime();
  const start = new Date(endDate);
  start.setDate(start.getDate() - days);
  return value >= start.getTime() && value <= end;
}

function sumByWindow<T>(
  rows: T[],
  getDate: (row: T) => string,
  getAmount: (row: T) => number,
  days: number,
  offsetDays = 0
) {
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return roundCurrency(
    rows.reduce((total, row) => {
      const dateValue = getDate(row);
      const amount = getAmount(row);
      if (!dateValue) {
        return total;
      }
      const when = new Date(dateValue).getTime();
      return when >= start.getTime() && when <= end.getTime() ? total + amount : total;
    }, 0)
  );
}

function filterVisibleToRole<T extends { visibleToRoles?: UserRole[] }>(
  rows: T[],
  role?: UserRole
) {
  return rows.filter((row) => !row.visibleToRoles || !role || row.visibleToRoles.includes(role));
}

function sortByCreatedDesc<T extends { createdAt: string }>(rows: T[]) {
  return [...rows].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function getTopOverdueCustomers(params: {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
}) {
  return params.customers
    .map((customer) => {
      const overdueInvoices = params.invoices.filter(
        (invoice) =>
          invoice.customerId === customer.id &&
          getInvoiceStatus(invoice, params.payments) === "overdue"
      );
      const amount = roundCurrency(
        overdueInvoices.reduce(
          (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
          0
        )
      );
      return { customer, amount, overdueInvoices };
    })
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount);
}

export function getDetectedAnomalies(params: {
  workspaceId: string;
  currency: string;
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  approvals: ApprovalRequest[];
  reviews: EnterpriseReview[];
  branchComparisons: Array<{
    branch: Branch;
    revenue: number;
    payables: number;
    riskScore: number;
    riskLabel: string;
    control?: { riskLevel: "stable" | "watch" | "risk" };
  }>;
  purchaseOrders: NetworkPurchaseOrder[];
  financeSummary: {
    mismatchCount: number;
    unreconciledCount: number;
    openPaymentRequests: number;
  };
}) {
  const anomalies: AnomalyEvent[] = [];
  const expenseLast7 = sumByWindow(params.expenses, (row) => row.expenseDate, (row) => row.amount, 7, 0);
  const expensePrev7 = sumByWindow(params.expenses, (row) => row.expenseDate, (row) => row.amount, 7, 7);
  if (expenseLast7 > 0 && expensePrev7 > 0 && expenseLast7 >= expensePrev7 * 1.35) {
    anomalies.push({
      id: "anomaly-expense-spike",
      workspaceId: params.workspaceId,
      type: "expense_spike",
      title: "Expenses jumped above the recent baseline",
      summary: `The last 7 days of expenses reached ${formatCurrency(expenseLast7, params.currency)} compared with ${formatCurrency(expensePrev7, params.currency)} in the prior 7 days.`,
      explanation:
        "This alert compares the last 7 days against the previous 7-day period and flags a significant increase.",
      tone: expenseLast7 >= expensePrev7 * 1.75 ? "danger" : "warning",
      status: "open",
      metricLabel: "Last 7 days",
      metricValue: formatCurrency(expenseLast7, params.currency),
      href: "/app/expenses",
      relatedEntityType: "expense",
      detectedAt: new Date().toISOString()
    });
  }

  const collectionsLast7 = sumByWindow(params.payments, (row) => row.paymentDate, (row) => row.amount, 7, 0);
  const collectionsPrev7 = sumByWindow(params.payments, (row) => row.paymentDate, (row) => row.amount, 7, 7);
  if (
    collectionsPrev7 >= 300 &&
    collectionsLast7 >= 0 &&
    collectionsLast7 <= collectionsPrev7 * 0.7
  ) {
    anomalies.push({
      id: "anomaly-collections-drop",
      workspaceId: params.workspaceId,
      type: "collections_drop",
      title: "Collections have slowed materially",
      summary: `Collections over the last 7 days were ${formatCurrency(collectionsLast7, params.currency)} versus ${formatCurrency(collectionsPrev7, params.currency)} in the prior 7 days.`,
      explanation:
        "This alert is triggered when recent collections fall materially below the previous weekly run rate.",
      tone: "warning",
      status: "open",
      metricLabel: "Collections",
      metricValue: formatCurrency(collectionsLast7, params.currency),
      href: "/app/receivables",
      relatedEntityType: "payment",
      detectedAt: new Date().toISOString()
    });
  }

  const overdueInvoices = params.invoices.filter(
    (invoice) => getInvoiceStatus(invoice, params.payments) === "overdue"
  );
  const overdueAmount = roundCurrency(
    overdueInvoices.reduce(
      (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
      0
    )
  );
  if (overdueInvoices.length >= 2 && overdueAmount > 0) {
    anomalies.push({
      id: "anomaly-overdue-growth",
      workspaceId: params.workspaceId,
      type: "overdue_growth",
      title: "Overdue receivables need attention",
      summary: `${overdueInvoices.length} invoices are overdue with ${formatCurrency(overdueAmount, params.currency)} still outstanding.`,
      explanation:
        "This alert uses current overdue invoice count and total outstanding amount, not a predictive model.",
      tone: overdueInvoices.length >= 4 ? "danger" : "warning",
      status: "open",
      metricLabel: "Overdue outstanding",
      metricValue: formatCurrency(overdueAmount, params.currency),
      href: "/app/unpaid",
      relatedEntityType: "invoice",
      detectedAt: new Date().toISOString()
    });
  }

  const delayedApprovals = params.approvals.filter(
    (approval) => approval.status === "pending" && diffDays(approval.createdAt) >= 3
  );
  const delayedReviews = params.reviews.filter(
    (review) => review.status === "pending_review" && diffDays(review.createdAt) >= 3
  );
  if (delayedApprovals.length || delayedReviews.length) {
    anomalies.push({
      id: "anomaly-approval-delay",
      workspaceId: params.workspaceId,
      type: "approval_delay",
      title: "Approval queue is slowing down",
      summary: `${delayedApprovals.length + delayedReviews.length} approval items have been pending for 3 or more days.`,
      explanation:
        "The queue is flagged when classic approvals or maker-checker reviews stay pending beyond the configured attention window.",
      tone: delayedReviews.length >= 2 ? "danger" : "warning",
      status: "open",
      metricLabel: "Delayed approvals",
      metricValue: String(delayedApprovals.length + delayedReviews.length),
      href: "/app/reviews",
      relatedEntityType: "review_request",
      detectedAt: new Date().toISOString()
    });
  }

  params.branchComparisons
    .filter((row) => row.control?.riskLevel === "risk" || row.riskScore >= 5)
    .forEach((row) => {
      anomalies.push({
        id: `anomaly-branch-${row.branch.id}`,
        workspaceId: params.workspaceId,
        type: "branch_underperformance",
        title: `${row.branch.name} needs branch-level attention`,
        summary: `${row.branch.name} is showing ${row.riskLabel.toLowerCase()} with payables at ${formatCurrency(row.payables, params.currency)} against revenue of ${formatCurrency(row.revenue, params.currency)}.`,
        explanation:
          "This branch alert is driven by the existing branch control score and branch payables versus revenue.",
        tone: "danger",
        status: "open",
        branchId: row.branch.id,
        metricLabel: "Risk score",
        metricValue: String(row.riskScore),
        href: "/app/branch-comparison",
        relatedEntityType: "branch_control",
        relatedEntityId: row.branch.id,
        detectedAt: new Date().toISOString()
      });
    });

  const rejectedOrdersBySupplier = params.purchaseOrders.reduce<Record<string, number>>(
    (accumulator, order) => {
      if (order.status === "rejected" || order.status === "cancelled") {
        accumulator[order.supplierBusinessId] =
          (accumulator[order.supplierBusinessId] || 0) + 1;
      }
      return accumulator;
    },
    {}
  );
  Object.entries(rejectedOrdersBySupplier)
    .filter(([, count]) => count >= 2)
    .forEach(([supplierBusinessId, count]) => {
      anomalies.push({
        id: `anomaly-supplier-rejections-${supplierBusinessId}`,
        workspaceId: params.workspaceId,
        type: "supplier_rejection_pattern",
        title: "Supplier relationship shows repeated order rejection",
        summary: `${count} purchase orders were rejected or cancelled by the same supplier relationship.`,
        explanation:
          "This pattern is factual platform history, not a rating. It is meant to prompt supplier review.",
        tone: "warning",
        status: "open",
        metricLabel: "Rejected orders",
        metricValue: String(count),
        href: "/app/network/activity",
        relatedEntityType: "purchase_order",
        relatedEntityId: supplierBusinessId,
        detectedAt: new Date().toISOString()
      });
    });

  if (params.financeSummary.mismatchCount > 0) {
    anomalies.push({
      id: "anomaly-reconciliation-mismatch",
      workspaceId: params.workspaceId,
      type: "reconciliation_mismatch",
      title: "Reconciliation mismatches are open",
      summary: `${params.financeSummary.mismatchCount} finance records are still mismatched and need review.`,
      explanation:
        "This alert uses actual reconciliation state from finance records and does not assume automated matching accuracy.",
      tone: "danger",
      status: "open",
      metricLabel: "Mismatch count",
      metricValue: String(params.financeSummary.mismatchCount),
      href: "/app/finance/reconciliation",
      relatedEntityType: "reconciliation",
      detectedAt: new Date().toISOString()
    });
  }

  const partialInvoices = params.invoices.filter(
    (invoice) => getInvoiceStatus(invoice, params.payments) === "partial"
  );
  if (partialInvoices.length >= 2 && overdueInvoices.length > 0) {
    anomalies.push({
      id: "anomaly-payment-behavior",
      workspaceId: params.workspaceId,
      type: "payment_behavior_change",
      title: "Customer payment behavior is fragmenting",
      summary: `${partialInvoices.length} invoices are partially paid while ${overdueInvoices.length} invoices are already overdue.`,
      explanation:
        "This alert highlights a shift from complete payment behavior toward split or delayed settlement.",
      tone: "warning",
      status: "open",
      metricLabel: "Partial invoices",
      metricValue: String(partialInvoices.length),
      href: "/app/receivables",
      relatedEntityType: "payment",
      detectedAt: new Date().toISOString()
    });
  }

  return anomalies;
}

export function getRecommendations(params: {
  workspaceId: string;
  currency: string;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  branches: Branch[];
  branchComparisons: Array<{
    branch: Branch;
    riskScore: number;
    riskLabel: string;
    control?: { riskLevel: "stable" | "watch" | "risk" };
  }>;
  reviews: EnterpriseReview[];
  lowStockItems: Array<{
    item: { id: string; name: string };
    status: "healthy" | "low" | "out";
  }>;
  eligibleInvoices: Array<{
    invoiceId: string;
    reference: string;
    score: number;
    status: "strong_candidate" | "review" | "not_ready";
    readinessLabel: string;
  }>;
  financeSummary: {
    mismatchCount: number;
    unreconciledCount: number;
  };
  supplierCreditSummary: {
    rows: Array<{
      term: { supplierId: string; status: "healthy" | "watch" | "pressure" };
      supplier?: Supplier;
      outstanding: number;
      overdue: number;
      dueSoon: number;
    }>;
  };
}) {
  const recommendations: Recommendation[] = [];
  const topCustomer = getTopOverdueCustomers({
    customers: params.customers,
    invoices: params.invoices,
    payments: params.payments
  })[0];
  if (topCustomer) {
    recommendations.push({
      id: `recommendation-collections-${topCustomer.customer.id}`,
      workspaceId: params.workspaceId,
      category: "collections",
      title: `Follow up ${topCustomer.customer.name} first`,
      summary: `${topCustomer.customer.name} has the highest overdue exposure at ${formatCurrency(topCustomer.amount, params.currency)}.`,
      explanation:
        "This recommendation ranks customers by current overdue balance, not by opinion or a hidden score.",
      priority: "high",
      href: "/app/receivables",
      relatedEntityType: "customer",
      relatedEntityId: topCustomer.customer.id,
      visibleToRoles: ["owner", "admin", "manager"],
      createdAt: new Date().toISOString()
    });
  }

  const pressuredSupplier = [...params.supplierCreditSummary.rows]
    .filter((row) => row.overdue > 0 || row.term.status === "pressure")
    .sort((left, right) => right.overdue - left.overdue)[0];
  if (pressuredSupplier) {
    recommendations.push({
      id: `recommendation-payables-${pressuredSupplier.term.supplierId}`,
      workspaceId: params.workspaceId,
      category: "payables",
      title: `Prioritize ${pressuredSupplier.supplier?.name || "supplier"} payables`,
      summary: `${formatCurrency(pressuredSupplier.overdue || pressuredSupplier.outstanding, params.currency)} is already overdue or under supplier pressure.`,
      explanation:
        "This recommendation uses supplier credit status and current payable exposure from recorded purchases and payments.",
      priority: "high",
      href: "/app/finance/supplier-credit",
      relatedEntityType: "supplier_credit",
      relatedEntityId: pressuredSupplier.term.supplierId,
      visibleToRoles: ["owner", "admin", "manager"],
      createdAt: new Date().toISOString()
    });
  }

  const riskyBranch = [...params.branchComparisons].sort(
    (left, right) => right.riskScore - left.riskScore
  )[0];
  if (riskyBranch && riskyBranch.riskScore >= 3) {
    recommendations.push({
      id: `recommendation-branch-${riskyBranch.branch.id}`,
      workspaceId: params.workspaceId,
      category: "branch",
      title: `${riskyBranch.branch.name} needs a branch review`,
      summary: `${riskyBranch.branch.name} currently carries ${riskyBranch.riskLabel.toLowerCase()}.`,
      explanation:
        "This recommendation is grounded in branch comparison data and the existing branch control score.",
      priority: riskyBranch.riskScore >= 5 ? "high" : "medium",
      href: "/app/branch-comparison",
      relatedEntityType: "branch_control",
      relatedEntityId: riskyBranch.branch.id,
      visibleToRoles: ["owner", "admin", "manager"],
      createdAt: new Date().toISOString()
    });
  }

  const pendingReview = params.reviews.find((review) => review.status === "pending_review");
  if (pendingReview) {
    recommendations.push({
      id: `recommendation-review-${pendingReview.id}`,
      workspaceId: params.workspaceId,
      category: "approvals",
      title: "Clear the oldest pending maker-checker review",
      summary: `${pendingReview.title} is still waiting for review.`,
      explanation:
        "This recommendation points to the live maker-checker queue and helps shorten approval bottlenecks.",
      priority: diffDays(pendingReview.createdAt) >= 3 ? "high" : "medium",
      href: "/app/reviews",
      relatedEntityType: "review_request",
      relatedEntityId: pendingReview.id,
      visibleToRoles: ["owner", "admin", "manager"],
      createdAt: new Date().toISOString()
    });
  }

  const stockIssue = params.lowStockItems.find((entry) => entry.status !== "healthy");
  if (stockIssue) {
    recommendations.push({
      id: `recommendation-stock-${stockIssue.item.id}`,
      workspaceId: params.workspaceId,
      category: "stock",
      title: `Reorder ${stockIssue.item.name} soon`,
      summary: `${stockIssue.item.name} is now ${stockIssue.status === "out" ? "out of stock" : "below reorder level"}.`,
      explanation:
        "This recommendation uses the item stock status already tracked in the inventory-lite layer.",
      priority: stockIssue.status === "out" ? "high" : "medium",
      href: "/app/stock",
      relatedEntityType: "item",
      relatedEntityId: stockIssue.item.id,
      visibleToRoles: ["owner", "admin", "manager", "staff"] as UserRole[],
      createdAt: new Date().toISOString()
    });
  }

  const strongCandidate = params.eligibleInvoices.find(
    (entry) => entry.status === "strong_candidate"
  );
  if (strongCandidate) {
    recommendations.push({
      id: `recommendation-finance-${strongCandidate.invoiceId}`,
      workspaceId: params.workspaceId,
      category: "finance",
      title: `Review ${strongCandidate.reference} for readiness`,
      summary: `${strongCandidate.reference} is marked ${strongCandidate.readinessLabel.toLowerCase()} with score ${strongCandidate.score}.`,
      explanation:
        "This recommendation comes from the existing invoice-readiness rules and is not a lending approval.",
      priority: strongCandidate.score >= 75 ? "medium" : "low",
      href: "/app/finance/eligible-invoices",
      relatedEntityType: "invoice_financing_candidate",
      relatedEntityId: strongCandidate.invoiceId,
      visibleToRoles: ["owner", "admin"],
      createdAt: new Date().toISOString()
    });
  }

  if (params.financeSummary.mismatchCount || params.financeSummary.unreconciledCount) {
    recommendations.push({
      id: "recommendation-reconciliation",
      workspaceId: params.workspaceId,
      category: "finance",
      title: "Close reconciliation gaps",
      summary: `${params.financeSummary.mismatchCount} mismatches and ${params.financeSummary.unreconciledCount} unreconciled records are still open.`,
      explanation:
        "This recommendation is based directly on finance reconciliation state.",
      priority: params.financeSummary.mismatchCount > 0 ? "high" : "medium",
      href: "/app/finance/reconciliation",
      relatedEntityType: "reconciliation",
      createdAt: new Date().toISOString()
    });
  }

  return recommendations;
}

export function getPredictiveInsights(params: {
  workspaceId: string;
  currency: string;
  dashboardMetrics: {
    totalUnpaid: number;
    overdueCount: number;
    dueSoonCount: number;
  };
  cashFlowForecast: {
    receivableTotal: number;
    payableTotal: number;
    projectedNet: number;
  };
  executiveSummary: {
    pendingReviews: number;
    riskyBranches: number;
  };
  financeSummary: {
    mismatchCount: number;
    unreconciledCount: number;
    openPaymentRequests: number;
  };
  financialHealth: FinancialHealthSnapshot;
  supplierCreditSummary: {
    totalOutstanding: number;
    totalOverdue: number;
  };
}) {
  const now = new Date().toISOString();
  const insights: PredictiveInsight[] = [];

  insights.push({
    id: "predictive-cash-pressure",
    workspaceId: params.workspaceId,
    type: "cash_pressure",
    title: "Near-term cash pressure outlook",
    summary:
      params.cashFlowForecast.projectedNet >= 0
        ? `Expected receivables still cover expected payables by ${formatCurrency(params.cashFlowForecast.projectedNet, params.currency)}.`
        : `Expected payables exceed expected receivables by ${formatCurrency(Math.abs(params.cashFlowForecast.projectedNet), params.currency)}.`,
    explanation:
      "This view is predictive because it is built from due-date-based receivable and payable forecasts, not actual future cash movements.",
    tone: params.cashFlowForecast.projectedNet >= 0 ? "success" : "danger",
    horizonLabel: "Next due-date cycle",
    visibleToRoles: ["owner", "admin", "manager"],
    createdAt: now
  });

  insights.push({
    id: "predictive-overdue-growth",
    workspaceId: params.workspaceId,
    type: "overdue_growth",
    title: "Overdue growth risk",
    summary:
      params.dashboardMetrics.dueSoonCount > 0
        ? `${params.dashboardMetrics.dueSoonCount} invoices are due soon and ${params.dashboardMetrics.overdueCount} are already overdue.`
        : `${params.dashboardMetrics.overdueCount} invoices are already overdue with no immediate due-soon buffer.`,
    explanation:
      "This risk indicator combines current overdue invoices with invoices due soon. It is a forward-looking warning, not a certainty.",
    tone:
      params.dashboardMetrics.overdueCount >= 3 || params.dashboardMetrics.totalUnpaid > 0
        ? "warning"
        : "muted",
    horizonLabel: "Next 7-14 days",
    visibleToRoles: ["owner", "admin", "manager"],
    createdAt: now
  });

  insights.push({
    id: "predictive-approval-backlog",
    workspaceId: params.workspaceId,
    type: "approval_backlog",
    title: "Approval backlog risk",
    summary:
      params.executiveSummary.pendingReviews > 0
        ? `${params.executiveSummary.pendingReviews} maker-checker items are still pending.`
        : "Approval backlog looks controlled right now.",
    explanation:
      "This indicator is driven by the current approval queue depth and helps warn when operational blockers could widen.",
    tone: params.executiveSummary.pendingReviews > 0 ? "warning" : "success",
    horizonLabel: "Current queue",
    visibleToRoles: ["owner", "admin", "manager"],
    createdAt: now
  });

  insights.push({
    id: "predictive-branch-attention",
    workspaceId: params.workspaceId,
    type: "branch_attention",
    title: "Branch attention risk",
    summary:
      params.executiveSummary.riskyBranches > 0
        ? `${params.executiveSummary.riskyBranches} branches are already in watch or risk mode.`
        : "No branches are currently carrying elevated enterprise risk.",
    explanation:
      "This prediction extends the current branch risk posture into a near-term watchlist for leadership.",
    tone: params.executiveSummary.riskyBranches > 0 ? "warning" : "success",
    horizonLabel: "Current month",
    visibleToRoles: ["owner", "admin", "manager"],
    createdAt: now
  });

  insights.push({
    id: "predictive-collection-risk",
    workspaceId: params.workspaceId,
    type: "collection_risk",
    title: "Collection execution risk",
    summary:
      params.financeSummary.mismatchCount > 0 || params.financeSummary.unreconciledCount > 0
        ? `${params.financeSummary.mismatchCount} mismatches and ${params.financeSummary.unreconciledCount} unreconciled records may slow confidence in collections.`
        : `${params.financeSummary.openPaymentRequests} payment requests are open with clean reconciliation posture.`,
    explanation:
      "This warning is based on current reconciliation quality and open collection activity rather than a hidden score.",
    tone:
      params.financeSummary.mismatchCount > 0
        ? "danger"
        : params.financeSummary.unreconciledCount > 0
          ? "warning"
          : "success",
    horizonLabel: "Current collection cycle",
    visibleToRoles: ["owner", "admin", "manager"],
    createdAt: now
  });

  insights.push({
    id: "predictive-supplier-dependency",
    workspaceId: params.workspaceId,
    type: "supplier_dependency",
    title: "Supplier obligation pressure",
    summary:
      params.supplierCreditSummary.totalOverdue > 0
        ? `${formatCurrency(params.supplierCreditSummary.totalOverdue, params.currency)} in supplier obligations are already overdue.`
        : `${formatCurrency(params.supplierCreditSummary.totalOutstanding, params.currency)} is still outstanding to suppliers without overdue pressure yet.`,
    explanation:
      "This forward-looking view uses supplier outstanding and overdue amounts to warn about vendor pressure before it disrupts operations.",
    tone: params.supplierCreditSummary.totalOverdue > 0 ? "warning" : "muted",
    horizonLabel: "Next supplier cycle",
    visibleToRoles: ["owner", "admin", "manager"],
    createdAt: now
  });

  return insights;
}

export function getIntelligentSummaries(params: {
  workspaceId: string;
  currency: string;
  dashboardMetrics: {
    totalPaid: number;
    totalUnpaid: number;
    totalExpenses: number;
    overdueCount: number;
    dueSoonCount: number;
    overduePayablesCount: number;
  };
  financeSummary: {
    openPaymentRequests: number;
    mismatchCount: number;
    unreconciledCount: number;
    eligibleInvoiceCount: number;
  };
  financialHealth: FinancialHealthSnapshot;
  approvalCounts: { pending: number; approved: number; rejected: number };
  executiveSummary: {
    pendingReviews: number;
    riskyBranches: number;
    readinessScore: number;
  };
  branchComparisons: Array<{
    branch: Branch;
    riskLabel: string;
    riskScore: number;
  }>;
  procurementSummary: {
    pendingReviewCount: number;
    supplierOutstanding: number;
    supplierOverdue: number;
  };
  cashFlowForecast: {
    receivableTotal: number;
    payableTotal: number;
    projectedNet: number;
  };
}): IntelligentSummary[] {
  const generatedAt = new Date().toISOString();

  return [
    {
      id: "summary-dashboard",
      workspaceId: params.workspaceId,
      scope: "dashboard" as const,
      title: "Daily business summary",
      summary: `Collected ${formatCurrency(params.dashboardMetrics.totalPaid, params.currency)} so far, with ${formatCurrency(params.dashboardMetrics.totalUnpaid, params.currency)} still outstanding and ${params.dashboardMetrics.overdueCount} overdue invoices needing follow-up.`,
      highlights: [
        `${params.dashboardMetrics.dueSoonCount} invoices are due soon`,
        `${params.dashboardMetrics.overduePayablesCount} supplier obligations are overdue`,
        `${formatCurrency(params.dashboardMetrics.totalExpenses, params.currency)} in recorded expenses`
      ],
      visibleToRoles: ["owner", "admin", "manager", "staff"],
      generatedAt
    },
    {
      id: "summary-finance",
      workspaceId: params.workspaceId,
      scope: "finance" as const,
      title: "Finance control summary",
      summary: `${params.financeSummary.openPaymentRequests} collection requests are open, ${params.financeSummary.unreconciledCount} records still need reconciliation, and readiness is ${params.financialHealth.readinessBand}.`,
      highlights: [
        `${params.financeSummary.mismatchCount} mismatches need review`,
        `${params.financeSummary.eligibleInvoiceCount} invoices are in readiness review`,
        `Capital readiness sits at ${params.financialHealth.capitalReadinessScore}/100`
      ],
      visibleToRoles: ["owner", "admin", "manager"] as UserRole[],
      generatedAt
    },
    {
      id: "summary-approvals",
      workspaceId: params.workspaceId,
      scope: "approvals" as const,
      title: "Approvals summary",
      summary: `${params.approvalCounts.pending} approvals and ${params.executiveSummary.pendingReviews} maker-checker items are still open.`,
      highlights: [
        `${params.approvalCounts.approved} approvals already cleared`,
        `${params.approvalCounts.rejected} approvals were rejected`,
        `${params.executiveSummary.riskyBranches} branches are currently in a risky state`
      ],
      visibleToRoles: ["owner", "admin", "manager"] as UserRole[],
      generatedAt
    },
    {
      id: "summary-receivables",
      workspaceId: params.workspaceId,
      scope: "receivables" as const,
      title: "Receivables summary",
      summary: `${formatCurrency(params.dashboardMetrics.totalUnpaid, params.currency)} remains unpaid, with ${params.dashboardMetrics.overdueCount} invoices already overdue.`,
      highlights: [
        `${params.dashboardMetrics.dueSoonCount} invoices are due soon`,
        `${params.financeSummary.openPaymentRequests} payment requests are active`,
        `${params.financeSummary.unreconciledCount} collection records still need reconciliation`
      ],
      visibleToRoles: ["owner", "admin", "manager"] as UserRole[],
      generatedAt
    },
    {
      id: "summary-payables",
      workspaceId: params.workspaceId,
      scope: "payables" as const,
      title: "Payables summary",
      summary: `${params.dashboardMetrics.overduePayablesCount} supplier payables are overdue, while the forecast still expects ${formatCurrency(params.cashFlowForecast.payableTotal, params.currency)} to go out soon.`,
      highlights: [
        `${formatCurrency(params.procurementSummary.supplierOutstanding, params.currency)} supplier outstanding`,
        `${formatCurrency(params.procurementSummary.supplierOverdue, params.currency)} already overdue`,
        `${params.procurementSummary.pendingReviewCount} procurement reviews pending`
      ],
      visibleToRoles: ["owner", "admin", "manager"] as UserRole[],
      generatedAt
    },
    {
      id: "summary-procurement",
      workspaceId: params.workspaceId,
      scope: "procurement" as const,
      title: "Procurement summary",
      summary: `${params.procurementSummary.pendingReviewCount} procurement items are waiting for review with ${formatCurrency(params.procurementSummary.supplierOutstanding, params.currency)} still outstanding to suppliers.`,
      highlights: [
        `${formatCurrency(params.procurementSummary.supplierOverdue, params.currency)} overdue to suppliers`,
        `${params.executiveSummary.riskyBranches} risky branches can affect procurement`,
        `${formatCurrency(params.cashFlowForecast.projectedNet, params.currency)} projected net cash`
      ],
      visibleToRoles: ["owner", "admin", "manager"] as UserRole[],
      generatedAt
    },
    {
      id: "summary-branch",
      workspaceId: params.workspaceId,
      scope: "branch" as const,
      title: "Branch summary",
      summary: params.branchComparisons.length
        ? `${params.branchComparisons[0]?.branch.name || "Top branch"} currently leads the branch list while ${params.executiveSummary.riskyBranches} branches need closer control attention.`
        : "Branch comparisons will populate once branch activity is available.",
      highlights: params.branchComparisons.slice(0, 3).map(
        (entry) => `${entry.branch.name}: ${entry.riskLabel}`
      ),
      visibleToRoles: ["owner", "admin", "manager"],
      generatedAt
    },
    {
      id: "summary-executive",
      workspaceId: params.workspaceId,
      scope: "executive" as const,
      title: "Executive summary",
      summary: `Executive readiness is ${params.executiveSummary.readinessScore}/100, with ${params.executiveSummary.riskyBranches} risky branches and ${params.executiveSummary.pendingReviews} pending maker-checker items.`,
      highlights: [
        `Forecast receivables ${formatCurrency(params.cashFlowForecast.receivableTotal, params.currency)}`,
        `Forecast payables ${formatCurrency(params.cashFlowForecast.payableTotal, params.currency)}`,
        `Capital readiness ${params.financialHealth.readinessBand}`
      ],
      visibleToRoles: ["owner", "admin"] as UserRole[],
      generatedAt
    }
  ];
}

export function getActionCenterSummary(tasks: ActionTask[]) {
  const openTasks = tasks.filter((task) => task.status === "open");
  const highPriority = openTasks.filter((task) =>
    ["critical", "high"].includes(task.priority)
  );
  const overdue = openTasks.filter(
    (task) => task.dueAt && new Date(task.dueAt).getTime() < new Date().getTime()
  );

  return {
    total: tasks.length,
    open: openTasks.length,
    highPriority: highPriority.length,
    overdue: overdue.length,
    done: tasks.filter((task) => task.status === "done").length
  };
}

export function getAssistantIntent(question: string): AssistantIntent {
  const query = question.toLowerCase();
  if (
    (query.includes("overdue") || query.includes("who owes") || query.includes("unpaid")) &&
    (query.includes("invoice") || query.includes("customer") || query.includes("receivable"))
  ) {
    return "overdue_invoices";
  }
  if (
    (query.includes("supplier") || query.includes("vendor") || query.includes("payable")) &&
    (query.includes("week") || query.includes("due") || query.includes("owe") || query.includes("payment"))
  ) {
    return "supplier_payables";
  }
  if (query.includes("branch") && (query.includes("worst") || query.includes("perform"))) {
    return "branch_performance";
  }
  if (query.includes("approval") || query.includes("pending review")) {
    return "pending_approvals";
  }
  if (query.includes("cash") || query.includes("cash flow") || query.includes("pressure")) {
    return "cash_pressure";
  }
  if (query.includes("recommend") || query.includes("next action")) {
    return "recommendations";
  }
  if (query.includes("last 7 days") || query.includes("recent") || query.includes("summary")) {
    return "recent_activity";
  }
  return "summary";
}

export function getAssistantAnswer(params: {
  question: string;
  currency: string;
  role?: UserRole;
  canViewReceivables: boolean;
  canViewPayables: boolean;
  canViewApprovals: boolean;
  canViewBranches: boolean;
  canViewExecutive: boolean;
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  payments: Payment[];
  purchaseRows: Array<{
    supplier?: Supplier;
    outstanding: number;
    overdue: number;
    dueSoon: number;
  }>;
  branchComparisons: Array<{
    branch: Branch;
    revenue: number;
    payables: number;
    receivables?: number;
    riskScore: number;
    riskLabel: string;
  }>;
  approvals: ApprovalRequest[];
  reviews: EnterpriseReview[];
  activities: Activity[];
  summaries: IntelligentSummary[];
  recommendations: Recommendation[];
  predictiveInsights: PredictiveInsight[];
}) {
  const intent = getAssistantIntent(params.question);
  const overdueCustomers = getTopOverdueCustomers({
    customers: params.customers,
    invoices: params.invoices,
    payments: params.payments
  });
  const overdueInvoices = params.invoices.filter(
    (invoice) => getInvoiceStatus(invoice, params.payments) === "overdue"
  );
  const overdueInvoiceTotal = roundCurrency(
    overdueInvoices.reduce(
      (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
      0
    )
  );
  const pendingApprovals = params.approvals.filter((approval) => approval.status === "pending");
  const pendingReviews = params.reviews.filter((review) => review.status === "pending_review");

  const noAccess = (message: string): AssistantAnswerResult => ({
    intent,
    answer: message,
    hardFacts: [],
    derivedInsights: [],
    followUps: ["Show me a dashboard summary instead"],
    sources: []
  });

  switch (intent) {
    case "overdue_invoices": {
      if (!params.canViewReceivables) {
        return noAccess("Receivables visibility is limited for your current role.");
      }

      return {
        intent,
        answer: overdueInvoices.length
          ? `There are ${overdueInvoices.length} overdue invoices worth ${formatCurrency(overdueInvoiceTotal, params.currency)} still outstanding.`
          : "There are no overdue invoices right now.",
        hardFacts: overdueCustomers.slice(0, 3).map(
          (entry) =>
            `${entry.customer.name}: ${formatCurrency(entry.amount, params.currency)} overdue`
        ),
        derivedInsights: overdueCustomers.length
          ? [`${overdueCustomers[0].customer.name} is the top overdue customer right now.`]
          : ["Collections are not currently being driven by overdue receivables."],
        followUps: [
          "Which customers should I follow up first?",
          "Show me due soon invoices",
          "Summarize receivables risk"
        ],
        sources: overdueInvoices.slice(0, 3).map((invoice) => ({
          label: invoice.reference,
          href: `/app/invoices/${invoice.id}`,
          entityType: "invoice",
          entityId: invoice.id
        }))
      };
    }
    case "supplier_payables": {
      if (!params.canViewPayables) {
        return noAccess("Payables visibility is limited for your current role.");
      }

      const rows = [...params.purchaseRows]
        .filter((row) => row.overdue > 0 || row.dueSoon > 0)
        .sort((left, right) => right.overdue + right.dueSoon - (left.overdue + left.dueSoon));

      return {
        intent,
        answer: rows.length
          ? `${rows.length} supplier relationships need payment attention this cycle.`
          : "No supplier payables are due soon right now.",
        hardFacts: rows.slice(0, 3).map((row) => {
          const amount = row.overdue > 0 ? row.overdue : row.dueSoon;
          return `${row.supplier?.name || "Supplier"}: ${formatCurrency(amount, params.currency)} ${row.overdue > 0 ? "overdue" : "due soon"}`;
        }),
        derivedInsights: rows.length
          ? ["The most urgent payables are the ones already overdue or in supplier pressure state."]
          : ["Supplier credit pressure looks manageable at the moment."],
        followUps: [
          "Show me overdue payables only",
          "What is hurting cash flow right now?",
          "Summarize procurement risk"
        ],
        sources: rows.slice(0, 3).map((row) => ({
          label: row.supplier?.name || "Supplier credit",
          href: "/app/finance/supplier-credit",
          entityType: "supplier_credit"
        }))
      };
    }
    case "branch_performance": {
      if (!params.canViewBranches) {
        return noAccess("Branch comparison visibility is limited for your current role.");
      }

      const worstBranch = [...params.branchComparisons].sort(
        (left, right) => right.riskScore - left.riskScore
      )[0];

      return {
        intent,
        answer: worstBranch
          ? `${worstBranch.branch.name} currently needs the most attention with ${worstBranch.riskLabel.toLowerCase()}.`
          : "There is not enough branch comparison data yet.",
        hardFacts: params.branchComparisons.slice(0, 3).map(
          (row) =>
            `${row.branch.name}: revenue ${formatCurrency(row.revenue, params.currency)}, payables ${formatCurrency(row.payables, params.currency)}`
        ),
        derivedInsights: worstBranch
          ? ["Branch attention is derived from branch risk score plus payables versus revenue pressure."]
          : ["No branch has enough activity to compare yet."],
        followUps: [
          "Which branch is performing best?",
          "Show branch risks",
          "Summarize the executive view"
        ],
        sources: worstBranch
          ? [
              {
                label: worstBranch.branch.name,
                href: "/app/branch-comparison",
                entityType: "branch_control",
                entityId: worstBranch.branch.id
              }
            ]
          : []
      };
    }
    case "pending_approvals": {
      if (!params.canViewApprovals) {
        return noAccess("Approval visibility is limited for your current role.");
      }

      return {
        intent,
        answer: pendingApprovals.length || pendingReviews.length
          ? `${pendingApprovals.length} classic approvals and ${pendingReviews.length} maker-checker reviews are still pending.`
          : "There are no pending approval queues right now.",
        hardFacts: [
          ...pendingApprovals.slice(0, 2).map((approval) => approval.title),
          ...pendingReviews.slice(0, 2).map((review) => review.title)
        ],
        derivedInsights:
          pendingReviews.length > 0
            ? ["Maker-checker delays are currently contributing to approval bottlenecks."]
            : ["The approval queue is mostly clear."],
        followUps: [
          "Which approvals are oldest?",
          "Show maker-checker reviews",
          "What needs attention today?"
        ],
        sources: [
          {
            label: "Approvals queue",
            href: "/app/approvals",
            entityType: "review_request"
          },
          {
            label: "Maker-checker",
            href: "/app/reviews",
            entityType: "review_request"
          }
        ]
      };
    }
    case "cash_pressure": {
      const cashInsight = params.predictiveInsights.find(
        (entry) => entry.type === "cash_pressure"
      );
      const financeSummary = params.summaries.find((entry) => entry.scope === "finance");
      return {
        intent,
        answer:
          cashInsight?.summary ||
          financeSummary?.summary ||
          "Cash pressure is not available yet.",
        hardFacts: financeSummary?.highlights || [],
        derivedInsights: cashInsight ? [cashInsight.explanation] : [],
        followUps: [
          "What payables are due soon?",
          "Which customers should we chase first?",
          "Show predictive risks"
        ],
        sources: [
          {
            label: "Finance dashboard",
            href: "/app/finance",
            entityType: "finance_settings"
          },
          {
            label: "Predictive insights",
            href: "/app/predictive",
            entityType: "predictive_insight"
          }
        ]
      };
    }
    case "recommendations": {
      const visibleRecommendations = filterVisibleToRole(params.recommendations, params.role);
      return {
        intent,
        answer: visibleRecommendations.length
          ? `The strongest next moves are collections follow-up, queue cleanup, and the top risk item shown below.`
          : "There are no recommendation cards for your current role yet.",
        hardFacts: visibleRecommendations.slice(0, 3).map((entry) => entry.title),
        derivedInsights: visibleRecommendations.slice(0, 2).map((entry) => entry.explanation),
        followUps: [
          "Create a task from the top recommendation",
          "Show overdue customers",
          "What anomalies are open?"
        ],
        sources: visibleRecommendations.slice(0, 3).map((entry) => ({
          label: entry.title,
          href: entry.href,
          entityType: entry.relatedEntityType,
          entityId: entry.relatedEntityId
        }))
      };
    }
    case "recent_activity": {
      const recent = sortByCreatedDesc(params.activities).filter((entry) =>
        isWithinWindow(entry.createdAt, 7)
      );
      return {
        intent,
        answer: recent.length
          ? `The last 7 days show ${recent.length} logged activities across the business.`
          : "There is not much recent activity in the last 7 days yet.",
        hardFacts: recent.slice(0, 4).map((entry) => entry.title),
        derivedInsights: recent.length
          ? ["Recent activity is pulled directly from recorded workspace actions."]
          : [],
        followUps: [
          "Summarize approvals this week",
          "What changed in finance?",
          "Show my open tasks"
        ],
        sources: recent.slice(0, 4).map((entry) => ({
          label: entry.title,
          href: entry.href
        }))
      };
    }
    case "summary":
    case "unknown":
    default: {
      const visibleSummaries = filterVisibleToRole(params.summaries, params.role);
      const executiveSummary = visibleSummaries.find((entry) => entry.scope === "executive");
      const dashboardSummary = visibleSummaries.find((entry) => entry.scope === "dashboard");
      const chosen = params.canViewExecutive && executiveSummary ? executiveSummary : dashboardSummary;
      return {
        intent,
        answer:
          chosen?.summary ||
          "I can summarize receivables, payables, approvals, branches, and recent activity once there is more business data.",
        hardFacts: chosen?.highlights || [],
        derivedInsights: [
          "This summary is grounded in live workspace data and existing module calculations."
        ],
        followUps: [
          "What invoices are overdue right now?",
          "What suppliers need payment this week?",
          "What approvals are still pending?"
        ],
        sources: [
          {
            label: chosen?.title || "Dashboard",
            href: params.canViewExecutive ? "/app/executive" : "/app/dashboard"
          }
        ]
      };
    }
  }
}

export function mergeIntelligenceAuditLogs(baseLogs: AuditLog[], intelligenceLogs: AuditLog[]) {
  return sortByCreatedDesc([...baseLogs, ...intelligenceLogs]);
}
