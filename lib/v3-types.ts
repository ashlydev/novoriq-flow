import { UserRole } from "@/lib/types";

export type ManagedRecordType =
  | "quote"
  | "invoice"
  | "payment"
  | "receipt"
  | "expense"
  | "purchase"
  | "customer"
  | "supplier";

export type BranchStatus = "active" | "archived";
export type TeamProfileStatus = "active" | "inactive" | "invited";
export type ApprovalEntityType = "expense" | "purchase" | "stock_adjustment";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ProjectStatus = "active" | "completed" | "archived";
export type DocumentCategory =
  | "contract"
  | "customer"
  | "supplier"
  | "project"
  | "finance"
  | "compliance"
  | "identity"
  | "operations"
  | "other";
export type TemplateStyle = "classic" | "modern" | "compact";
export type OperationalAlertType =
  | "approval_needed"
  | "approval_approved"
  | "approval_rejected"
  | "low_stock"
  | "out_of_stock"
  | "cash_flow_warning"
  | "branch_attention"
  | "project_margin"
  | "document_reminder";
export type StockAdjustmentDirection = "increase" | "decrease";

export interface Branch {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerName?: string;
  isPrimary: boolean;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamInvite {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  status: "pending" | "accepted" | "revoked";
  invitedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberProfile {
  id: string;
  workspaceId: string;
  workspaceMemberId?: string;
  userId?: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  status: TeamProfileStatus;
  notes?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  action: "requested" | "approved" | "rejected";
  actorUserId: string;
  actorRole: UserRole;
  note?: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  workspaceId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  branchId?: string;
  title: string;
  description: string;
  status: ApprovalStatus;
  requestedBy: string;
  approverId?: string;
  currentNote?: string;
  createdAt: string;
  updatedAt: string;
  history: ApprovalHistoryEntry[];
}

export interface StockProfile {
  id: string;
  workspaceId: string;
  itemId: string;
  isTracked: boolean;
  openingQuantity: number;
  reorderLevel: number;
  preferredBranchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  workspaceId: string;
  itemId: string;
  branchId?: string;
  direction: StockAdjustmentDirection;
  quantity: number;
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ProjectJob {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  customerId?: string;
  branchId?: string;
  status: ProjectStatus;
  notes?: string;
  budgetAmount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordMeta {
  id: string;
  workspaceId: string;
  entityType: ManagedRecordType;
  entityId: string;
  branchId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultDocument {
  id: string;
  workspaceId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  linkedEntityType?: ManagedRecordType;
  linkedEntityId?: string;
  branchId?: string;
  projectId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSettings {
  workspaceId: string;
  invoiceStyle: TemplateStyle;
  quoteStyle: TemplateStyle;
  receiptStyle: TemplateStyle;
  footerNote?: string;
  showLogo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalAlert {
  id: string;
  workspaceId: string;
  type: OperationalAlertType;
  title: string;
  message: string;
  href?: string;
  visibleToRoles?: UserRole[];
  branchId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface FlowV3State {
  branches: Branch[];
  teamInvites: TeamInvite[];
  teamProfiles: TeamMemberProfile[];
  approvals: ApprovalRequest[];
  stockProfiles: StockProfile[];
  stockAdjustments: StockAdjustment[];
  projects: ProjectJob[];
  recordMeta: RecordMeta[];
  vaultDocuments: VaultDocument[];
  templateSettings: TemplateSettings[];
  operationalAlerts: OperationalAlert[];
}
