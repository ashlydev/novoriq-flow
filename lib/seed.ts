import {
  addDays,
  getNextRecurringRunDate,
  toDateInputValue
} from "@/lib/calculations";
import {
  AppNotification,
  AppState,
  Attachment,
  Customer,
  Expense,
  LineItem,
  NotificationSeverity,
  NotificationType,
  Purchase,
  PurchaseLineItem,
  Supplier,
  UserRole,
  WorkspaceSettings
} from "@/lib/types";

const today = new Date();
const now = today.toISOString();
const defaultPasswordHash =
  "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d";

function isoFromDays(days: number) {
  return addDays(today, days).toISOString();
}

function invoiceLine(
  name: string,
  quantity: number,
  unitPrice: number,
  description?: string,
  unitCost?: number
): LineItem {
  return {
    id: crypto.randomUUID(),
    name,
    quantity,
    unitPrice,
    description,
    unitCost
  };
}

function purchaseLine(
  name: string,
  quantity: number,
  unitCost: number,
  description?: string,
  itemId?: string
): PurchaseLineItem {
  return {
    id: crypto.randomUUID(),
    itemId,
    name,
    quantity,
    unitCost,
    description
  };
}

function detectNotificationSeverity(
  type: NotificationType,
  currentSeverity?: NotificationSeverity
): NotificationSeverity {
  if (currentSeverity) {
    return currentSeverity;
  }

  switch (type) {
    case "invoice_paid":
    case "payment_received":
    case "partial_payment_recorded":
      return "success";
    case "invoice_due_soon":
    case "expense_recorded":
    case "purchase_recorded":
    case "purchase_confirmed":
    case "recurring_invoice_due":
      return "warning";
    case "invoice_overdue":
    case "overdue_customer_balance":
    case "overdue_supplier_payable":
    case "significant_expense":
    case "suspicious_edit":
      return "critical";
    default:
      return "info";
  }
}

export const demoCredentials = {
  email: "owner@novoriq.demo",
  password: "demo1234"
};

export const demoAccounts = [
  { role: "owner" as UserRole, email: "owner@novoriq.demo", password: "demo1234" },
  { role: "admin" as UserRole, email: "admin@novoriq.demo", password: "demo1234" },
  { role: "manager" as UserRole, email: "manager@novoriq.demo", password: "demo1234" },
  { role: "staff" as UserRole, email: "staff@novoriq.demo", password: "demo1234" }
];

export function createEmptyAppState(): AppState {
  return {
    users: [],
    workspaces: [],
    workspaceMembers: [],
    customers: [],
    suppliers: [],
    items: [],
    quotes: [],
    invoices: [],
    recurringInvoices: [],
    payments: [],
    receipts: [],
    expenses: [],
    purchases: [],
    purchasePayments: [],
    cashEntries: [],
    attachments: [],
    notifications: [],
    activities: [],
    auditLogs: [],
    settings: []
  };
}

const sampleCustomers: Customer[] = [
  {
    id: "cust-greenfield",
    workspaceId: "workspace-demo",
    name: "Greenfield Hardware",
    email: "admin@greenfield.co.zw",
    phone: "+263 78 800 1001",
    address: "Msasa, Harare",
    notes: "Prefers invoices via WhatsApp and email.",
    attachmentIds: ["att-customer-credit"],
    isArchived: false,
    createdAt: isoFromDays(-40),
    updatedAt: isoFromDays(-6)
  },
  {
    id: "cust-orbit",
    workspaceId: "workspace-demo",
    name: "Orbit Logistics",
    email: "accounts@orbitlogistics.africa",
    phone: "+263 77 998 8855",
    address: "Belvedere, Harare",
    notes: "Monthly retainer client with repeat billing.",
    attachmentIds: [],
    isArchived: false,
    createdAt: isoFromDays(-34),
    updatedAt: isoFromDays(-4)
  },
  {
    id: "cust-sunrise",
    workspaceId: "workspace-demo",
    name: "Sunrise Foods",
    email: "finance@sunrisefoods.africa",
    phone: "+263 71 444 0987",
    address: "Borrowdale, Harare",
    notes: "Requested 14 day payment terms.",
    attachmentIds: [],
    isArchived: false,
    createdAt: isoFromDays(-30),
    updatedAt: isoFromDays(-3)
  },
  {
    id: "cust-citron",
    workspaceId: "workspace-demo",
    name: "Citron Electrical",
    email: "ops@citronelectrical.co.zw",
    phone: "+263 78 240 7788",
    address: "Graniteside, Harare",
    notes: "Often approves work quickly but pays in splits.",
    attachmentIds: [],
    isArchived: false,
    createdAt: isoFromDays(-18),
    updatedAt: isoFromDays(-2)
  }
];

