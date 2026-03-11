import {
  AppState,
  CashEntry,
  Customer,
  Expense,
  ExpenseCategory,
  Invoice,
  LineItem,
  Payment,
  Purchase,
  PurchaseLineItem,
  PurchasePayment,
  Quote,
  RecurringFrequency,
  RecurringInvoiceTemplate,
  Supplier
} from "@/lib/types";

export interface DocumentSummary {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  tax: number;
  total: number;
}

export interface PurchaseSummary {
  subtotal: number;
  total: number;
}

export interface DashboardMetrics {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  totalUnpaid: number;
  totalExpenses: number;
  totalPurchases: number;
  totalPayables: number;
  estimatedProfit: number;
  overdueCount: number;
  dueSoonCount: number;
  overduePayablesCount: number;
  dueSoonPayablesCount: number;
  todayCollections: number;
  todayExpenses: number;
  todayOutgoingPayments: number;
}

export interface AgingBuckets {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export interface StatementEntry {
  id: string;
  date: string;
  type: "invoice" | "payment" | "purchase" | "purchase_payment";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(lineItem: LineItem) {
  return roundCurrency(lineItem.quantity * lineItem.unitPrice);
}

export function calculatePurchaseLineTotal(lineItem: PurchaseLineItem) {
  return roundCurrency(lineItem.quantity * lineItem.unitCost);
}

export function calculateDocumentSummary(
  lineItems: LineItem[],
  discountAmount = 0,
  taxRate = 0
): DocumentSummary {
  const subtotal = roundCurrency(
    lineItems.reduce((total, lineItem) => total + calculateLineTotal(lineItem), 0)
  );
  const discount = roundCurrency(Math.max(0, discountAmount));
  const taxableAmount = roundCurrency(Math.max(0, subtotal - discount));
  const tax = roundCurrency(taxableAmount * (Math.max(0, taxRate) / 100));

  return {
    subtotal,
    discountAmount: discount,
    taxableAmount,
    tax,
    total: roundCurrency(taxableAmount + tax)
  };
}

export function calculatePurchaseSummary(lineItems: PurchaseLineItem[]): PurchaseSummary {
  const subtotal = roundCurrency(
    lineItems.reduce((total, lineItem) => total + calculatePurchaseLineTotal(lineItem), 0)
  );

  return {
    subtotal,
    total: subtotal
  };
}

export function getInvoicePayments(payments: Payment[], invoiceId: string) {
  return payments.filter((payment) => payment.invoiceId === invoiceId);
}

export function getPurchasePayments(
  purchasePayments: PurchasePayment[],
  purchaseId: string
) {
  return purchasePayments.filter((payment) => payment.purchaseId === purchaseId);
}

export function getPaidAmount(payments: Payment[], invoiceId: string) {
  return roundCurrency(
    getInvoicePayments(payments, invoiceId).reduce(
      (total, payment) => total + payment.amount,
      0
    )
  );
}

export function getPurchasePaidAmount(
  purchasePayments: PurchasePayment[],
  purchaseId: string
) {
  return roundCurrency(
    getPurchasePayments(purchasePayments, purchaseId).reduce(
      (total, payment) => total + payment.amount,
      0
    )
  );
}

export function getInvoiceTotal(invoice: Invoice) {
  return calculateDocumentSummary(
    invoice.lineItems,
    invoice.discountAmount,
    invoice.taxRate
  ).total;
}

export function getPurchaseTotal(purchase: Purchase) {
  return calculatePurchaseSummary(purchase.lineItems).total;
}

export function getInvoiceOutstanding(invoice: Invoice, payments: Payment[]) {
  return roundCurrency(Math.max(0, getInvoiceTotal(invoice) - getPaidAmount(payments, invoice.id)));
}

export function getPurchaseOutstanding(
  purchase: Purchase,
  purchasePayments: PurchasePayment[]
) {
  return roundCurrency(
    Math.max(0, getPurchaseTotal(purchase) - getPurchasePaidAmount(purchasePayments, purchase.id))
  );
}

export function getInvoiceStatus(invoice: Invoice, payments: Payment[]) {
  if (invoice.status === "draft") {
    return "draft" as const;
  }

  const outstanding = getInvoiceOutstanding(invoice, payments);
  if (outstanding <= 0) {
    return "paid" as const;
  }

  const paidAmount = getPaidAmount(payments, invoice.id);
  const dueDate = new Date(invoice.dueDate);
  const today = startOfDay(new Date());

  if (startOfDay(dueDate) < today) {
    return "overdue" as const;
  }

  if (paidAmount > 0) {
    return "partial" as const;
  }

  return "sent" as const;
}

export function getPurchaseStatus(
  purchase: Purchase,
  purchasePayments: PurchasePayment[]
) {
  if (purchase.status === "draft") {
    return "draft" as const;
  }

  const outstanding = getPurchaseOutstanding(purchase, purchasePayments);
  if (outstanding <= 0) {
    return "paid" as const;
  }

  const paidAmount = getPurchasePaidAmount(purchasePayments, purchase.id);
  const dueDate = new Date(purchase.dueDate);
  const today = startOfDay(new Date());

  if (startOfDay(dueDate) < today) {
    return "overdue" as const;
  }

  if (paidAmount > 0) {
    return "partial" as const;
  }

  return "confirmed" as const;
}

export function isInvoiceDueSoon(invoice: Invoice, payments: Payment[], days = 7) {
  const outstanding = getInvoiceOutstanding(invoice, payments);
  if (outstanding <= 0 || invoice.status === "draft") {
    return false;
  }

  const dueDate = startOfDay(new Date(invoice.dueDate)).getTime();
  const today = startOfDay(new Date()).getTime();
  const distance = Math.round((dueDate - today) / 86400000);

  return distance >= 0 && distance <= days;
}

export function isPurchaseDueSoon(
  purchase: Purchase,
  purchasePayments: PurchasePayment[],
  days = 7
) {
  const outstanding = getPurchaseOutstanding(purchase, purchasePayments);
  if (outstanding <= 0 || purchase.status === "draft") {
    return false;
  }

  const dueDate = startOfDay(new Date(purchase.dueDate)).getTime();
  const today = startOfDay(new Date()).getTime();
  const distance = Math.round((dueDate - today) / 86400000);

  return distance >= 0 && distance <= days;
}

export function getCustomerOutstandingTotal(
  customerId: string,
  invoices: Invoice[],
  payments: Payment[]
) {
  return roundCurrency(
    invoices
      .filter((invoice) => invoice.customerId === customerId)
      .reduce(
        (total, invoice) => total + getInvoiceOutstanding(invoice, payments),
        0
      )
  );
}

export function getSupplierSpendTotal(supplierId: string, expenses: Expense[]) {
  return roundCurrency(
    expenses
      .filter((expense) => expense.supplierId === supplierId && !expense.isArchived)
      .reduce((total, expense) => total + expense.amount, 0)
  );
}

export function getSupplierPayableTotal(
  supplierId: string,
  purchases: Purchase[],
  purchasePayments: PurchasePayment[]
) {
  return roundCurrency(
    purchases
      .filter((purchase) => purchase.supplierId === supplierId)
      .reduce(
        (total, purchase) => total + getPurchaseOutstanding(purchase, purchasePayments),
        0
      )
  );
}

export function getReceivablesAging(
  invoices: Invoice[],
  payments: Payment[]
): AgingBuckets {
  const buckets = emptyAgingBuckets();

  invoices.forEach((invoice) => {
    const outstanding = getInvoiceOutstanding(invoice, payments);
    if (outstanding <= 0 || invoice.status === "draft") {
      return;
    }

    const bucket = getAgingKey(invoice.dueDate);
    buckets[bucket] = roundCurrency(buckets[bucket] + outstanding);
  });

  return buckets;
}

export function getPayablesAging(
  purchases: Purchase[],
  purchasePayments: PurchasePayment[]
): AgingBuckets {
  const buckets = emptyAgingBuckets();

  purchases.forEach((purchase) => {
    const outstanding = getPurchaseOutstanding(purchase, purchasePayments);
    if (outstanding <= 0 || purchase.status === "draft") {
      return;
    }

    const bucket = getAgingKey(purchase.dueDate);
    buckets[bucket] = roundCurrency(buckets[bucket] + outstanding);
  });

  return buckets;
}

function emptyAgingBuckets(): AgingBuckets {
  return {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90Plus: 0
  };
}

function getAgingKey(dueDate: string): keyof AgingBuckets {
  const due = startOfDay(new Date(dueDate)).getTime();
  const today = startOfDay(new Date()).getTime();
  const daysPastDue = Math.floor((today - due) / 86400000);

  if (daysPastDue <= 0) {
    return "current";
  }
  if (daysPastDue <= 30) {
    return "days1to30";
  }
  if (daysPastDue <= 60) {
    return "days31to60";
  }
  if (daysPastDue <= 90) {
    return "days61to90";
  }

  return "days90Plus";
}

export function getDashboardMetrics(params: {
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  dueSoonDays: number;
  purchases?: Purchase[];
  purchasePayments?: PurchasePayment[];
  cashEntries?: CashEntry[];
}): DashboardMetrics {
  const purchases = params.purchases || [];
  const purchasePayments = params.purchasePayments || [];
  const cashEntries = params.cashEntries || [];
  const totalInvoiced = roundCurrency(
    params.invoices.reduce((total, invoice) => total + getInvoiceTotal(invoice), 0)
  );

  const totalPaid = roundCurrency(
    params.payments.reduce((total, payment) => total + payment.amount, 0)
  );

  const totalUnpaid = roundCurrency(
    params.invoices.reduce(
      (total, invoice) => total + getInvoiceOutstanding(invoice, params.payments),
      0
    )
  );

  const totalExpenses = roundCurrency(
    params.expenses
      .filter((expense) => !expense.isArchived)
      .reduce((total, expense) => total + expense.amount, 0)
  );

  const totalPurchases = roundCurrency(
    purchases
      .filter((purchase) => purchase.status !== "draft")
      .reduce((total, purchase) => total + getPurchaseTotal(purchase), 0)
  );

  const totalPayables = roundCurrency(
    purchases.reduce(
      (total, purchase) => total + getPurchaseOutstanding(purchase, purchasePayments),
      0
    )
  );

  const overdueCount = params.invoices.filter(
    (invoice) => getInvoiceStatus(invoice, params.payments) === "overdue"
  ).length;

  const dueSoonCount = params.invoices.filter((invoice) =>
    isInvoiceDueSoon(invoice, params.payments, params.dueSoonDays)
  ).length;

  const overduePayablesCount = purchases.filter(
    (purchase) => getPurchaseStatus(purchase, purchasePayments) === "overdue"
  ).length;

  const dueSoonPayablesCount = purchases.filter((purchase) =>
    isPurchaseDueSoon(purchase, purchasePayments, params.dueSoonDays)
  ).length;

  return {
    totalInvoices: params.invoices.length,
    totalInvoiced,
    totalPaid,
    totalUnpaid,
    totalExpenses,
    totalPurchases,
    totalPayables,
    estimatedProfit: roundCurrency(totalPaid - totalExpenses - totalPurchases),
    overdueCount,
    dueSoonCount,
    overduePayablesCount,
    dueSoonPayablesCount,
    todayCollections: roundCurrency(
      params.payments
        .filter((payment) => isSameDay(payment.paymentDate, new Date()))
        .reduce((total, payment) => total + payment.amount, 0)
    ),
    todayExpenses: roundCurrency(
      params.expenses
        .filter((expense) => !expense.isArchived && isSameDay(expense.expenseDate, new Date()))
        .reduce((total, expense) => total + expense.amount, 0)
    ),
    todayOutgoingPayments: roundCurrency(
      purchasePayments
        .filter((payment) => isSameDay(payment.paymentDate, new Date()))
        .reduce((total, payment) => total + payment.amount, 0) +
        cashEntries
          .filter((entry) => entry.type === "cash_out" && isSameDay(entry.entryDate, new Date()))
          .reduce((total, entry) => total + entry.amount, 0)
    )
  };
}

export function getOwnerAwayAttentionCount(params: {
  invoices: Invoice[];
  payments: Payment[];
  purchases: Purchase[];
  purchasePayments: PurchasePayment[];
  dueSoonDays: number;
}) {
  return (
    params.invoices.filter(
      (invoice) => getInvoiceStatus(invoice, params.payments) === "overdue"
    ).length +
    params.purchases.filter(
      (purchase) => getPurchaseStatus(purchase, params.purchasePayments) === "overdue"
    ).length +
    params.invoices.filter((invoice) =>
      isInvoiceDueSoon(invoice, params.payments, params.dueSoonDays)
    ).length +
    params.purchases.filter((purchase) =>
      isPurchaseDueSoon(purchase, params.purchasePayments, params.dueSoonDays)
    ).length
  );
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(date));
}

export function toDateInputValue(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function getNextRecurringRunDate(date: string, frequency: RecurringFrequency) {
  const base = new Date(date);
  if (frequency === "weekly") {
    return addDays(base, 7).toISOString();
  }
  if (frequency === "monthly") {
    return addMonths(base, 1).toISOString();
  }

  return addMonths(base, 3).toISOString();
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(dateLike: string, compareDate: Date) {
  return startOfDay(new Date(dateLike)).getTime() === startOfDay(compareDate).getTime();
}

export function createReference(prefix: string, count: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;
}

export function sortByNewest<T extends { createdAt: string }>(records: T[]) {
  return [...records].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function sortByDateDescending<T extends { date: string }>(records: T[]) {
  return [...records].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  );
}

export function getRecentActivity(state: AppState, workspaceId?: string) {
  const records = workspaceId
    ? state.activities.filter((activity) => activity.workspaceId === workspaceId)
    : state.activities;

  return sortByNewest(records).slice(0, 8);
}

export function getDocumentSummaryForRecord(record: Quote | Invoice) {
  return calculateDocumentSummary(
    record.lineItems,
    record.discountAmount,
    record.taxRate
  );
}

export function getPurchaseSummaryForRecord(record: Purchase) {
  return calculatePurchaseSummary(record.lineItems);
}

export function getCustomerPaymentHistory(
  customerId: string,
  invoices: Invoice[],
  payments: Payment[]
) {
  const invoiceIds = invoices
    .filter((invoice) => invoice.customerId === customerId)
    .map((invoice) => invoice.id);

  return sortByNewest(payments.filter((payment) => invoiceIds.includes(payment.invoiceId)));
}

export function getCustomerStatementEntries(
  customerId: string,
  invoices: Invoice[],
  payments: Payment[]
): StatementEntry[] {
  const relevantInvoices = invoices
    .filter((invoice) => invoice.customerId === customerId)
    .map((invoice) => ({
      id: invoice.id,
      date: invoice.issueDate,
      type: "invoice" as const,
      reference: invoice.reference,
      description: "Invoice issued",
      amount: getInvoiceTotal(invoice)
    }));

  const invoiceIds = relevantInvoices.map((invoice) => invoice.id);
  const relevantPayments = payments
    .filter((payment) => invoiceIds.includes(payment.invoiceId))
    .map((payment) => ({
      id: payment.id,
      date: payment.paymentDate,
      type: "payment" as const,
      reference: payment.reference || "Payment",
      description: payment.method.replace("_", " "),
      amount: payment.amount
    }));

  const timeline = [...relevantInvoices, ...relevantPayments].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );

  let balance = 0;
  return timeline.map((entry) => {
    if (entry.type === "invoice") {
      balance = roundCurrency(balance + entry.amount);
      return {
        id: entry.id,
        date: entry.date,
        type: entry.type,
        reference: entry.reference,
        description: entry.description,
        debit: entry.amount,
        credit: 0,
        balance
      };
    }

    balance = roundCurrency(balance - entry.amount);
    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      reference: entry.reference,
      description: entry.description,
      debit: 0,
      credit: entry.amount,
      balance
    };
  });
}

export function getSupplierStatementEntries(
  supplierId: string,
  purchases: Purchase[],
  purchasePayments: PurchasePayment[]
): StatementEntry[] {
  const relevantPurchases = purchases
    .filter((purchase) => purchase.supplierId === supplierId)
    .map((purchase) => ({
      id: purchase.id,
      date: purchase.purchaseDate,
      type: "purchase" as const,
      reference: purchase.reference,
      description: "Purchase recorded",
      amount: getPurchaseTotal(purchase)
    }));

  const purchaseIds = relevantPurchases.map((purchase) => purchase.id);
  const relevantPayments = purchasePayments
    .filter((payment) => purchaseIds.includes(payment.purchaseId))
    .map((payment) => ({
      id: payment.id,
      date: payment.paymentDate,
      type: "purchase_payment" as const,
      reference: payment.reference || "Supplier payment",
      description: payment.method.replace("_", " "),
      amount: payment.amount
    }));

  const timeline = [...relevantPurchases, ...relevantPayments].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );

