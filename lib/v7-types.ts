import { AuditLog, UserRole } from "@/lib/types";

export type AssistantIntent =
  | "overdue_invoices"
  | "supplier_payables"
  | "branch_performance"
  | "pending_approvals"
  | "cash_pressure"
  | "recent_activity"
  | "recommendations"
  | "summary"
  | "unknown";

export type AutomationTemplateKey =
  | "overdue_invoice_follow_up"
  | "approval_delay_escalation"
  | "supplier_payment_reminder"
  | "branch_performance_warning"
  | "finance_anomaly_alert"
  | "monthly_executive_summary"
  | "weekly_operations_digest"
  | "low_stock_alert"
  | "document_missing_reminder";

export type AutomationTriggerType =
  | "invoice_due_soon"
  | "invoice_overdue"
  | "supplier_payable_due"
  | "approval_delay"
  | "branch_performance_drop"
  | "unusual_spend"
  | "low_stock"
  | "reconciliation_mismatch"
  | "document_missing"
  | "scheduled_digest";

export type AutomationActionType =
  | "notify"
  | "create_task"
  | "draft_message"
  | "record_summary";

export type AutomationRunStatus = "triggered" | "completed" | "skipped";

export type AnomalyType =
  | "expense_spike"
  | "collections_drop"
  | "overdue_growth"
  | "approval_delay"
  | "branch_underperformance"
  | "supplier_rejection_pattern"
  | "reconciliation_mismatch"
  | "payment_behavior_change";

export type AnomalyStatus = "open" | "reviewed" | "dismissed";
export type InsightTone = "success" | "warning" | "danger" | "muted";
export type RecommendationCategory =
  | "collections"
  | "payables"
  | "branch"
  | "approvals"
  | "procurement"
  | "stock"
  | "finance";
export type RecommendationPriority = "high" | "medium" | "low";
export type TaskPriority = "critical" | "high" | "normal" | "low";
export type TaskStatus = "open" | "done" | "snoozed" | "dismissed";
export type DraftKind =
  | "overdue_payment_reminder"
  | "supplier_follow_up"
  | "approval_comment"
  | "invoice_cover_note"
  | "manager_summary";
export type PredictiveInsightType =
  | "cash_pressure"
  | "overdue_growth"
  | "approval_backlog"
  | "branch_attention"
  | "collection_risk"
  | "supplier_dependency";
export type SummaryScope =
  | "dashboard"
  | "finance"
  | "approvals"
  | "receivables"
  | "payables"
  | "procurement"
  | "branch"
  | "executive";
export type IntelligenceNotificationType =
  | "assistant_follow_up"
  | "automation_triggered"
  | "anomaly_detected"
  | "recommendation_ready"
  | "task_assigned"
  | "predictive_warning"
  | "summary_ready"
  | "draft_generated";
export type IntelligenceSensitivity = "conservative" | "balanced" | "aggressive";

export interface AssistantSource {
  label: string;
  href?: string;
  entityType?: string;
  entityId?: string;
}

export interface AssistantInteraction {
  id: string;
  question: string;
  intent: AssistantIntent;
  answer: string;
  hardFacts: string[];
  derivedInsights: string[];
  followUps: string[];
  sources: AssistantSource[];
  askedAt: string;
}

export interface AssistantSession {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  lastIntent: AssistantIntent;
  createdAt: string;
  updatedAt: string;
  interactions: AssistantInteraction[];
}

export interface AutomationTemplateDefinition {
  key: AutomationTemplateKey;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  defaultConditionSummary: string;
  defaultActionSummary: string;
}