const sampleSuppliers: Supplier[] = [
  {
    id: "supp-pixel",
    workspaceId: "workspace-demo",
    name: "Pixel Print House",
    email: "sales@pixelprint.co.zw",
    phone: "+263 77 310 3300",
    address: "Southerton, Harare",
    notes: "Brand collateral and packaging prints.",
    attachmentIds: ["att-supplier-terms"],
    isArchived: false,
    createdAt: isoFromDays(-35),
    updatedAt: isoFromDays(-8)
  },
  {
    id: "supp-telecom",
    workspaceId: "workspace-demo",
    name: "Metro Telecom",
    email: "billing@metrotelecom.africa",
    phone: "+263 78 221 0012",
    address: "CBD, Harare",
    notes: "Connectivity and business lines.",
    attachmentIds: [],
    isArchived: false,
    createdAt: isoFromDays(-50),
    updatedAt: isoFromDays(-10)
  },
  {
    id: "supp-northwind",
    workspaceId: "workspace-demo",
    name: "Northwind Packaging",
    email: "accounts@northwindpackaging.africa",
    phone: "+263 77 901 1100",
    address: "Workington, Harare",
    notes: "Flexible credit terms on packaging work.",
    attachmentIds: [],
    isArchived: false,
    createdAt: isoFromDays(-44),
    updatedAt: isoFromDays(-7)
  }
];

const sampleSettings: WorkspaceSettings = {
  id: "settings-demo",
  workspaceId: "workspace-demo",
  invoicePrefix: "INV",
  quotePrefix: "Q",
  receiptPrefix: "RCPT",
  purchasePrefix: "PUR",
  dueSoonDays: 7,
  defaultInvoiceDueDays: 14,
  defaultPurchaseDueDays: 14,
  significantExpenseThreshold: 300,
  notificationsEnabled: true,
  paymentRemindersEnabled: true,
  brandAccent: "#c9a95a",
  termsSnippet: "Payment due within 14 days unless otherwise agreed in writing.",
  createdAt: now,
  updatedAt: now
};

const sampleAttachments: Attachment[] = [
  {
    id: "att-customer-credit",
    workspaceId: "workspace-demo",
    entityType: "customer",
    entityId: "cust-greenfield",
    fileName: "greenfield-credit-form.txt",
    mimeType: "text/plain",
    sizeBytes: 128,
    dataUrl: "data:text/plain;base64,R3JlZW5maWVsZCBIYXJkd2FyZSBjcmVkaXQgZm9ybQ==",
    uploadedBy: "user-demo-owner",
    createdAt: isoFromDays(-14)
  },
  {
    id: "att-supplier-terms",
    workspaceId: "workspace-demo",
    entityType: "supplier",
    entityId: "supp-pixel",
    fileName: "pixel-terms.txt",
    mimeType: "text/plain",
    sizeBytes: 140,
    dataUrl: "data:text/plain;base64,UGl4ZWwgUHJpbnQgSG91c2UgdGVybXMgYW5kIGNyZWRpdCBub3Rlcw==",
    uploadedBy: "user-demo-admin",
    createdAt: isoFromDays(-10)
  },
  {
    id: "att-expense-bill",
    workspaceId: "workspace-demo",
    entityType: "expense",
    entityId: "expense-002",
    fileName: "metro-feb.txt",
    mimeType: "text/plain",
    sizeBytes: 110,
    dataUrl: "data:text/plain;base64,TWV0cm8gVGVsZWNvbSBGZWJydWFyeSBiaWxs",
    uploadedBy: "user-demo-owner",
    createdAt: isoFromDays(-4)
  },
  {
    id: "att-purchase-po",
    workspaceId: "workspace-demo",
    entityType: "purchase",
    entityId: "purchase-001",
    fileName: "packaging-po.txt",
    mimeType: "text/plain",
    sizeBytes: 120,
    dataUrl: "data:text/plain;base64,UGFja2FnaW5nIFBPIGRldGFpbHM=",
    uploadedBy: "user-demo-manager",
    createdAt: isoFromDays(-9)
  },
  {
    id: "att-invoice-scope",
    workspaceId: "workspace-demo",
    entityType: "invoice",
    entityId: "invoice-004",
    fileName: "citron-scope.txt",
    mimeType: "text/plain",
    sizeBytes: 132,
    dataUrl: "data:text/plain;base64,Q2l0cm9uIGVsZWN0cmljYWwgc2NvcGUgbm90ZXM=",
    uploadedBy: "user-demo-owner",
    createdAt: isoFromDays(-5)
  }
];

