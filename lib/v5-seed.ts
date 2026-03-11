import { AuditLog } from "@/lib/types";
import { FlowV5State } from "@/lib/v5-types";

function timestamp(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

export function createEmptyFlowV5State(): FlowV5State {
  return {
    paymentRequests: [],
    reconciliationRecords: [],
    supplierCreditTerms: [],
    readinessHistory: [],
    invoiceCandidateSelections: [],
    partnerFinancePackages: [],
    financeNotifications: [],
    financeAuditLogs: []
  };
}

const seededAuditLogs: AuditLog[] = [
  {
    id: "audit-finance-001",
    workspaceId: "workspace-demo",
    entityType: "payment_request",
    entityId: "request-001",
    action: "created",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Payment request created",
    summary: "Orbit retainer invoice now has a shareable payment request reference.",
    createdAt: timestamp(-8)
  },
  {
    id: "audit-finance-002",
    workspaceId: "workspace-demo",
    entityType: "reconciliation",
    entityId: "recon-payment-002",
    action: "reconciled",
    actorUserId: "user-demo-admin",
    actorRole: "admin",
    title: "Payment reconciled",
    summary: "Sunrise Foods payment was matched and confirmed against the invoice.",
    createdAt: timestamp(-10)
  },
  {
    id: "audit-finance-003",
    workspaceId: "workspace-demo",
    entityType: "partner_package",
    entityId: "partner-pack-001",
    action: "exported",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Partner-ready finance package generated",
    summary: "Created an internal package for future financing partner review.",
    createdAt: timestamp(-2)
  }
];

export const seedFlowV5State: FlowV5State = {
  paymentRequests: [
    {
      id: "request-001",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-001",
      reference: "COL-2026-001",
      shareCode: "FLOW-COL-001",
      shareUrl: "/app/finance/collections/request-001",
      status: "sent",
      amountRequested: 650,
      currency: "USD",
      message: "Orbit retainer due this week. Share via WhatsApp or email and confirm payment once received.",
      expiresOn: timestamp(6),
      createdBy: "user-demo-owner",
      createdAt: timestamp(-8),
      updatedAt: timestamp(-8),
      history: [
        {
          id: "request-001-history-001",
          action: "created",
          note: "Collection request created from invoice detail.",
          actorUserId: "user-demo-owner",
          createdAt: timestamp(-8)
        },
        {
          id: "request-001-history-002",
          action: "shared",
          note: "Shared via WhatsApp with Orbit Logistics finance contact.",
          actorUserId: "user-demo-owner",
          createdAt: timestamp(-8)
        }
      ]
    },
    {
      id: "request-002",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-002",
      reference: "COL-2026-002",
      shareCode: "FLOW-COL-002",
      shareUrl: "/app/finance/collections/request-002",
      status: "paid",
      amountRequested: 500,
      currency: "USD",
      message: "Greenfield partial deposit request for the overdue balance.",
      createdBy: "user-demo-owner",
      linkedPaymentId: "payment-001",
      lastReminderAt: timestamp(-2),
      createdAt: timestamp(-6),
      updatedAt: timestamp(-1),
      history: [
        {
          id: "request-002-history-001",
          action: "created",
          actorUserId: "user-demo-owner",
          createdAt: timestamp(-6)
        },
        {
          id: "request-002-history-002",
          action: "reminded",
          note: "Reminder sent after due date passed.",
          actorUserId: "user-demo-admin",
          createdAt: timestamp(-2)
        },
        {
          id: "request-002-history-003",
          action: "paid",
          paymentId: "payment-001",
          actorUserId: "user-demo-admin",
          createdAt: timestamp(-1)
        }
      ]
    },
    {
      id: "request-003",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-004",
      reference: "COL-2026-003",
      shareCode: "FLOW-COL-003",
      shareUrl: "/app/finance/collections/request-003",
      status: "viewed",
      amountRequested: 600,
      currency: "USD",
      message: "Second stage collection request for Citron Electrical.",
      createdBy: "user-demo-manager",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-1),
      history: [
        {
          id: "request-003-history-001",
          action: "created",
          actorUserId: "user-demo-manager",
          createdAt: timestamp(-2)
        },
        {
          id: "request-003-history-002",
          action: "viewed",
          note: "Customer opened the request preview.",
          createdAt: timestamp(-1)
        }
      ]
    }
  ],
  reconciliationRecords: [
    {
      id: "recon-payment-001",
      workspaceId: "workspace-demo",
      kind: "invoice_payment",
      paymentId: "payment-001",
      invoiceId: "invoice-002",
      status: "unreconciled",
      matchedAmount: 500,
      unmatchedAmount: 0,
      referenceValue: "GF-TRX-9088",
      note: "Payment recorded, waiting for manual confirmation against bank statement.",
      lastEvaluatedAt: timestamp(-1),
      isSystemGenerated: true,
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1),
      history: [
        {
          id: "recon-payment-001-history-001",
          action: "created",
          note: "Auto-created from recorded invoice payment.",
          createdAt: timestamp(-1)
        }
      ]
    },
    {
      id: "recon-payment-002",
      workspaceId: "workspace-demo",
      kind: "invoice_payment",
      paymentId: "payment-002",
      invoiceId: "invoice-003",
      status: "reconciled",
      matchedAmount: 650,
      unmatchedAmount: 0,
      referenceValue: "ECO-0042",
      note: "Matched to mobile money statement.",
      reconciledBy: "user-demo-admin",
      reconciledAt: timestamp(-10),
      lastEvaluatedAt: timestamp(-10),
      isSystemGenerated: true,
      createdAt: timestamp(-11),
      updatedAt: timestamp(-10),
      history: [
        {
          id: "recon-payment-002-history-001",
          action: "created",
          createdAt: timestamp(-11)
        },
        {
          id: "recon-payment-002-history-002",
          action: "reconciled",
          actorUserId: "user-demo-admin",
          previousStatus: "unreconciled",
          nextStatus: "reconciled",
          createdAt: timestamp(-10)
        }
      ]
    },
    {
      id: "recon-payment-003",
      workspaceId: "workspace-demo",
      kind: "invoice_payment",
      paymentId: "payment-003",
      invoiceId: "invoice-004",
      status: "mismatch",
      matchedAmount: 250,
      unmatchedAmount: 50,
      referenceValue: "CITRON-CASH-1",
      note: "Cash slip amount and recorded amount still need review.",
      lastEvaluatedAt: timestamp(-2),
      isSystemGenerated: true,
      createdAt: timestamp(-2),
      updatedAt: timestamp(-2),
      history: [
        {
          id: "recon-payment-003-history-001",
          action: "created",
          createdAt: timestamp(-2)
        },
        {
          id: "recon-payment-003-history-002",
          action: "flagged",
          note: "Mismatch noted during finance review.",
          actorUserId: "user-demo-owner",
          previousStatus: "unreconciled",
          nextStatus: "mismatch",
          createdAt: timestamp(-2)
        }
      ]
    },
    {
      id: "recon-ppayment-001",
      workspaceId: "workspace-demo",
      kind: "supplier_payment",
      purchasePaymentId: "ppayment-001",
      purchaseId: "purchase-001",
      status: "partial",
      matchedAmount: 120,
      unmatchedAmount: 0,
      referenceValue: "NW-2026-101",
      note: "Deposit reconciled but supplier payable remains open.",
      reconciledBy: "user-demo-admin",
      reconciledAt: timestamp(-5),
      lastEvaluatedAt: timestamp(-5),
      isSystemGenerated: true,
      createdAt: timestamp(-5),
      updatedAt: timestamp(-5),
      history: [
        {
          id: "recon-ppayment-001-history-001",
          action: "created",
          createdAt: timestamp(-5)
        },
        {
          id: "recon-ppayment-001-history-002",
          action: "reconciled",
          actorUserId: "user-demo-admin",
          previousStatus: "unreconciled",
          nextStatus: "partial",
          createdAt: timestamp(-5)
        }
      ]
    },
    {
      id: "recon-ppayment-002",
      workspaceId: "workspace-demo",
      kind: "supplier_payment",
      purchasePaymentId: "ppayment-002",
      purchaseId: "purchase-002",
      status: "reconciled",
      matchedAmount: 180,
      unmatchedAmount: 0,
      referenceValue: "MT-2026-202",
      note: "Supplier payment fully matched.",
      reconciledBy: "user-demo-owner",
      reconciledAt: timestamp(-8),
      lastEvaluatedAt: timestamp(-8),
      isSystemGenerated: true,
      createdAt: timestamp(-8),
      updatedAt: timestamp(-8),
      history: [
        {
          id: "recon-ppayment-002-history-001",
          action: "created",
          createdAt: timestamp(-8)
        },
        {
          id: "recon-ppayment-002-history-002",
          action: "reconciled",
          actorUserId: "user-demo-owner",
          previousStatus: "unreconciled",
          nextStatus: "reconciled",
          createdAt: timestamp(-8)
        }
      ]
    }
  ],
  supplierCreditTerms: [
    {
      id: "supplier-credit-001",
      workspaceId: "workspace-demo",
      supplierId: "supp-northwind",
      creditDays: 21,
      reminderDays: 5,
      creditLimitEstimate: 1500,
      status: "healthy",
      notes: "Packaging supplier is comfortable with staged settlement when volume remains consistent.",
      createdAt: timestamp(-30),
      updatedAt: timestamp(-4)
    },
    {
      id: "supplier-credit-002",
      workspaceId: "workspace-demo",
      supplierId: "supp-telecom",
      creditDays: 30,
      reminderDays: 7,
      creditLimitEstimate: 800,
      status: "healthy",
      notes: "Telecom services paid on time and stable.",
      createdAt: timestamp(-50),
      updatedAt: timestamp(-8)
    },
    {
      id: "supplier-credit-003",
      workspaceId: "workspace-demo",
      supplierId: "supp-pixel",
      creditDays: 14,
      reminderDays: 3,
      creditLimitEstimate: 900,
      status: "watch",
      notes: "Keep print supplier obligations visible because campaign work spikes quickly.",
      createdAt: timestamp(-25),
      updatedAt: timestamp(-3)
    }
  ],
  readinessHistory: [
    {
      id: "readiness-history-001",
      workspaceId: "workspace-demo",
      generatedAt: timestamp(-30),
      capitalReadinessScore: 48,
      readinessBand: "steady",
      note: "Collections improved after recurring retainer invoicing stabilized."
    },
    {
      id: "readiness-history-002",
      workspaceId: "workspace-demo",
      generatedAt: timestamp(-14),
      capitalReadinessScore: 57,
      readinessBand: "steady",
      note: "Supplier obligations reduced, but reconciliation work remained open."
    },
    {
      id: "readiness-history-003",
      workspaceId: "workspace-demo",
      generatedAt: timestamp(-3),
      capitalReadinessScore: 64,
      readinessBand: "steady",
      note: "Network activity and payment consistency improved the readiness view."
    }
  ],
  invoiceCandidateSelections: [
    {
      id: "candidate-selection-001",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-001",
      isSelected: true,
      note: "Strong retainer invoice candidate for future partner review.",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-2)
    },
    {
      id: "candidate-selection-002",
      workspaceId: "workspace-demo",
      invoiceId: "invoice-004",
      isSelected: false,
      note: "Hold until cash mismatch is resolved.",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-2)
    }
  ],
  partnerFinancePackages: [
    {
      id: "partner-pack-001",
      workspaceId: "workspace-demo",
      reference: "CAP-READY-2026-001",
      status: "generated",
      consentMode: "internal_only",
      includedInvoiceIds: ["invoice-001"],
      createdBy: "user-demo-owner",
      summaryNote: "Internal finance-readiness pack for a future partner-lender review.",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-2)
    }
  ],
  financeNotifications: [
    {
      id: "finance-note-001",
      workspaceId: "workspace-demo",
      type: "payment_request_created",
      title: "Payment request sent",
      message: "Orbit Logistics received a payment request for INV-2026-001.",
      href: "/app/finance/collections/request-001",
      relatedEntityType: "payment_request",
      relatedEntityId: "request-001",
      isRead: false,
      createdAt: timestamp(-8)
    },
    {
      id: "finance-note-002",
      workspaceId: "workspace-demo",
      type: "payment_mismatch_detected",
      title: "Payment mismatch flagged",
      message: "Citron cash collection needs reconciliation review.",
      href: "/app/finance/reconciliation",
      relatedEntityType: "reconciliation",
      relatedEntityId: "recon-payment-003",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: timestamp(-2)
    },
    {
      id: "finance-note-003",
      workspaceId: "workspace-demo",
      type: "eligible_invoice_flagged",
      title: "Invoice financing candidate selected",
      message: "INV-2026-001 was flagged as a strong candidate for future financing review.",
      href: "/app/finance/eligible-invoices",
      relatedEntityType: "invoice_financing_candidate",
      relatedEntityId: "invoice-001",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: true,
      createdAt: timestamp(-2)
    },
    {
      id: "finance-note-004",
      workspaceId: "workspace-demo",
      type: "supplier_credit_due_soon",
      title: "Supplier credit follow-up due soon",
      message: "Pixel Print House obligations need attention within the next few days.",
      href: "/app/finance/supplier-credit",
      relatedEntityType: "supplier_credit",
      relatedEntityId: "supplier-credit-003",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: timestamp(-1)
    },
    {
      id: "finance-note-005",
      workspaceId: "workspace-demo",
      type: "financial_health_warning",
      title: "Reconciliation coverage needs work",
      message: "Unreconciled collections are weakening finance readiness.",
      href: "/app/finance",
      relatedEntityType: "financing_profile",
      relatedEntityId: "workspace-demo",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: timestamp(-1)
    }
  ],
  financeAuditLogs: seededAuditLogs
};

export function upgradeFlowV5State(state?: Partial<FlowV5State> | null): FlowV5State {
  return {
    paymentRequests: state?.paymentRequests || seedFlowV5State.paymentRequests,
    reconciliationRecords:
      state?.reconciliationRecords || seedFlowV5State.reconciliationRecords,
    supplierCreditTerms: state?.supplierCreditTerms || seedFlowV5State.supplierCreditTerms,
    readinessHistory: state?.readinessHistory || seedFlowV5State.readinessHistory,
    invoiceCandidateSelections:
      state?.invoiceCandidateSelections || seedFlowV5State.invoiceCandidateSelections,
    partnerFinancePackages:
      state?.partnerFinancePackages || seedFlowV5State.partnerFinancePackages,
    financeNotifications: state?.financeNotifications || seedFlowV5State.financeNotifications,
    financeAuditLogs: state?.financeAuditLogs || seedFlowV5State.financeAuditLogs
  };
}