  let balance = 0;
  return timeline.map((entry) => {
    if (entry.type === "purchase") {
      balance = roundCurrency(balance + entry.amount);
      return {
        id: entry.id,
        date: entry.date,
        type: entry.type,
        reference: entry.reference,
        description: entry.description,
        debit: entry.amount,
        credit: 0,
        balance
      };
    }

    balance = roundCurrency(balance - entry.amount);
    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      reference: entry.reference,
      description: entry.description,
      debit: 0,
      credit: entry.amount,
      balance
    };
  });
}

export function groupPaymentsByMethod(payments: Payment[]) {
  return payments.reduce<Record<string, number>>((accumulator, payment) => {
    accumulator[payment.method] = roundCurrency(
      (accumulator[payment.method] || 0) + payment.amount
    );
    return accumulator;
  }, {});
}

export function getRevenueTrend(
  payments: Payment[],
  period: "daily" | "weekly" | "monthly" = "weekly"
) {
  const map = new Map<string, number>();
  payments.forEach((payment) => {
    const date = new Date(payment.paymentDate);
    const key =
      period === "daily"
        ? date.toISOString().slice(0, 10)
        : period === "weekly"
          ? `${date.getFullYear()}-W${String(getWeekOfYear(date)).padStart(2, "0")}`
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, roundCurrency((map.get(key) || 0) + payment.amount));
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function getWeekOfYear(date: Date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const diff = startOfDay(date).getTime() - startOfDay(firstDay).getTime();
  return Math.ceil((diff / 86400000 + firstDay.getDay() + 1) / 7);
}

export function getExpenseTotalsByCategory(expenses: Expense[]) {
  return expenses.reduce<Record<ExpenseCategory, number>>((accumulator, expense) => {
    if (expense.isArchived) {
      return accumulator;
    }

    accumulator[expense.category] = roundCurrency(
      (accumulator[expense.category] || 0) + expense.amount
    );
    return accumulator;
  }, {} as Record<ExpenseCategory, number>);
}

export function getTopCustomers(
  customers: Customer[],
  invoices: Invoice[],
  payments: Payment[]
) {
  return customers
    .map((customer) => ({
      customer,
      amount: getCustomerOutstandingTotal(customer.id, invoices, payments)
    }))
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
}

export function getTopSuppliers(
  suppliers: Supplier[],
  purchases: Purchase[],
  purchasePayments: PurchasePayment[]
) {
  return suppliers
    .map((supplier) => ({
      supplier,
      amount: getSupplierPayableTotal(supplier.id, purchases, purchasePayments)
    }))
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
}

export function getCashPressureIndicator(params: {
  payments: Payment[];
  expenses: Expense[];
  purchasePayments: PurchasePayment[];
}) {
  const inflow = params.payments.reduce((total, payment) => total + payment.amount, 0);
  const outflow =
    params.expenses
      .filter((expense) => !expense.isArchived)
      .reduce((total, expense) => total + expense.amount, 0) +
    params.purchasePayments.reduce((total, payment) => total + payment.amount, 0);

  const delta = roundCurrency(inflow - outflow);
  if (delta >= 0) {
    return {
      label: "Cash flow looks manageable",
      tone: "success" as const,
      value: delta
    };
  }

  return {
    label: "Cash pressure is building",
    tone: "danger" as const,
    value: delta
  };
}

export function getRecurringTemplatesDue(
  templates: RecurringInvoiceTemplate[],
  days = 0
) {
  const today = startOfDay(new Date()).getTime();
  return templates.filter((template) => {
    if (!template.isActive) {
      return false;
    }

    const dueDate = startOfDay(new Date(template.nextRunDate)).getTime();
    const distance = Math.floor((dueDate - today) / 86400000);
    return distance <= days;
  });
}