const samplePurchases: Purchase[] = [
  {
    id: "purchase-001",
    workspaceId: "workspace-demo",
    supplierId: "supp-northwind",
    reference: "PUR-2026-001",
    purchaseDate: isoFromDays(-12),
    dueDate: isoFromDays(-2),
    status: "confirmed",
    lineItems: [
      purchaseLine("Packaging batch", 1, 380, "Custom carton and labels"),
      purchaseLine("Delivery charge", 1, 40, "Supplier drop-off")
    ],
    notes: "Overdue packaging payable for Sunrise Foods launch.",
    attachmentIds: ["att-purchase-po"],
    createdBy: "user-demo-manager",
    createdAt: isoFromDays(-12),
    updatedAt: isoFromDays(-5)
  },
  {
    id: "purchase-002",
    workspaceId: "workspace-demo",
    supplierId: "supp-telecom",
    reference: "PUR-2026-002",
    purchaseDate: isoFromDays(-22),
    dueDate: isoFromDays(-8),
    status: "confirmed",
    lineItems: [
      purchaseLine("Business fibre package", 1, 180, "Connectivity for the studio")
    ],
    notes: "Paid in full last week.",
    attachmentIds: [],
    createdBy: "user-demo-owner",
    createdAt: isoFromDays(-22),
    updatedAt: isoFromDays(-8)
  },
  {
    id: "purchase-003",
    workspaceId: "workspace-demo",
    supplierId: "supp-pixel",
    reference: "PUR-2026-003",
    purchaseDate: isoFromDays(-4),
    dueDate: isoFromDays(5),
    status: "confirmed",
    lineItems: [
      purchaseLine("Promo print run", 1, 260, "Flyers and roll-up banners")
    ],
    notes: "Due next week and partially tied to client delivery.",
    attachmentIds: [],
    createdBy: "user-demo-staff",
    createdAt: isoFromDays(-4),
    updatedAt: isoFromDays(-4)
  },
  {
    id: "purchase-004",
    workspaceId: "workspace-demo",
    supplierId: "supp-pixel",
    reference: "PUR-2026-004",
    purchaseDate: isoFromDays(-1),
    dueDate: isoFromDays(13),
    status: "draft",
    lineItems: [
      purchaseLine("Draft signage order", 1, 120, "Awaiting confirmation")
    ],
    notes: "Still under review by the owner.",
    attachmentIds: [],
    createdBy: "user-demo-staff",
    createdAt: isoFromDays(-1),
    updatedAt: isoFromDays(-1)
  }
];

