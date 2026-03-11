import { UserRole } from "@/lib/types";
import {
  ApprovalRequest,
  Branch,
  FlowV3State,
  OperationalAlert,
  ProjectJob,
  RecordMeta,
  StockAdjustment,
  StockProfile,
  TeamInvite,
  TeamMemberProfile,
  TemplateSettings,
  VaultDocument
} from "@/lib/v3-types";

const nowDate = new Date();
const now = nowDate.toISOString();

function isoFromDays(days: number) {
  const value = new Date(nowDate);
  value.setDate(value.getDate() + days);
  return value.toISOString();
}

function mapRole(role: unknown): UserRole {
  return role === "admin" || role === "manager" || role === "staff" ? role : "owner";
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createEmptyFlowV3State(): FlowV3State {
  return {
    branches: [],
    teamInvites: [],
    teamProfiles: [],
    approvals: [],
    stockProfiles: [],
    stockAdjustments: [],
    projects: [],
    recordMeta: [],
    vaultDocuments: [],
    templateSettings: [],
    operationalAlerts: []
  };
}

const sampleBranches: Branch[] = [
  {
    id: "branch-hq",
    workspaceId: "workspace-demo",
    name: "Harare HQ",
    code: "HQ",
    address: "Alexandra Park, Harare",
    phone: "+263 77 100 2200",
    managerName: "Ruth Moyo",
    isPrimary: true,
    status: "active",
    createdAt: isoFromDays(-150),
    updatedAt: isoFromDays(-10)
  },
  {
    id: "branch-byo",
    workspaceId: "workspace-demo",
    name: "Bulawayo Operations",
    code: "BYO",
    address: "Belmont, Bulawayo",
    phone: "+263 71 884 2200",
    managerName: "Farai Dube",
    isPrimary: false,
    status: "active",
    createdAt: isoFromDays(-80),
    updatedAt: isoFromDays(-6)
  }
];

const sampleTeamProfiles: TeamMemberProfile[] = [
  {
    id: "team-owner",
    workspaceId: "workspace-demo",
    workspaceMemberId: "member-demo-owner",
    userId: "user-demo-owner",
    fullName: "Tendai Moyo",
    email: "owner@novoriq.demo",
    role: "owner",
    department: "Leadership",
    status: "active",
    lastActiveAt: isoFromDays(0),
    createdAt: isoFromDays(-100),
    updatedAt: isoFromDays(-1)
  },
  {
    id: "team-admin",
    workspaceId: "workspace-demo",
    workspaceMemberId: "member-demo-admin",
    userId: "user-demo-admin",
    fullName: "Rudo Chikore",
    email: "admin@novoriq.demo",
    role: "admin",
    department: "Finance",
    status: "active",
    lastActiveAt: isoFromDays(-1),
    createdAt: isoFromDays(-90),
    updatedAt: isoFromDays(-1)
  },
  {
    id: "team-manager",
    workspaceId: "workspace-demo",
    workspaceMemberId: "member-demo-manager",
    userId: "user-demo-manager",
    fullName: "Kuda Nyoni",
    email: "manager@novoriq.demo",
    role: "manager",
    department: "Operations",
    status: "active",
    lastActiveAt: isoFromDays(-1),
    createdAt: isoFromDays(-80),
    updatedAt: isoFromDays(-1)
  },
  {
    id: "team-staff",
    workspaceId: "workspace-demo",
    workspaceMemberId: "member-demo-staff",
    userId: "user-demo-staff",
    fullName: "Tariro Dube",
    email: "staff@novoriq.demo",
    role: "staff",
    department: "Production",
    status: "active",
    lastActiveAt: isoFromDays(-2),
    createdAt: isoFromDays(-75),
    updatedAt: isoFromDays(-2)
  }
];

const sampleInvites: TeamInvite[] = [
  {
    id: "invite-ops-001",
    workspaceId: "workspace-demo",
    fullName: "Shamiso Gora",
    email: "ops@novoriq.demo",
    role: "staff",
    department: "Operations",
    status: "pending",
    invitedBy: "user-demo-owner",
    notes: "Joining to help with dispatch and branch operations.",
    createdAt: isoFromDays(-2),
    updatedAt: isoFromDays(-2)
  }
];

const sampleApprovals: ApprovalRequest[] = [
  {
    id: "approval-expense-003",
    workspaceId: "workspace-demo",
    entityType: "expense",
    entityId: "expense-003",
    branchId: "branch-hq",
    title: "Review significant marketing spend",
    description: "Digital ad spend top-up crossed the approval threshold.",
    status: "pending",
    requestedBy: "user-demo-manager",
    createdAt: isoFromDays(-1),
    updatedAt: isoFromDays(-1),
    history: [
      {
        id: "approval-history-exp-001",
        action: "requested",
        actorUserId: "user-demo-manager",
        actorRole: "manager",
        note: "Flagged because it exceeded the default control threshold.",
        createdAt: isoFromDays(-1)
      }
    ]
  },
  {
    id: "approval-purchase-003",
    workspaceId: "workspace-demo",
    entityType: "purchase",
    entityId: "purchase-003",
    branchId: "branch-byo",
    title: "Confirm staff-created purchase",
    description: "Promo print run was raised by staff and needs manager approval.",
    status: "pending",
    requestedBy: "user-demo-staff",
    createdAt: isoFromDays(-4),
    updatedAt: isoFromDays(-4),
    history: [
      {
        id: "approval-history-pur-001",
        action: "requested",
        actorUserId: "user-demo-staff",
        actorRole: "staff",
        note: "Raised for the Bulawayo launch activity.",
        createdAt: isoFromDays(-4)
      }
    ]
  }
];

const sampleStockProfiles: StockProfile[] = [
  {
    id: "stock-profile-print",
    workspaceId: "workspace-demo",
    itemId: "item-print-bundle",
    isTracked: true,
    openingQuantity: 2,
    reorderLevel: 3,
    preferredBranchId: "branch-byo",
    createdAt: isoFromDays(-45),
    updatedAt: isoFromDays(-3)
  },
  {
    id: "stock-profile-retainer",
    workspaceId: "workspace-demo",
    itemId: "item-brand-retainer",
    isTracked: false,
    openingQuantity: 0,
    reorderLevel: 0,
    preferredBranchId: "branch-hq",
    createdAt: isoFromDays(-45),
    updatedAt: isoFromDays(-3)
  },
  {
    id: "stock-profile-web",
    workspaceId: "workspace-demo",
    itemId: "item-website-sprint",
    isTracked: false,
    openingQuantity: 0,
    reorderLevel: 0,
    preferredBranchId: "branch-hq",
    createdAt: isoFromDays(-45),
    updatedAt: isoFromDays(-3)
  }
];

const sampleStockAdjustments: StockAdjustment[] = [
  {
    id: "stock-adjustment-001",
    workspaceId: "workspace-demo",
    itemId: "item-print-bundle",
    branchId: "branch-byo",
    direction: "decrease",
    quantity: 1,
    reason: "Client sample set",
    notes: "Used for an urgent showroom sample pack.",
    createdBy: "user-demo-manager",
    createdAt: isoFromDays(-2)
  }
];

const sampleProjects: ProjectJob[] = [
  {
    id: "project-orbit-retainer",
    workspaceId: "workspace-demo",
    name: "Orbit Retainer Rollout",
    code: "ORB-001",
    customerId: "cust-orbit",
    branchId: "branch-hq",
    status: "active",
    notes: "Monthly retainers and campaign support.",
    budgetAmount: 1500,
    createdBy: "user-demo-owner",
    createdAt: isoFromDays(-40),
    updatedAt: isoFromDays(-5)
  },
  {
    id: "project-sunrise-launch",
    workspaceId: "workspace-demo",
    name: "Sunrise Product Launch",
    code: "SUN-002",
    customerId: "cust-sunrise",
    branchId: "branch-byo",
    status: "active",
    notes: "Branch-led print and launch support.",
    budgetAmount: 2400,
    createdBy: "user-demo-manager",
    createdAt: isoFromDays(-18),
    updatedAt: isoFromDays(-2)
  }
];

const sampleRecordMeta: RecordMeta[] = [
  {
    id: "meta-quote-001",
    workspaceId: "workspace-demo",
    entityType: "quote",
    entityId: "quote-001",
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    createdAt: isoFromDays(-8),
    updatedAt: isoFromDays(-8)
  },
  {
    id: "meta-invoice-001",
    workspaceId: "workspace-demo",
    entityType: "invoice",
    entityId: "invoice-001",
    branchId: "branch-hq",
    projectId: "project-orbit-retainer",
    createdAt: isoFromDays(-14),
    updatedAt: isoFromDays(-14)
  },
  {
    id: "meta-invoice-002",
    workspaceId: "workspace-demo",
    entityType: "invoice",
    entityId: "invoice-002",
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    createdAt: isoFromDays(-18),
    updatedAt: isoFromDays(-6)
  },
  {
    id: "meta-invoice-003",
    workspaceId: "workspace-demo",
    entityType: "invoice",
    entityId: "invoice-003",
    branchId: "branch-hq",
    createdAt: isoFromDays(-25),
    updatedAt: isoFromDays(-12)
  },
  {
    id: "meta-invoice-004",
    workspaceId: "workspace-demo",
    entityType: "invoice",
    entityId: "invoice-004",
    branchId: "branch-byo",
    createdAt: isoFromDays(-5),
    updatedAt: isoFromDays(-5)
  },
  {
    id: "meta-expense-001",
    workspaceId: "workspace-demo",
    entityType: "expense",
    entityId: "expense-001",
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    createdAt: isoFromDays(-7),
    updatedAt: isoFromDays(-7)
  },
  {
    id: "meta-expense-002",
    workspaceId: "workspace-demo",
    entityType: "expense",
    entityId: "expense-002",
    branchId: "branch-hq",
    createdAt: isoFromDays(-4),
    updatedAt: isoFromDays(-4)
  },
  {
    id: "meta-expense-003",
    workspaceId: "workspace-demo",
    entityType: "expense",
    entityId: "expense-003",
    branchId: "branch-hq",
    createdAt: isoFromDays(-1),
    updatedAt: isoFromDays(-1)
  },
  {
    id: "meta-purchase-001",
    workspaceId: "workspace-demo",
    entityType: "purchase",
    entityId: "purchase-001",
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    createdAt: isoFromDays(-12),
    updatedAt: isoFromDays(-5)
  },
  {
    id: "meta-purchase-002",
    workspaceId: "workspace-demo",
    entityType: "purchase",
    entityId: "purchase-002",
    branchId: "branch-hq",
    createdAt: isoFromDays(-22),
    updatedAt: isoFromDays(-8)
  },
  {
    id: "meta-purchase-003",
    workspaceId: "workspace-demo",
    entityType: "purchase",
    entityId: "purchase-003",
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    createdAt: isoFromDays(-4),
    updatedAt: isoFromDays(-4)
  },
  {
    id: "meta-purchase-004",
    workspaceId: "workspace-demo",
    entityType: "purchase",
    entityId: "purchase-004",
    branchId: "branch-hq",
    createdAt: isoFromDays(-1),
    updatedAt: isoFromDays(-1)
  }
];

const sampleDocuments: VaultDocument[] = [
  {
    id: "doc-contract-orbit",
    workspaceId: "workspace-demo",
    title: "Orbit annual retainer contract",
    category: "contract",
    fileName: "orbit-retainer-contract.pdf",
    mimeType: "application/pdf",
    sizeBytes: 184000,
    dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr",
    linkedEntityType: "customer",
    linkedEntityId: "cust-orbit",
    branchId: "branch-hq",
    projectId: "project-orbit-retainer",
    uploadedBy: "user-demo-owner",
    createdAt: isoFromDays(-20),
    updatedAt: isoFromDays(-20)
  },
  {
    id: "doc-sunrise-launch-brief",
    workspaceId: "workspace-demo",
    title: "Sunrise launch brief",
    category: "project",
    fileName: "sunrise-launch-brief.txt",
    mimeType: "text/plain",
    sizeBytes: 420,
    dataUrl: "data:text/plain;base64,U3VucmlzZSBsYXVuY2ggYnJpZWY=",
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    uploadedBy: "user-demo-manager",
    createdAt: isoFromDays(-6),
    updatedAt: isoFromDays(-6)
  }
];

const sampleTemplateSettings: TemplateSettings[] = [
  {
    workspaceId: "workspace-demo",
    invoiceStyle: "modern",
    quoteStyle: "classic",
    receiptStyle: "compact",
    footerNote: "Thank you for growing with Novoriq Flow.",
    showLogo: true,
    createdAt: isoFromDays(-40),
    updatedAt: isoFromDays(-3)
  }
];

const sampleOperationalAlerts: OperationalAlert[] = [
  {
    id: "v3-alert-approval-expense",
    workspaceId: "workspace-demo",
    type: "approval_needed",
    title: "Approval needed for marketing spend",
    message: "Digital ad spend top-up is waiting for owner approval.",
    href: "/app/approvals",
    visibleToRoles: ["owner", "admin", "manager"],
    branchId: "branch-hq",
    isRead: false,
    createdAt: isoFromDays(-1)
  },
  {
    id: "v3-alert-project-margin",
    workspaceId: "workspace-demo",
    type: "project_margin",
    title: "Sunrise launch margin is tightening",
    message: "Costs are rising faster than collections on the Sunrise project.",
    href: "/app/projects/project-sunrise-launch",
    visibleToRoles: ["owner", "admin", "manager"],
    branchId: "branch-byo",
    projectId: "project-sunrise-launch",
    isRead: false,
    createdAt: isoFromDays(-2)
  }
];

export const seedFlowV3State: FlowV3State = {
  branches: sampleBranches,
  teamInvites: sampleInvites,
  teamProfiles: sampleTeamProfiles,
  approvals: sampleApprovals,
  stockProfiles: sampleStockProfiles,
  stockAdjustments: sampleStockAdjustments,
  projects: sampleProjects,
  recordMeta: sampleRecordMeta,
  vaultDocuments: sampleDocuments,
  templateSettings: sampleTemplateSettings,
  operationalAlerts: sampleOperationalAlerts
};

export function upgradeFlowV3State(rawState: unknown): FlowV3State {
  if (!rawState || typeof rawState !== "object") {
    return createEmptyFlowV3State();
  }

  const source = rawState as Partial<FlowV3State>;

  return {
    branches: Array.isArray(source.branches)
      ? source.branches.map((record) => ({
          id: record.id || createId("branch"),
          workspaceId: record.workspaceId || "",
          name: record.name || "Main branch",
          code: record.code || "MAIN",
          address: record.address,
          phone: record.phone,
          managerName: record.managerName,
          isPrimary: Boolean(record.isPrimary),
          status: record.status || "active",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    teamInvites: Array.isArray(source.teamInvites)
      ? source.teamInvites.map((record) => ({
          id: record.id || createId("invite"),
          workspaceId: record.workspaceId || "",
          fullName: record.fullName || "Pending teammate",
          email: record.email || "",
          role: mapRole(record.role),
          department: record.department,
          status: record.status || "pending",
          invitedBy: record.invitedBy || "",
          notes: record.notes,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    teamProfiles: Array.isArray(source.teamProfiles)
      ? source.teamProfiles.map((record) => ({
          id: record.id || createId("team"),
          workspaceId: record.workspaceId || "",
          workspaceMemberId: record.workspaceMemberId,
          userId: record.userId,
          fullName: record.fullName || "Workspace teammate",
          email: record.email || "",
          role: mapRole(record.role),
          department: record.department,
          status: record.status || "active",
          notes: record.notes,
          lastActiveAt: record.lastActiveAt,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    approvals: Array.isArray(source.approvals)
      ? source.approvals.map((record) => ({
          id: record.id || createId("approval"),
          workspaceId: record.workspaceId || "",
          entityType: record.entityType || "expense",
          entityId: record.entityId || "",
          branchId: record.branchId,
          title: record.title || "Approval request",
          description: record.description || "",
          status: record.status || "pending",
          requestedBy: record.requestedBy || "",
          approverId: record.approverId,
          currentNote: record.currentNote,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now,
          history: Array.isArray(record.history)
            ? record.history.map((entry) => ({
                id: entry.id || createId("approval-history"),
                action: entry.action || "requested",
                actorUserId: entry.actorUserId || "",
                actorRole: mapRole(entry.actorRole),
                note: entry.note,
                createdAt: entry.createdAt || now
              }))
            : []
        }))
      : [],
    stockProfiles: Array.isArray(source.stockProfiles)
      ? source.stockProfiles.map((record) => ({
          id: record.id || createId("stock-profile"),
          workspaceId: record.workspaceId || "",
          itemId: record.itemId || "",
          isTracked: Boolean(record.isTracked),
          openingQuantity: Number(record.openingQuantity || 0),
          reorderLevel: Number(record.reorderLevel || 0),
          preferredBranchId: record.preferredBranchId,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    stockAdjustments: Array.isArray(source.stockAdjustments)
      ? source.stockAdjustments.map((record) => ({
          id: record.id || createId("stock-adjustment"),
          workspaceId: record.workspaceId || "",
          itemId: record.itemId || "",
          branchId: record.branchId,
          direction: record.direction || "increase",
          quantity: Number(record.quantity || 0),
          reason: record.reason || "Adjustment",
          notes: record.notes,
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now
        }))
      : [],
    projects: Array.isArray(source.projects)
      ? source.projects.map((record) => ({
          id: record.id || createId("project"),
          workspaceId: record.workspaceId || "",
          name: record.name || "Project",
          code: record.code || "PRJ",
          customerId: record.customerId,
          branchId: record.branchId,
          status: record.status || "active",
          notes: record.notes,
          budgetAmount:
            record.budgetAmount === undefined ? undefined : Number(record.budgetAmount),
          createdBy: record.createdBy || "",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    recordMeta: Array.isArray(source.recordMeta)
      ? source.recordMeta.map((record) => ({
          id: record.id || createId("record-meta"),
          workspaceId: record.workspaceId || "",
          entityType: record.entityType || "invoice",
          entityId: record.entityId || "",
          branchId: record.branchId,
          projectId: record.projectId,
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    vaultDocuments: Array.isArray(source.vaultDocuments)
      ? source.vaultDocuments.map((record) => ({
          id: record.id || createId("document"),
          workspaceId: record.workspaceId || "",
          title: record.title || "Document",
          category: record.category || "other",
          fileName: record.fileName || "document.txt",
          mimeType: record.mimeType || "text/plain",
          sizeBytes: Number(record.sizeBytes || 0),
          dataUrl: record.dataUrl || "",
          linkedEntityType: record.linkedEntityType,
          linkedEntityId: record.linkedEntityId,
          branchId: record.branchId,
          projectId: record.projectId,
          uploadedBy: record.uploadedBy || "",
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    templateSettings: Array.isArray(source.templateSettings)
      ? source.templateSettings.map((record) => ({
          workspaceId: record.workspaceId || "",
          invoiceStyle: record.invoiceStyle || "classic",
          quoteStyle: record.quoteStyle || "classic",
          receiptStyle: record.receiptStyle || "compact",
          footerNote: record.footerNote,
          showLogo: record.showLogo === undefined ? true : Boolean(record.showLogo),
          createdAt: record.createdAt || now,
          updatedAt: record.updatedAt || record.createdAt || now
        }))
      : [],
    operationalAlerts: Array.isArray(source.operationalAlerts)
      ? source.operationalAlerts.map((record) => ({
          id: record.id || createId("alert"),
          workspaceId: record.workspaceId || "",
          type: record.type || "branch_attention",
          title: record.title || "Operational alert",
          message: record.message || "",
          href: record.href,
          visibleToRoles: record.visibleToRoles,
          branchId: record.branchId,
          projectId: record.projectId,
          isRead: Boolean(record.isRead),
          createdAt: record.createdAt || now
        }))
      : []
  };
}
