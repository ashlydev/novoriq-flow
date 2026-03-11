import { AuditLog, UserRole } from "@/lib/types";
import {
  enterpriseModules,
  FlowV6State,
  PermissionAction,
  PermissionProfile
} from "@/lib/v6-types";

function timestamp(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

function roleActions(role: UserRole, moduleKey: (typeof enterpriseModules)[number]["key"]) {
  if (role === "owner") {
    return ["view", "create", "edit", "delete", "approve", "export", "manage_sensitive"] as PermissionAction[];
  }

  if (role === "admin") {
    return moduleKey === "settings" || moduleKey === "admin"
      ? (["view", "edit", "approve", "export", "manage_sensitive"] as PermissionAction[])
      : (["view", "create", "edit", "delete", "approve", "export"] as PermissionAction[]);
  }

  if (role === "manager") {
    switch (moduleKey) {
      case "dashboard":
      case "intelligence":
      case "finance":
      case "purchases":
      case "reports":
      case "approvals":
      case "branches":
      case "team":
      case "exports":
        return ["view", "create", "edit", "approve", "export"] as PermissionAction[];
      case "audit":
        return ["view", "export"] as PermissionAction[];
      case "network":
        return ["view", "create", "edit"] as PermissionAction[];
      case "settings":
      case "admin":
        return ["view"] as PermissionAction[];
      default:
        return ["view"] as PermissionAction[];
    }
  }

  switch (moduleKey) {
    case "dashboard":
    case "intelligence":
    case "finance":
    case "purchases":
    case "exports":
      return ["view", "create"] as PermissionAction[];
    case "network":
      return ["view", "create", "edit"] as PermissionAction[];
    default:
      return ["view"] as PermissionAction[];
  }
}

export function createDefaultPermissionProfiles(workspaceId: string, updatedBy: string) {
  const roles: UserRole[] = ["owner", "admin", "manager", "staff"];
  return roles.flatMap((role) =>
    enterpriseModules.map(
      (module): PermissionProfile => ({
        id: `perm-${role}-${module.key}`,
        workspaceId,
        role,
        module: module.key,
        actions: roleActions(role, module.key),
        branchScope: role === "owner" || role === "admin" ? "all" : "assigned_only",
        departmentScope: role === "staff" ? "assigned_only" : "all",
        canViewSensitive: role === "owner" || role === "admin" || module.key === "dashboard",
        updatedBy,
        updatedAt: timestamp(-3)
      })
    )
  );
}

export function createEmptyFlowV6State(): FlowV6State {
  return {
    permissionProfiles: [],
    departments: [],
    departmentMemberships: [],
    reviews: [],
    controlPolicies: [],
    branchControlSettings: [],
    exportJobs: [],
    enterpriseNotifications: [],
    enterpriseAuditLogs: []
  };
}

const seededAuditLogs: AuditLog[] = [
  {
    id: "audit-v6-001",
    workspaceId: "workspace-demo",
    entityType: "permission_profile",
    entityId: "perm-manager-finance",
    action: "edited",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Permission profile updated",
    summary: "Manager finance controls were tightened for sensitive actions.",
    metadata: {
      before: "approve=false",
      after: "approve=true",
      reason: "Finance review responsibility added"
    },
    createdAt: timestamp(-4)
  },
  {
    id: "audit-v6-002",
    workspaceId: "workspace-demo",
    entityType: "review_request",
    entityId: "review-purchase-001",
    action: "accepted",
    actorUserId: "user-demo-admin",
    actorRole: "admin",
    title: "Procurement review approved",
    summary: "A high-value supplier order cleared maker-checker review.",
    metadata: {
      module: "purchases",
      amount: 980,
      branch: "Bulawayo Operations"
    },
    createdAt: timestamp(-1)
  },
  {
    id: "audit-v6-003",
    workspaceId: "workspace-demo",
    entityType: "department",
    entityId: "dept-procurement",
    action: "assigned",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Department assignment updated",
    summary: "Procurement ownership was assigned to the operations lead.",
    metadata: {
      department: "Procurement",
      manager: "Kuda Nyoni"
    },
    createdAt: timestamp(-6)
  },
  {
    id: "audit-v6-004",
    workspaceId: "workspace-demo",
    entityType: "export_job",
    entityId: "export-001",
    action: "exported",
    actorUserId: "user-demo-admin",
    actorRole: "admin",
    title: "Executive export generated",
    summary: "Branch comparison report was exported for the board review pack.",
    metadata: {
      format: "csv",
      module: "reports"
    },
    createdAt: timestamp(-2)
  }
];

export const seedFlowV6State: FlowV6State = {
  permissionProfiles: createDefaultPermissionProfiles("workspace-demo", "user-demo-owner"),
  departments: [
    {
      id: "dept-leadership",
      workspaceId: "workspace-demo",
      name: "Leadership",
      code: "LEAD",
      branchId: "branch-main",
      managerUserId: "user-demo-owner",
      description: "Executive oversight and final control authority.",
      status: "active",
      createdAt: timestamp(-120),
      updatedAt: timestamp(-4)
    },
    {
      id: "dept-finance",
      workspaceId: "workspace-demo",
      name: "Finance",
      code: "FIN",
      branchId: "branch-main",
      managerUserId: "user-demo-admin",
      description: "Collections, reconciliation, spend review, and finance readiness.",
      status: "active",
      createdAt: timestamp(-100),
      updatedAt: timestamp(-3)
    },
    {
      id: "dept-operations",
      workspaceId: "workspace-demo",
      name: "Operations",
      code: "OPS",
      branchId: "branch-byo",
      managerUserId: "user-demo-manager",
      description: "Branch operations, delivery coordination, and daily execution.",
      status: "active",
      createdAt: timestamp(-95),
      updatedAt: timestamp(-3)
    },
    {
      id: "dept-procurement",
      workspaceId: "workspace-demo",
      name: "Procurement",
      code: "PROC",
      branchId: "branch-byo",
      managerUserId: "user-demo-manager",
      description: "Supplier purchasing and procurement governance.",
      status: "active",
      createdAt: timestamp(-90),
      updatedAt: timestamp(-2)
    }
  ],
  departmentMemberships: [
    {
      id: "dept-member-owner",
      workspaceId: "workspace-demo",
      departmentId: "dept-leadership",
      profileId: "team-owner",
      userId: "user-demo-owner",
      title: "Founder",
      role: "lead",
      createdAt: timestamp(-120),
      updatedAt: timestamp(-4)
    },
    {
      id: "dept-member-admin",
      workspaceId: "workspace-demo",
      departmentId: "dept-finance",
      profileId: "team-admin",
      userId: "user-demo-admin",
      title: "Finance controller",
      role: "lead",
      createdAt: timestamp(-100),
      updatedAt: timestamp(-3)
    },
    {
      id: "dept-member-manager",
      workspaceId: "workspace-demo",
      departmentId: "dept-operations",
      profileId: "team-manager",
      userId: "user-demo-manager",
      title: "Branch operations lead",
      role: "lead",
      createdAt: timestamp(-95),
      updatedAt: timestamp(-3)
    },
    {
      id: "dept-member-staff",
      workspaceId: "workspace-demo",
      departmentId: "dept-procurement",
      profileId: "team-staff",
      userId: "user-demo-staff",
      title: "Procurement assistant",
      role: "member",
      createdAt: timestamp(-90),
      updatedAt: timestamp(-2)
    }
  ],
  reviews: [
    {
      id: "review-purchase-001",
      workspaceId: "workspace-demo",
      entityType: "purchase",
      entityId: "purchase-003",
      module: "purchases",
      title: "Bulawayo cable purchase review",
      description: "High-value branch procurement is waiting for maker-checker approval.",
      status: "pending_review",
      branchId: "branch-byo",
      departmentId: "dept-procurement",
      amount: 980,
      requestedBy: "user-demo-manager",
      reason: "Purchase exceeded procurement policy threshold.",
      controlPolicyId: "policy-procurement-001",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1),
      history: [
        {
          id: "review-purchase-001-history-001",
          action: "submitted",
          actorUserId: "user-demo-manager",
          actorRole: "manager",
          note: "Submitted for review after threshold alert.",
          createdAt: timestamp(-1)
        }
      ]
    },
    {
      id: "review-expense-001",
      workspaceId: "workspace-demo",
      entityType: "expense",
      entityId: "expense-003",
      module: "finance",
      title: "Fuel spend returned for correction",
      description: "Supporting comment is missing for the unusual spend record.",
      status: "returned",
      branchId: "branch-main",
      departmentId: "dept-finance",
      amount: 620,
      requestedBy: "user-demo-admin",
      reviewerId: "user-demo-owner",
      reason: "Large expense policy requires supporting explanation.",
      controlPolicyId: "policy-finance-001",
      createdAt: timestamp(-3),
      updatedAt: timestamp(-2),
      history: [
        {
          id: "review-expense-001-history-001",
          action: "submitted",
          actorUserId: "user-demo-admin",
          actorRole: "admin",
          note: "Submitted after unusual spend flag.",
          createdAt: timestamp(-3)
        },
        {
          id: "review-expense-001-history-002",
          action: "returned",
          actorUserId: "user-demo-owner",
          actorRole: "owner",
          note: "Please add route and trip justification before approval.",
          createdAt: timestamp(-2)
        }
      ]
    },
    {
      id: "review-settings-001",
      workspaceId: "workspace-demo",
      entityType: "settings",
      entityId: "workspace-demo",
      module: "settings",
      title: "Payment reminder threshold changed",
      description: "Settings change recorded with approval trail.",
      status: "approved",
      departmentId: "dept-leadership",
      requestedBy: "user-demo-admin",
      reviewerId: "user-demo-owner",
      reason: "Reminder cadence changed before month-end collections.",
      createdAt: timestamp(-6),
      updatedAt: timestamp(-5),
      history: [
        {
          id: "review-settings-001-history-001",
          action: "submitted",
          actorUserId: "user-demo-admin",
          actorRole: "admin",
          createdAt: timestamp(-6)
        },
        {
          id: "review-settings-001-history-002",
          action: "approved",
          actorUserId: "user-demo-owner",
          actorRole: "owner",
          note: "Approved for collections drive.",
          createdAt: timestamp(-5)
        }
      ]
    }
  ],
  controlPolicies: [
    {
      id: "policy-finance-001",
      workspaceId: "workspace-demo",
      module: "finance",
      eventKey: "expense_over_threshold",
      label: "Large expense review",
      thresholdAmount: 500,
      requiresReview: true,
      autoEscalate: true,
      notes: "Capture explanation before approval.",
      updatedBy: "user-demo-owner",
      createdAt: timestamp(-30),
      updatedAt: timestamp(-4)
    },
    {
      id: "policy-procurement-001",
      workspaceId: "workspace-demo",
      module: "purchases",
      eventKey: "purchase_over_threshold",
      label: "Procurement threshold control",
      thresholdAmount: 750,
      branchId: "branch-byo",
      departmentId: "dept-procurement",
      requiresReview: true,
      autoEscalate: true,
      notes: "Bulawayo branch orders above threshold require maker-checker review.",
      updatedBy: "user-demo-owner",
      createdAt: timestamp(-28),
      updatedAt: timestamp(-3)
    },
    {
      id: "policy-settings-001",
      workspaceId: "workspace-demo",
      module: "settings",
      eventKey: "critical_setting_change",
      label: "Critical settings control",
      requiresReview: true,
      autoEscalate: false,
      notes: "Require approval for sensitive settings changes.",
      updatedBy: "user-demo-owner",
      createdAt: timestamp(-40),
      updatedAt: timestamp(-6)
    }
  ],
  branchControlSettings: [
    {
      id: "branch-control-main",
      workspaceId: "workspace-demo",
      branchId: "branch-main",
      approvalThreshold: 900,
      spendLimit: 6000,
      riskLevel: "stable",
      notes: "Main branch controls are within tolerance.",
      updatedBy: "user-demo-owner",
      createdAt: timestamp(-60),
      updatedAt: timestamp(-4)
    },
    {
      id: "branch-control-byo",
      workspaceId: "workspace-demo",
      branchId: "branch-byo",
      approvalThreshold: 700,
      spendLimit: 4500,
      riskLevel: "risk",
      notes: "Bulawayo needs tighter procurement review this month.",
      updatedBy: "user-demo-owner",
      createdAt: timestamp(-60),
      updatedAt: timestamp(-2)
    }
  ],
  exportJobs: [
    {
      id: "export-001",
      workspaceId: "workspace-demo",
      module: "reports",
      title: "Branch comparison report",
      format: "csv",
      status: "ready",
      filtersSummary: "Last 30 days · all branches",
      createdBy: "user-demo-admin",
      downloadLabel: "branch-comparison-mar.csv",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-2)
    },
    {
      id: "export-002",
      workspaceId: "workspace-demo",
      module: "finance",
      title: "Collections and reconciliation pack",
      format: "pdf",
      status: "queued",
      filtersSummary: "Finance dashboard · monthly board pack",
      createdBy: "user-demo-owner",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1)
    }
  ],
  enterpriseNotifications: [
    {
      id: "enterprise-note-001",
      workspaceId: "workspace-demo",
      type: "approval_pending",
      title: "Procurement approval pending",
      message: "Bulawayo cable purchase is still waiting for maker-checker review.",
      href: "/app/reviews",
      visibleToRoles: ["owner", "admin", "manager"],
      branchId: "branch-byo",
      departmentId: "dept-procurement",
      isRead: false,
      createdAt: timestamp(-1)
    },
    {
      id: "enterprise-note-002",
      workspaceId: "workspace-demo",
      type: "branch_risk_alert",
      title: "Branch risk alert",
      message: "Bulawayo branch is running above its preferred procurement risk level.",
      href: "/app/branch-comparison",
      visibleToRoles: ["owner", "admin", "manager"],
      branchId: "branch-byo",
      isRead: false,
      createdAt: timestamp(-2)
    },
    {
      id: "enterprise-note-003",
      workspaceId: "workspace-demo",
      type: "permission_changed",
      title: "Permissions changed",
      message: "Finance approval rights were updated for manager-level access.",
      href: "/app/permissions",
      visibleToRoles: ["owner", "admin"],
      isRead: true,
      createdAt: timestamp(-4)
    },
    {
      id: "enterprise-note-004",
      workspaceId: "workspace-demo",
      type: "procurement_issue_alert",
      title: "Procurement issue alert",
      message: "A returned expense review is blocking spend confirmation until notes are corrected.",
      href: "/app/procurement",
      visibleToRoles: ["owner", "admin", "manager"],
      departmentId: "dept-finance",
      isRead: false,
      createdAt: timestamp(-2)
    }
  ],
  enterpriseAuditLogs: seededAuditLogs
};

export function upgradeFlowV6State(input?: Partial<FlowV6State> | null): FlowV6State {
  return {
    permissionProfiles: input?.permissionProfiles || seedFlowV6State.permissionProfiles,
    departments: input?.departments || seedFlowV6State.departments,
    departmentMemberships:
      input?.departmentMemberships || seedFlowV6State.departmentMemberships,
    reviews: input?.reviews || seedFlowV6State.reviews,
    controlPolicies: input?.controlPolicies || seedFlowV6State.controlPolicies,
    branchControlSettings:
      input?.branchControlSettings || seedFlowV6State.branchControlSettings,
    exportJobs: input?.exportJobs || seedFlowV6State.exportJobs,
    enterpriseNotifications:
      input?.enterpriseNotifications || seedFlowV6State.enterpriseNotifications,
    enterpriseAuditLogs: input?.enterpriseAuditLogs || seedFlowV6State.enterpriseAuditLogs
  };
}