export const seedAppState: AppState = {
  users: [
    {
      id: "user-demo-owner",
      fullName: "Rumbi Moyo",
      email: "owner@novoriq.demo",
      phone: "+263 77 120 3030",
      role: "owner",
      avatarUrl: "",
      passwordHash: defaultPasswordHash,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user-demo-admin",
      fullName: "Tapiwa Ncube",
      email: "admin@novoriq.demo",
      phone: "+263 71 000 2222",
      role: "admin",
      avatarUrl: "",
      passwordHash: defaultPasswordHash,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user-demo-manager",
      fullName: "Farai Chikore",
      email: "manager@novoriq.demo",
      phone: "+263 77 889 2211",
      role: "manager",
      avatarUrl: "",
      passwordHash: defaultPasswordHash,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "user-demo-staff",
      fullName: "Lisa Dube",
      email: "staff@novoriq.demo",
      phone: "+263 78 311 4500",
      role: "staff",
      avatarUrl: "",
      passwordHash: defaultPasswordHash,
      createdAt: now,
      updatedAt: now
    }
  ],
  workspaces: [
    {
      id: "workspace-demo",
      name: "Novoriq Creative Studio",
      category: "agency",
      currency: "USD",
      phone: "+263 77 120 3030",
      email: "hello@novoriqcreative.co.zw",
      address: "8 Lanark Road, Avondale, Harare",
      taxNumber: "TAX-NS-00914",
      logoDataUrl: "",
      createdAt: now,
      updatedAt: now
    }
  ],
  workspaceMembers: [
    {
      id: "member-demo-owner",
      workspaceId: "workspace-demo",
      userId: "user-demo-owner",
      role: "owner",
      createdAt: now
    },
    {
      id: "member-demo-admin",
      workspaceId: "workspace-demo",
      userId: "user-demo-admin",
      role: "admin",
      createdAt: now
    },
    {
      id: "member-demo-manager",
      workspaceId: "workspace-demo",
      userId: "user-demo-manager",
      role: "manager",
      createdAt: now
    },
    {
      id: "member-demo-staff",
      workspaceId: "workspace-demo",
      userId: "user-demo-staff",
      role: "staff",
      createdAt: now
    }
  ],
  customers: sampleCustomers,
  suppliers: sampleSuppliers,
  items: [
    {
      id: "item-brand-retainer",
      workspaceId: "workspace-demo",
      name: "Brand Retainer",
      kind: "service",
      description: "Monthly creative support retainer",
      sellingPrice: 650,
      cost: 220,
      category: "Retainers",
      isActive: true,
      createdAt: isoFromDays(-60),
      updatedAt: isoFromDays(-10)
    },
    {
      id: "item-website-sprint",
      workspaceId: "workspace-demo",
      name: "Landing Page Sprint",
      kind: "service",
      description: "Design and build one marketing landing page",
      sellingPrice: 900,
      cost: 350,
      category: "Web",
      isActive: true,
      createdAt: isoFromDays(-58),
      updatedAt: isoFromDays(-12)
    },
    {
      id: "item-print-bundle",
      workspaceId: "workspace-demo",
      name: "Print Collateral Bundle",
      kind: "product",
      description: "Business cards, flyers and banner print package",
      sellingPrice: 280,
      cost: 180,
      sku: "PRINT-028",
      category: "Print",
      isActive: true,
      createdAt: isoFromDays(-52),
      updatedAt: isoFromDays(-14)
    }
  ],
  quotes: [
    {
      id: "quote-001",
      workspaceId: "workspace-demo",
      customerId: "cust-sunrise",
      reference: "Q-2026-001",
      issueDate: isoFromDays(-5),
      expiryDate: isoFromDays(5),
      status: "sent",
      lineItems: [
        invoiceLine("Landing Page Sprint", 1, 900, "Campaign microsite"),
        invoiceLine("Print Collateral Bundle", 1, 280, "Launch materials")
      ],
      discountAmount: 60,
      taxRate: 0,
      notes: "Valid for 10 days. 50% upfront is preferred.",
      createdBy: "user-demo-owner",
      createdAt: isoFromDays(-5),
      updatedAt: isoFromDays(-5)
    },
    {
      id: "quote-002",
      workspaceId: "workspace-demo",
      customerId: "cust-greenfield",
      reference: "Q-2026-002",
      issueDate: isoFromDays(-2),
      expiryDate: isoFromDays(8),
      status: "draft",
      lineItems: [invoiceLine("Brand Retainer", 1, 650, "Monthly support")],
      discountAmount: 0,
      taxRate: 0,
      notes: "Draft waiting for internal review.",
      createdBy: "user-demo-manager",
      createdAt: isoFromDays(-2),
      updatedAt: isoFromDays(-1)
    }
  ],
  invoices: [
    {
      id: "invoice-001",
      workspaceId: "workspace-demo",
      customerId: "cust-orbit",
      reference: "INV-2026-001",
      issueDate: isoFromDays(-14),
      dueDate: isoFromDays(2),
      status: "sent",
      lineItems: [invoiceLine("Brand Retainer", 1, 650, "March support")],
      discountAmount: 0,
      taxRate: 0,
      notes: "Bank transfer preferred.",
      createdBy: "user-demo-owner",
      attachmentIds: [],
      createdAt: isoFromDays(-14),
      updatedAt: isoFromDays(-14)
    },
    {
      id: "invoice-002",
      workspaceId: "workspace-demo",
      customerId: "cust-greenfield",
      reference: "INV-2026-002",
      issueDate: isoFromDays(-18),
      dueDate: isoFromDays(-3),
      status: "sent",
      lineItems: [
        invoiceLine("Landing Page Sprint", 1, 900, "Promo page build"),
        invoiceLine("Print Collateral Bundle", 1, 280, "Launch kit")
      ],
      discountAmount: 40,
      taxRate: 0,
      notes: "Overdue account. Follow up this week.",
      createdBy: "user-demo-owner",
      attachmentIds: [],
      createdAt: isoFromDays(-18),
      updatedAt: isoFromDays(-6)
    },
    {
      id: "invoice-003",
      workspaceId: "workspace-demo",
      customerId: "cust-sunrise",
      reference: "INV-2026-003",
      issueDate: isoFromDays(-25),
      dueDate: isoFromDays(-12),
      status: "sent",
      lineItems: [invoiceLine("Brand Retainer", 1, 650, "February support")],
      discountAmount: 0,
      taxRate: 0,
      notes: "Closed with full payment.",
      createdBy: "user-demo-owner",
      attachmentIds: [],
      createdAt: isoFromDays(-25),
      updatedAt: isoFromDays(-12)
    },
    {
      id: "invoice-004",
      workspaceId: "workspace-demo",
      customerId: "cust-citron",
      reference: "INV-2026-004",
      issueDate: isoFromDays(-5),
      dueDate: isoFromDays(4),
      status: "sent",
      lineItems: [invoiceLine("Landing Page Sprint", 1, 900, "New launch page")],
      discountAmount: 0,
      taxRate: 0,
      notes: "Client expects staged payment.",
      createdBy: "user-demo-manager",
      attachmentIds: ["att-invoice-scope"],
      createdAt: isoFromDays(-5),
      updatedAt: isoFromDays(-5)
    }
  ],
  recurringInvoices: [
    {
      id: "recurring-001",
      workspaceId: "workspace-demo",
      customerId: "cust-orbit",
      label: "Orbit monthly retainer",
      frequency: "monthly",
      startDate: isoFromDays(-60),
      nextRunDate: isoFromDays(3),
      dueInDays: 14,
      isActive: true,
      lineItems: [invoiceLine("Brand Retainer", 1, 650, "Monthly support retainer")],
      discountAmount: 0,
      taxRate: 0,
      notes: "Auto-generate a draft invoice monthly.",
      createdBy: "user-demo-owner",
      generatedInvoiceIds: ["invoice-001", "invoice-003"],
      lastGeneratedAt: isoFromDays(-14),
      createdAt: isoFromDays(-60),
      updatedAt: isoFromDays(-14)
    },
    {
      id: "recurring-002",
      workspaceId: "workspace-demo",
      customerId: "cust-greenfield",
      label: "Greenfield maintenance",
      frequency: "weekly",
      startDate: isoFromDays(-28),
      nextRunDate: isoFromDays(1),
      dueInDays: 7,
      isActive: true,
      lineItems: [invoiceLine("Maintenance check-in", 1, 180, "Weekly service touchpoint")],
      discountAmount: 0,
      taxRate: 0,
      notes: "Generate a draft and send after review.",
      createdBy: "user-demo-manager",
      generatedInvoiceIds: [],
      lastGeneratedAt: isoFromDays(-6),
      createdAt: isoFromDays(-28),
      updatedAt: isoFromDays(-6)
    }
  ],
  payments: [
    {
      id: "payment-001",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-002",
      amount: 500,
      paymentDate: isoFromDays(-1),
      method: "bank_transfer",
      reference: "GF-TRX-9088",
      notes: "Partial deposit received.",
      createdBy: "user-demo-admin",
      createdAt: isoFromDays(-1)
    },
    {
      id: "payment-002",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-003",
      amount: 650,
      paymentDate: isoFromDays(-11),
      method: "mobile_money",
      reference: "ECO-0042",
      notes: "Paid in full.",
      createdBy: "user-demo-owner",
      createdAt: isoFromDays(-11)
    },
    {
      id: "payment-003",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-004",
      amount: 300,
      paymentDate: isoFromDays(-2),
      method: "cash",
      reference: "CITRON-CASH-1",
      notes: "First staged payment.",
      createdBy: "user-demo-staff",
      createdAt: isoFromDays(-2)
    }
  ],
  receipts: [
    {
      id: "receipt-001",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-002",
      paymentId: "payment-001",
      reference: "RCPT-2026-001",
      receiptDate: isoFromDays(-1),
      createdAt: isoFromDays(-1)
    },
    {
      id: "receipt-002",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-003",
      paymentId: "payment-002",
      reference: "RCPT-2026-002",
      receiptDate: isoFromDays(-11),
      createdAt: isoFromDays(-11)
    },
    {
      id: "receipt-003",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-004",
      paymentId: "payment-003",
      reference: "RCPT-2026-003",
      receiptDate: isoFromDays(-2),
      createdAt: isoFromDays(-2)
    }
  ],
  expenses: [
    {
      id: "expense-001",
      workspaceId: "workspace-demo",
      supplierId: "supp-pixel",
      category: "supplies",
      amount: 180,
      expenseDate: isoFromDays(-7),
      description: "Campaign print run",
      notes: "Paid cash on collection.",
      attachmentName: "print-invoice-march.pdf",
      attachmentIds: [],
      createdBy: "user-demo-owner",
      reviewState: "logged",
      isArchived: false,
      createdAt: isoFromDays(-7),
      updatedAt: isoFromDays(-7)
    },
    {
      id: "expense-002",
      workspaceId: "workspace-demo",
      supplierId: "supp-telecom",
      category: "utilities",
      amount: 95,
      expenseDate: isoFromDays(-4),
      description: "Business internet bill",
      notes: "Monthly fibre bill.",
      attachmentName: "metro-feb.pdf",
      attachmentIds: ["att-expense-bill"],
      createdBy: "user-demo-owner",
      reviewState: "logged",
      isArchived: false,
      createdAt: isoFromDays(-4),
      updatedAt: isoFromDays(-4)
    },
    {
      id: "expense-003",
      workspaceId: "workspace-demo",
      supplierId: undefined,
      category: "marketing",
      amount: 420,
      expenseDate: isoFromDays(-1),
      description: "Digital ad spend top-up",
      notes: "Flagged because it crossed the alert threshold.",
      attachmentName: "",
      attachmentIds: [],
      createdBy: "user-demo-manager",
      reviewState: "flagged",
      isArchived: false,
      createdAt: isoFromDays(-1),
      updatedAt: isoFromDays(-1)
    }
  ],
  purchases: samplePurchases,
  purchasePayments: [
    {
      id: "ppayment-001",
      workspaceId: "workspace-demo",
      purchaseId: "purchase-001",
      amount: 120,
      paymentDate: isoFromDays(-5),
      method: "bank_transfer",
      reference: "NW-2026-101",
      notes: "Deposit against packaging order.",
      createdBy: "user-demo-admin",
      createdAt: isoFromDays(-5)
    },
    {
      id: "ppayment-002",
      workspaceId: "workspace-demo",
      purchaseId: "purchase-002",
      amount: 180,
      paymentDate: isoFromDays(-8),
      method: "bank_transfer",
      reference: "MT-2026-202",
      notes: "Paid in full.",
      createdBy: "user-demo-owner",
      createdAt: isoFromDays(-8)
    }
  ],
  cashEntries: [
    {
      id: "cash-001",
      workspaceId: "workspace-demo",
      type: "cash_in",
      category: "Customer deposit",
      amount: 300,
      entryDate: isoFromDays(-2),
      notes: "Deposit from Citron Electrical",
      createdBy: "user-demo-staff",
      createdAt: isoFromDays(-2)
    },
    {
      id: "cash-002",
      workspaceId: "workspace-demo",
      type: "cash_out",
      category: "Office supplies",
      amount: 45,
      entryDate: isoFromDays(-2),
      notes: "Ink and stationery",
      createdBy: "user-demo-staff",
      createdAt: isoFromDays(-2)
    }
  ],
  attachments: sampleAttachments,
  notifications: [
    {
      id: "note-001",
      workspaceId: "workspace-demo",
      type: "invoice_due_soon",
      severity: "warning",
      title: "Invoice due soon",
      message: "INV-2026-001 is due in 2 days.",
      href: "/app/invoices/invoice-001",
      entityType: "invoice",
      entityId: "invoice-001",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: isoFromDays(-1)
    },
    {
      id: "note-002",
      workspaceId: "workspace-demo",
      type: "invoice_overdue",
      severity: "critical",
      title: "Overdue receivable needs follow-up",
      message: "Greenfield Hardware still owes on INV-2026-002.",
      href: "/app/invoices/invoice-002",
      entityType: "invoice",
      entityId: "invoice-002",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: isoFromDays(-1)
    },
    {
      id: "note-003",
      workspaceId: "workspace-demo",
      type: "partial_payment_recorded",
      severity: "success",
      title: "Partial payment recorded",
      message: "Citron Electrical paid part of INV-2026-004.",
      href: "/app/invoices/invoice-004",
      entityType: "invoice",
      entityId: "invoice-004",
      visibleToRoles: ["owner", "admin", "manager", "staff"],
      isRead: false,
      createdAt: isoFromDays(-2)
    },
    {
      id: "note-004",
      workspaceId: "workspace-demo",
      type: "overdue_supplier_payable",
      severity: "critical",
      title: "Supplier payable overdue",
      message: "Northwind Packaging is overdue on PUR-2026-001.",
      href: "/app/purchases/purchase-001",
      entityType: "purchase",
      entityId: "purchase-001",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: isoFromDays(-1)
    },
    {
      id: "note-005",
      workspaceId: "workspace-demo",
      type: "significant_expense",
      severity: "critical",
      title: "Large expense recorded",
      message: "Digital ad spend crossed the review threshold.",
      href: "/app/expenses/expense-003",
      entityType: "expense",
      entityId: "expense-003",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: true,
      createdAt: isoFromDays(-1)
    },
    {
      id: "note-006",
      workspaceId: "workspace-demo",
      type: "recurring_invoice_due",
      severity: "warning",
      title: "Recurring invoice run due",
      message: "Orbit monthly retainer is due to generate again this week.",
      href: "/app/recurring",
      entityType: "settings",
      entityId: "recurring-001",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: true,
      createdAt: isoFromDays(-1)
    }
  ],
  activities: [
    {
      id: "activity-001",
      workspaceId: "workspace-demo",
      title: "Partial payment recorded",
      description: "Greenfield Hardware paid USD 500 against INV-2026-002.",
      href: "/app/invoices/invoice-002",
      actorUserId: "user-demo-admin",
      createdAt: isoFromDays(-1)
    },
    {
      id: "activity-002",
      workspaceId: "workspace-demo",
      title: "Purchase recorded",
      description: "PUR-2026-003 was created for Pixel Print House.",
      href: "/app/purchases/purchase-003",
      actorUserId: "user-demo-staff",
      createdAt: isoFromDays(-4)
    },
    {
      id: "activity-003",
      workspaceId: "workspace-demo",
      title: "Recurring template updated",
      description: "Orbit monthly retainer next run date was reviewed.",
      href: "/app/recurring",
      actorUserId: "user-demo-owner",
      createdAt: isoFromDays(-3)
    }
  ],
  auditLogs: [
    {
      id: "audit-001",
      workspaceId: "workspace-demo",
      entityType: "invoice",
      entityId: "invoice-004",
      action: "created",
      actorUserId: "user-demo-manager",
      actorRole: "manager",
      title: "Invoice created",
      summary: "INV-2026-004 was created for Citron Electrical.",
      metadata: { amount: 900, customer: "Citron Electrical" },
      createdAt: isoFromDays(-5)
    },
    {
      id: "audit-002",
      workspaceId: "workspace-demo",
      entityType: "payment",
      entityId: "payment-003",
      action: "recorded",
      actorUserId: "user-demo-staff",
      actorRole: "staff",
      title: "Partial payment recorded",
      summary: "Staff recorded a USD 300 payment against INV-2026-004.",
      metadata: { invoice: "INV-2026-004", amount: 300 },
      createdAt: isoFromDays(-2)
    },
    {
      id: "audit-003",
      workspaceId: "workspace-demo",
      entityType: "purchase",
      entityId: "purchase-003",
      action: "created",
      actorUserId: "user-demo-staff",
      actorRole: "staff",
      title: "Purchase created",
      summary: "PUR-2026-003 was created for Pixel Print House.",
      metadata: { supplier: "Pixel Print House", amount: 260 },
      createdAt: isoFromDays(-4)
    },
    {
      id: "audit-004",
      workspaceId: "workspace-demo",
      entityType: "settings",
      entityId: "settings-demo",
      action: "edited",
      actorUserId: "user-demo-owner",
      actorRole: "owner",
      title: "Settings changed",
      summary: "Significant expense threshold was reviewed.",
      metadata: { significantExpenseThreshold: 300 },
      createdAt: isoFromDays(-6)
    },
    {
      id: "audit-005",
      workspaceId: "workspace-demo",
      entityType: "role",
      entityId: "member-demo-staff",
      action: "role_changed",
      actorUserId: "user-demo-owner",
      actorRole: "owner",
      title: "Role assignment updated",
      summary: "Lisa Dube remains in the staff role for limited operational access.",
      metadata: { role: "staff" },
      createdAt: isoFromDays(-7)
    }
  ],
  settings: [sampleSettings]
};