export const automationTemplates: AutomationTemplateDefinition[] = [
  {
    key: "overdue_invoice_follow_up",
    name: "Overdue invoice follow-up",
    description: "Escalate and remind when customer invoices move past due date.",
    triggerType: "invoice_overdue",
    defaultConditionSummary: "Trigger when invoice outstanding is still above zero after due date.",
    defaultActionSummary: "Create a follow-up task and notify finance or owner roles."
  },
  {
    key: "approval_delay_escalation",
    name: "Approval delay escalation",
    description: "Escalate approvals or maker-checker reviews that remain pending too long.",
    triggerType: "approval_delay",
    defaultConditionSummary: "Trigger when a pending approval or review is older than the configured threshold.",
    defaultActionSummary: "Notify managers and create a review task."
  },
  {
    key: "supplier_payment_reminder",
    name: "Supplier payment reminder",
    description: "Warn before key supplier obligations become overdue.",
    triggerType: "supplier_payable_due",
    defaultConditionSummary: "Trigger when supplier payable is due within the next reminder window.",
    defaultActionSummary: "Notify finance and add a payable follow-up task."
  },
  {
    key: "branch_performance_warning",
    name: "Branch performance warning",
    description: "Surface branch performance drops and branch risk changes.",
    triggerType: "branch_performance_drop",
    defaultConditionSummary: "Trigger when branch risk becomes watch or risk.",
    defaultActionSummary: "Notify executive roles and create a branch review task."
  },
  {
    key: "finance_anomaly_alert",
    name: "Finance anomaly alert",
    description: "React to expense spikes, collection drops, and reconciliation problems.",
    triggerType: "unusual_spend",
    defaultConditionSummary: "Trigger when unusual spend or reconciliation mismatch is detected.",
    defaultActionSummary: "Notify finance roles and capture an anomaly task."
  },
  {
    key: "monthly_executive_summary",
    name: "Monthly executive summary",
    description: "Produce a concise executive digest for owners and admins.",
    triggerType: "scheduled_digest",
    defaultConditionSummary: "Run on a scheduled cadence for executive users.",
    defaultActionSummary: "Create a digest summary and notify executive roles."
  },
  {
    key: "weekly_operations_digest",
    name: "Weekly operations digest",
    description: "Summarize overdue items, approvals, stock issues, and branch attention points.",
    triggerType: "scheduled_digest",
    defaultConditionSummary: "Run once per week for operations users.",
    defaultActionSummary: "Generate a weekly digest and action checklist."
  },
  {
    key: "low_stock_alert",
    name: "Low-stock alert",
    description: "Notify teams when stocked items fall below configured thresholds.",
    triggerType: "low_stock",
    defaultConditionSummary: "Trigger when any tracked item reaches low-stock or out-of-stock status.",
    defaultActionSummary: "Notify branch and procurement users."
  },
  {
    key: "document_missing_reminder",
    name: "Document missing reminder",
    description: "Flag approvals or finance flows that are missing required supporting documents.",
    triggerType: "document_missing",
    defaultConditionSummary: "Trigger when a sensitive flow lacks linked supporting material.",
    defaultActionSummary: "Create an action item and notify the assigned reviewer."
  }
];

export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  templateKey?: AutomationTemplateKey;
  description: string;
  triggerType: AutomationTriggerType;
  conditionSummary: string;
  actionSummary: string;
  isEnabled: boolean;
  branchId?: string;
  departmentId?: string;
  thresholdValue?: number;
  targetRoles?: UserRole[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

export interface AutomationRun {
  id: string;
  workspaceId: string;
  ruleId: string;
  triggerType: AutomationTriggerType;
  status: AutomationRunStatus;
  title: string;
  summary: string;
  explanation: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  outputTaskId?: string;
  outputNotificationId?: string;
  createdAt: string;
}

export interface AnomalyEvent {
  id: string;
  workspaceId: string;
  type: AnomalyType;
  title: string;
  summary: string;
  explanation: string;
  tone: InsightTone;
  status: AnomalyStatus;
  branchId?: string;
  departmentId?: string;
  metricLabel?: string;
  metricValue?: string;
  href?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  detectedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Recommendation {
  id: string;
  workspaceId: string;
  category: RecommendationCategory;
  title: string;
  summary: string;
  explanation: string;
  priority: RecommendationPriority;
  href?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  visibleToRoles?: UserRole[];
  createdAt: string;
}

export interface ActionTask {
  id: string;
  workspaceId: string;
  sourceType: "automation" | "anomaly" | "recommendation" | "assistant";
  sourceId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedRole?: UserRole;
  assignedUserId?: string;
  branchId?: string;
  dueAt?: string;
  href?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  snoozedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantDraft {
  id: string;
  workspaceId: string;
  kind: DraftKind;
  title: string;
  content: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PredictiveInsight {
  id: string;
  workspaceId: string;
  type: PredictiveInsightType;
  title: string;
  summary: string;
  explanation: string;
  tone: InsightTone;
  horizonLabel: string;
  visibleToRoles?: UserRole[];
  createdAt: string;
}

export interface IntelligentSummary {
  id: string;
  workspaceId: string;
  scope: SummaryScope;
  title: string;
  summary: string;
  highlights: string[];
  visibleToRoles?: UserRole[];
  generatedAt: string;
}

export interface IntelligenceNotification {
  id: string;
  workspaceId: string;
  type: IntelligenceNotificationType;
  title: string;
  message: string;
  href?: string;
  visibleToRoles?: UserRole[];
  isRead: boolean;
  createdAt: string;
}

export interface IntelligenceSettings {
  workspaceId: string;
  assistantEnabled: boolean;
  automationEnabled: boolean;
  predictiveInsightsEnabled: boolean;
  anomalySensitivity: IntelligenceSensitivity;
  updatedBy: string;
  updatedAt: string;
}

export interface FlowV7State {
  assistantSessions: AssistantSession[];
  automationRules: AutomationRule[];
  automationRuns: AutomationRun[];
  anomalies: AnomalyEvent[];
  actionTasks: ActionTask[];
  drafts: AssistantDraft[];
  intelligenceNotifications: IntelligenceNotification[];
  intelligenceAuditLogs: AuditLog[];
  intelligenceSettings: IntelligenceSettings[];
}
