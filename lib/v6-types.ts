import { AuditLog, UserRole } from "@/lib/types";

export type EnterpriseModuleKey =
  | "dashboard"
  | "intelligence"
  | "finance"
  | "purchases"
  | "reports"
  | "approvals"
  | "branches"
  | "team"
  | "network"
  | "settings"
  | "audit"
  | "exports"
  | "admin";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "manage_sensitive";

export type ScopeAccess = "all" | "assigned_only";
export type DepartmentStatus = "active" | "archived";
export type DepartmentMemberRole = "lead" | "member";
export type ReviewEntityType =
  | "expense"
  | "purchase"
  | "invoice"
  | "payment"
  | "stock_adjustment"
  | "settings";
export type ReviewStatus = "pending_review" | "approved" | "rejected" | "returned";
export type ReviewHistoryAction = "submitted" | "approved" | "rejected" | "returned";
export type BranchRiskLevel = "stable" | "watch" | "risk";
export type ExportJobFormat = "csv" | "pdf" | "json";
export type ExportJobStatus = "queued" | "ready" | "failed";
export type EnterpriseNotificationType =
  | "approval_pending"
  | "approval_rejected"
  | "branch_risk_alert"
  | "unusual_spend_alert"
  | "major_reconciliation_mismatch"
  | "operational_kpi_warning"
  | "procurement_issue_alert"
  | "branch_performance_alert"
  | "permission_changed"
  | "system_admin_alert";

export interface EnterpriseModuleDefinition {
  key: EnterpriseModuleKey;
  label: string;
  description: string;
}

export const enterpriseModules: EnterpriseModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboards",
    description: "Executive, branch, and operational dashboard visibility."
  },
  {
    key: "intelligence",
    label: "Intelligence",
    description: "Assistant, automation, anomaly detection, and predictive guidance."
  },
  {
    key: "finance",
    label: "Finance",
    description: "Collections, reconciliation, readiness, and finance-sensitive actions."
  },
  {
    key: "purchases",
    label: "Procurement",
    description: "Purchases, procurement controls, and supplier spend workflows."
  },
  {
    key: "reports",
    label: "Reports",
    description: "Analytics, exports, and executive reporting."
  },
  {
    key: "approvals",
    label: "Reviews",
    description: "Approvals, maker-checker, and queue oversight."
  },
  {
    key: "branches",
    label: "Branches",
    description: "Branch dashboards, comparisons, and branch settings."
  },
  {
    key: "team",
    label: "Teams",
    description: "Departments, assignments, and team administration."
  },
  {
    key: "network",
    label: "Network",
    description: "Connected business workflows and relationship activity."
  },
  {
    key: "settings",
    label: "Settings",
    description: "Sensitive configuration and workspace control surfaces."
  },
  {
    key: "audit",
    label: "Audit",
    description: "Audit logs, enterprise oversight, and traceability."
  },
  {
    key: "exports",
    label: "Exports",
    description: "Export jobs, downloadable reports, and integration readiness."
  },
  {
    key: "admin",
    label: "Admin",
    description: "Business admin console and governance overview."
  }
];

export interface PermissionProfile {
  id: string;
  workspaceId: string;
  role: UserRole;
  module: EnterpriseModuleKey;
  actions: PermissionAction[];
  branchScope: ScopeAccess;
  departmentScope: ScopeAccess;
  canViewSensitive: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  branchId?: string;
  managerUserId?: string;
  description?: string;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentMembership {
  id: string;
  workspaceId: string;
  departmentId: string;
  profileId?: string;
  userId?: string;
  title?: string;
  role: DepartmentMemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewHistoryEntry {
  id: string;
  action: ReviewHistoryAction;
  actorUserId: string;
  actorRole: UserRole;
  note?: string;
  createdAt: string;
}

export interface EnterpriseReview {
  id: string;
  workspaceId: string;
  entityType: ReviewEntityType;
  entityId: string;
  module: EnterpriseModuleKey;
  title: string;
  description: string;
  status: ReviewStatus;
  branchId?: string;
  departmentId?: string;
  amount?: number;
  requestedBy: string;
  reviewerId?: string;
  reason?: string;
  controlPolicyId?: string;
  createdAt: string;
  updatedAt: string;
  history: ReviewHistoryEntry[];
}

export interface ControlPolicy {
  id: string;
  workspaceId: string;
  module: EnterpriseModuleKey;
  eventKey: string;
  label: string;
  thresholdAmount?: number;
  branchId?: string;
  departmentId?: string;
  requiresReview: boolean;
  autoEscalate: boolean;
  notes?: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchControlSetting {
  id: string;
  workspaceId: string;
  branchId: string;
  approvalThreshold: number;
  spendLimit: number;
  riskLevel: BranchRiskLevel;
  notes?: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportJob {
  id: string;
  workspaceId: string;
  module: EnterpriseModuleKey;
  title: string;
  format: ExportJobFormat;
  status: ExportJobStatus;
  filtersSummary?: string;
  createdBy: string;
  downloadLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseNotification {
  id: string;
  workspaceId: string;
  type: EnterpriseNotificationType;
  title: string;
  message: string;
  href?: string;
  visibleToRoles?: UserRole[];
  branchId?: string;
  departmentId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FlowV6State {
  permissionProfiles: PermissionProfile[];
  departments: Department[];
  departmentMemberships: DepartmentMembership[];
  reviews: EnterpriseReview[];
  controlPolicies: ControlPolicy[];
  branchControlSettings: BranchControlSetting[];
  exportJobs: ExportJob[];
  enterpriseNotifications: EnterpriseNotification[];
  enterpriseAuditLogs: AuditLog[];
}