function normalizeRole(role: unknown): UserRole {
  return role === "owner" || role === "admin" || role === "manager" || role === "staff"
    ? role
    : "owner";
}

function mapCustomer(record: Partial<Customer>): Customer {
  return {
    id: record.id || crypto.randomUUID(),
    workspaceId: record.workspaceId || "",
    name: record.name || "Unnamed customer",
    email: record.email,
    phone: record.phone,
    address: record.address,
    notes: record.notes,
    attachmentIds: record.attachmentIds || [],
    isArchived: Boolean(record.isArchived),
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || record.createdAt || now
  };
}

function mapSupplier(record: Partial<Supplier>): Supplier {
  return {
    id: record.id || crypto.randomUUID(),
    workspaceId: record.workspaceId || "",
    name: record.name || "Unnamed supplier",
    email: record.email,
    phone: record.phone,
    address: record.address,
    notes: record.notes,
    attachmentIds: record.attachmentIds || [],
    isArchived: Boolean(record.isArchived),
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || record.createdAt || now
  };
}

function mapExpense(record: Partial<Expense>, settings?: WorkspaceSettings): Expense {
  const amount = Number(record.amount || 0);
  return {
    id: record.id || crypto.randomUUID(),
    workspaceId: record.workspaceId || "",
    supplierId: record.supplierId,
    category: record.category || "operations",
    amount,
    expenseDate: record.expenseDate || now,
    description: record.description || "Untitled expense",
    notes: record.notes,
    attachmentName: record.attachmentName,
    attachmentIds: record.attachmentIds || [],
    createdBy: record.createdBy || "",
    reviewState:
      record.reviewState ||
      (amount >= (settings?.significantExpenseThreshold || 300) ? "flagged" : "logged"),
    isArchived: Boolean(record.isArchived),
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || record.createdAt || now
  };
}

function mapNotification(record: Partial<AppNotification>): AppNotification {
  return {
    id: record.id || crypto.randomUUID(),
    workspaceId: record.workspaceId || "",
    type: record.type || "system",
    severity: detectNotificationSeverity(record.type || "system", record.severity),
    title: record.title || "System notification",
    message: record.message || "",
    href: record.href,
    entityType: record.entityType,
    entityId: record.entityId,
    visibleToRoles: record.visibleToRoles,
    isRead: Boolean(record.isRead),
    createdAt: record.createdAt || now
  };
}

export function upgradeAppState(rawState: unknown): AppState {
  if (!rawState || typeof rawState !== "object") {
    return createEmptyAppState();
  }

  const source = rawState as Partial<AppState>;
  const settings: WorkspaceSettings[] = Array.isArray(source.settings)
    ? source.settings.map((record) => ({
        id: record.id || crypto.randomUUID(),
        workspaceId: record.workspaceId || "",
        invoicePrefix: record.invoicePrefix || "INV",
        quotePrefix: record.quotePrefix || "Q",
        receiptPrefix: record.receiptPrefix || "RCPT",
        purchasePrefix: record.purchasePrefix || "PUR",
        dueSoonDays: Number(record.dueSoonDays || 7),
        defaultInvoiceDueDays: Number(record.defaultInvoiceDueDays || 14),
        defaultPurchaseDueDays: Number(record.defaultPurchaseDueDays || 14),
        significantExpenseThreshold: Number(record.significantExpenseThreshold || 300),
        notificationsEnabled:
          record.notificationsEnabled === undefined
            ? true
            : Boolean(record.notificationsEnabled),
        paymentRemindersEnabled:
          record.paymentRemindersEnabled === undefined
            ? true
            : Boolean(record.paymentRemindersEnabled),
        brandAccent: record.brandAccent || "#c9a95a",
        termsSnippet: record.termsSnippet,
        createdAt: record.createdAt || now,
        updatedAt: record.updatedAt || record.createdAt || now
      }))
    : [];

  return {
    users: Array.isArray(source.users)
      ? source.users.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          fullName: record.fullName || "Workspace user",
          email: record.email || "",
          role: normalizeRole(record.role),
          passwordHash: record.passwordHash || defaultPasswordHash,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    workspaces: Array.isArray(source.workspaces)
      ? source.workspaces.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          name: record.name || "Untitled workspace",
          category: record.category || "services",
          currency: record.currency || "USD",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    workspaceMembers: Array.isArray(source.workspaceMembers)
      ? source.workspaceMembers.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          userId: record.userId || "",
          role: normalizeRole(record.role),
          createdAt: record.createdAt || now
        }))
      : [],
    customers: Array.isArray(source.customers) ? source.customers.map(mapCustomer) : [],
    suppliers: Array.isArray(source.suppliers) ? source.suppliers.map(mapSupplier) : [],
    items: Array.isArray(source.items)
      ? source.items.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          name: record.name || "Untitled item",
          kind: record.kind || "service",
          sellingPrice: Number(record.sellingPrice || 0),
          cost: record.cost === undefined ? undefined : Number(record.cost),
          isActive: record.isActive === undefined ? true : Boolean(record.isActive),
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    quotes: Array.isArray(source.quotes)
      ? source.quotes.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          customerId: record.customerId || "",
          reference: record.reference || "Q-UNKNOWN",
          issueDate: record.issueDate || now,
          expiryDate: record.expiryDate || now,
          status: record.status || "draft",
          lineItems: record.lineItems || [],
          discountAmount: Number(record.discountAmount || 0),
          taxRate: Number(record.taxRate || 0),
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    invoices: Array.isArray(source.invoices)
      ? source.invoices.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          customerId: record.customerId || "",
          reference: record.reference || "INV-UNKNOWN",
          issueDate: record.issueDate || now,
          dueDate: record.dueDate || now,
          status: record.status || "draft",
          lineItems: record.lineItems || [],
          discountAmount: Number(record.discountAmount || 0),
          taxRate: Number(record.taxRate || 0),
          attachmentIds: record.attachmentIds || [],
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    recurringInvoices: Array.isArray(source.recurringInvoices)
      ? source.recurringInvoices.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          customerId: record.customerId || "",
          label: record.label || "Recurring invoice",
          frequency: record.frequency || "monthly",
          startDate: record.startDate || now,
          nextRunDate: record.nextRunDate || now,
          dueInDays: Number(record.dueInDays || 14),
          isActive: record.isActive === undefined ? true : Boolean(record.isActive),
          lineItems: record.lineItems || [],
          discountAmount: Number(record.discountAmount || 0),
          taxRate: Number(record.taxRate || 0),
          createdBy: record.createdBy || "",
          generatedInvoiceIds: record.generatedInvoiceIds || [],
          lastGeneratedAt: record.lastGeneratedAt,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    payments: Array.isArray(source.payments)
      ? source.payments.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          invoiceId: record.invoiceId || "",
          amount: Number(record.amount || 0),
          paymentDate: record.paymentDate || now,
          method: record.method || "other",
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now
        }))
      : [],
    receipts: Array.isArray(source.receipts)
      ? source.receipts.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          invoiceId: record.invoiceId || "",
          paymentId: record.paymentId || "",
          reference: record.reference || "RCPT-UNKNOWN",
          receiptDate: record.receiptDate || now,
          createdAt: record.createdAt || now
        }))
      : [],
    expenses: Array.isArray(source.expenses)
      ? source.expenses.map((record) =>
          mapExpense(
            record,
            settings.find((setting) => setting.workspaceId === record.workspaceId)
          )
        )
      : [],
    purchases: Array.isArray(source.purchases)
      ? source.purchases.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          supplierId: record.supplierId || "",
          reference: record.reference || "PUR-UNKNOWN",
          purchaseDate: record.purchaseDate || now,
          dueDate: record.dueDate || now,
          status: record.status || "draft",
          lineItems: record.lineItems || [],
          attachmentIds: record.attachmentIds || [],
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    purchasePayments: Array.isArray(source.purchasePayments)
      ? source.purchasePayments.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          purchaseId: record.purchaseId || "",
          amount: Number(record.amount || 0),
          paymentDate: record.paymentDate || now,
          method: record.method || "other",
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now
        }))
      : [],
    cashEntries: Array.isArray(source.cashEntries)
      ? source.cashEntries.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          type: record.type || "cash_in",
          amount: Number(record.amount || 0),
          category: record.category || "Cash movement",
          entryDate: record.entryDate || now,
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now
        }))
      : [],
    attachments: Array.isArray(source.attachments)
      ? source.attachments.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          entityType: record.entityType || "invoice",
          entityId: record.entityId || "",
          fileName: record.fileName || "attachment.txt",
          mimeType: record.mimeType || "text/plain",
          sizeBytes: Number(record.sizeBytes || 0),
          dataUrl: record.dataUrl || "",
          uploadedBy: record.uploadedBy || "",
          createdAt: record.createdAt || now
        }))
      : [],
    notifications: Array.isArray(source.notifications)
      ? source.notifications.map(mapNotification)
      : [],
    activities: Array.isArray(source.activities)
      ? source.activities.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          title: record.title || "Activity",
          description: record.description || "",
          createdAt: record.createdAt || now
        }))
      : [],
    auditLogs: Array.isArray(source.auditLogs)
      ? source.auditLogs.map((record) => ({
          ...record,
          id: record.id || crypto.randomUUID(),
          workspaceId: record.workspaceId || "",
          entityType: record.entityType || "settings",
          entityId: record.entityId || "",
          action: record.action || "edited",
          actorUserId: record.actorUserId || "",
          actorRole: normalizeRole(record.actorRole),
          title: record.title || "Audit log",
          summary: record.summary || "",
          metadata: record.metadata,
          createdAt: record.createdAt || now
        }))
      : [],
    settings
  };
}

export const onboardingDefaults = {
  businessName: "",
  category: "services",
  currency: "USD",
  phone: "",
  email: "",
  address: "",
  taxNumber: "",
  dueSoonDays: 7,
  invoicePrefix: "INV",
  quotePrefix: "Q",
  receiptPrefix: "RCPT",
  purchasePrefix: "PUR",
  defaultInvoiceDueDays: 14,
  defaultPurchaseDueDays: 14,
  significantExpenseThreshold: 300,
  termsSnippet: "Payment due within 14 days unless otherwise agreed in writing.",
  accentColor: "#c9a95a",
  issueDate: toDateInputValue(today),
  recurringLabel: "Monthly service retainer",
  recurringNextRunDate: getNextRecurringRunDate(now, "monthly").slice(0, 10)
};
