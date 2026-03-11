import { AuditLog } from "@/lib/types";
import { FlowV7State, automationTemplates } from "@/lib/v7-types";

function timestamp(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

export function createEmptyFlowV7State(): FlowV7State {
  return {
    assistantSessions: [],
    automationRules: [],
    automationRuns: [],
    anomalies: [],
    actionTasks: [],
    drafts: [],
    intelligenceNotifications: [],
    intelligenceAuditLogs: [],
    intelligenceSettings: []
  };
}

const seededAuditLogs: AuditLog[] = [
  {
    id: "audit-v7-001",
    workspaceId: "workspace-demo",
    entityType: "automation_rule",
    entityId: "automation-overdue-follow-up",
    action: "created",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Automation rule enabled",
    summary: "Overdue invoice follow-up automation was enabled for finance monitoring.",
    metadata: {
      trigger: "invoice_overdue",
      action: "notify+task"
    },
    createdAt: timestamp(-4)
  },
  {
    id: "audit-v7-002",
    workspaceId: "workspace-demo",
    entityType: "assistant_session",
    entityId: "assistant-session-owner",
    action: "asked",
    actorUserId: "user-demo-owner",
    actorRole: "owner",
    title: "Assistant business query asked",
    summary: "Owner asked for a seven-day business summary.",
    metadata: {
      intent: "recent_activity"
    },
    createdAt: timestamp(-2)
  },
  {
    id: "audit-v7-003",
    workspaceId: "workspace-demo",
    entityType: "action_task",
    entityId: "task-overdue-citron",
    action: "created",
    actorUserId: "user-demo-admin",
    actorRole: "admin",
    title: "Action task created",
    summary: "A collections follow-up task was created from an automation run.",
    metadata: {
      source: "automation",
      priority: "high"
    },
    createdAt: timestamp(-1)
  }
];

export const seedFlowV7State: FlowV7State = {
  assistantSessions: [
    {
      id: "assistant-session-owner",
      workspaceId: "workspace-demo",
      userId: "user-demo-owner",
      title: "Seven day summary",
      lastIntent: "recent_activity",
      createdAt: timestamp(-2),
      updatedAt: timestamp(-1),
      interactions: [
        {
          id: "assistant-interaction-owner-001",
          question: "Summarize the last 7 days of business activity",
          intent: "recent_activity",
          answer:
            "Collections, approvals, and supplier activity were all active in the last 7 days, with finance and procurement still needing follow-through.",
          hardFacts: [
            "Payment collection activity increased this week",
            "A procurement review is still pending",
            "Network order activity stayed active"
          ],
          derivedInsights: [
            "The business is active, but approvals and receivable follow-up are still slowing decisions."
          ],
          followUps: [
            "What approvals are still pending?",
            "What is hurting cash flow right now?"
          ],
          sources: [
            { label: "Dashboard", href: "/app/dashboard" },
            { label: "Control center", href: "/app/control-center" }
          ],
          askedAt: timestamp(-2)
        }
      ]
    },
    {
      id: "assistant-session-finance",
      workspaceId: "workspace-demo",
      userId: "user-demo-admin",
      title: "Receivables focus",
      lastIntent: "overdue_invoices",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1),
      interactions: [
        {
          id: "assistant-interaction-finance-001",
          question: "What invoices are overdue right now?",
          intent: "overdue_invoices",
          answer:
            "There are overdue invoices that should be followed up immediately, with the highest balance sitting on one customer relationship.",
          hardFacts: [
            "Citron Electrical is carrying a split-payment balance",
            "Multiple invoices are now past due"
          ],
          derivedInsights: [
            "Collections effort should start with the highest overdue customer balance."
          ],
          followUps: ["Draft an overdue reminder", "Show open collection tasks"],
          sources: [{ label: "Receivables", href: "/app/receivables" }],
          askedAt: timestamp(-1)
        }
      ]
    }
  ],
  automationRules: [
    {
      id: "automation-overdue-follow-up",
      workspaceId: "workspace-demo",
      name: "Overdue collections follow-up",
      templateKey: "overdue_invoice_follow_up",
      description: "Escalate overdue invoices with notification and task creation.",
      triggerType: "invoice_overdue",
      conditionSummary: automationTemplates[0].defaultConditionSummary,
      actionSummary: automationTemplates[0].defaultActionSummary,
      isEnabled: true,
      thresholdValue: 7,
      targetRoles: ["owner", "admin", "manager"],
      createdBy: "user-demo-owner",
      createdAt: timestamp(-12),
      updatedAt: timestamp(-3),
      lastRunAt: timestamp(-1)
    },
    {
      id: "automation-approval-delay",
      workspaceId: "workspace-demo",
      name: "Approval delay escalation",
      templateKey: "approval_delay_escalation",
      description: "Warn when approvals or maker-checker reviews stay pending too long.",
      triggerType: "approval_delay",
      conditionSummary: automationTemplates[1].defaultConditionSummary,
      actionSummary: automationTemplates[1].defaultActionSummary,
      isEnabled: true,
      thresholdValue: 3,
      targetRoles: ["owner", "admin", "manager"],
      createdBy: "user-demo-owner",
      createdAt: timestamp(-10),
      updatedAt: timestamp(-2),
      lastRunAt: timestamp(-1)
    },
    {
      id: "automation-low-stock",
      workspaceId: "workspace-demo",
      name: "Low-stock reminder",
      templateKey: "low_stock_alert",
      description: "Raise item warnings when tracked stock falls below threshold.",
      triggerType: "low_stock",
      conditionSummary: automationTemplates[7].defaultConditionSummary,
      actionSummary: automationTemplates[7].defaultActionSummary,
      isEnabled: true,
      targetRoles: ["owner", "admin", "manager", "staff"],
      createdBy: "user-demo-admin",
      createdAt: timestamp(-8),
      updatedAt: timestamp(-2),
      lastRunAt: timestamp(-1)
    },
    {
      id: "automation-weekly-digest",
      workspaceId: "workspace-demo",
      name: "Weekly operations digest",
      templateKey: "weekly_operations_digest",
      description: "Create a weekly summary with attention items for managers.",
      triggerType: "scheduled_digest",
      conditionSummary: automationTemplates[6].defaultConditionSummary,
      actionSummary: automationTemplates[6].defaultActionSummary,
      isEnabled: true,
      targetRoles: ["owner", "admin", "manager"],
      createdBy: "user-demo-owner",
      createdAt: timestamp(-14),
      updatedAt: timestamp(-1),
      lastRunAt: timestamp(-1)
    }
  ],
  automationRuns: [
    {
      id: "automation-run-overdue-001",
      workspaceId: "workspace-demo",
      ruleId: "automation-overdue-follow-up",
      triggerType: "invoice_overdue",
      status: "completed",
      title: "Overdue collections escalation executed",
      summary: "A collections task and notification were created for overdue invoices.",
      explanation: "The rule ran because overdue invoices still had outstanding balances.",
      relatedEntityType: "invoice",
      relatedEntityId: "invoice-004",
      outputTaskId: "task-overdue-citron",
      outputNotificationId: "intelligence-note-collections",
      createdAt: timestamp(-1)
    },
    {
      id: "automation-run-approval-001",
      workspaceId: "workspace-demo",
      ruleId: "automation-approval-delay",
      triggerType: "approval_delay",
      status: "completed",
      title: "Approval delay escalation executed",
      summary: "A manager review task was created for a delayed procurement decision.",
      explanation: "Pending review age passed the configured threshold.",
      relatedEntityType: "review_request",
      relatedEntityId: "review-purchase-001",
      outputTaskId: "task-review-procurement",
      outputNotificationId: "intelligence-note-approval",
      createdAt: timestamp(-1)
    },
    {
      id: "automation-run-digest-001",
      workspaceId: "workspace-demo",
      ruleId: "automation-weekly-digest",
      triggerType: "scheduled_digest",
      status: "completed",
      title: "Weekly digest generated",
      summary: "A weekly operations digest is ready for review.",
      explanation: "The scheduled digest rule was run for the current week.",
      outputNotificationId: "intelligence-note-digest",
      createdAt: timestamp(-1)
    }
  ],
  anomalies: [
    {
      id: "anomaly-collections-drop",
      workspaceId: "workspace-demo",
      type: "collections_drop",
      title: "Collections have slowed materially",
      summary: "Marked as reviewed during the finance stand-up.",
      explanation: "The event is retained to preserve review state in demo mode.",
      tone: "warning",
      status: "reviewed",
      metricLabel: "Collections",
      metricValue: "Reviewed",
      href: "/app/finance",
      detectedAt: timestamp(-1),
      reviewedBy: "user-demo-admin",
      reviewedAt: timestamp(-1)
    }
  ],
  actionTasks: [
    {
      id: "task-overdue-citron",
      workspaceId: "workspace-demo",
      sourceType: "automation",
      sourceId: "automation-run-overdue-001",
      title: "Call Citron Electrical about overdue balance",
      description: "Follow up the split-payment invoice and confirm settlement date.",
      priority: "high",
      status: "open",
      assignedRole: "admin",
      dueAt: timestamp(1),
      href: "/app/receivables",
      relatedEntityType: "invoice",
      relatedEntityId: "invoice-004",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1)
    },
    {
      id: "task-review-procurement",
      workspaceId: "workspace-demo",
      sourceType: "automation",
      sourceId: "automation-run-approval-001",
      title: "Review Bulawayo procurement approval delay",
      description: "Resolve the maker-checker queue for the high-value supplier order.",
      priority: "critical",
      status: "open",
      assignedRole: "manager",
      dueAt: timestamp(0),
      href: "/app/reviews",
      relatedEntityType: "review_request",
      relatedEntityId: "review-purchase-001",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1)
    },
    {
      id: "task-weekly-digest",
      workspaceId: "workspace-demo",
      sourceType: "automation",
      sourceId: "automation-run-digest-001",
      title: "Review weekly operations digest",
      description: "Use the digest to decide collections, approvals, and branch priorities.",
      priority: "normal",
      status: "snoozed",
      assignedRole: "owner",
      dueAt: timestamp(2),
      snoozedUntil: timestamp(1),
      href: "/app/assistant",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1)
    }
  ],
  drafts: [
    {
      id: "draft-overdue-001",
      workspaceId: "workspace-demo",
      kind: "overdue_payment_reminder",
      title: "Overdue reminder for Citron Electrical",
      content:
        "Hi Citron Electrical, this is a reminder that invoice INV-2026-004 is still outstanding. Please confirm the expected payment date or share any issue blocking settlement.",
      relatedEntityType: "invoice",
      relatedEntityId: "invoice-004",
      createdBy: "user-demo-admin",
      createdAt: timestamp(-1),
      updatedAt: timestamp(-1)
    }
  ],
  intelligenceNotifications: [
    {
      id: "intelligence-note-collections",
      workspaceId: "workspace-demo",
      type: "automation_triggered",
      title: "Collections automation triggered",
      message: "Overdue invoice follow-up created a finance task for receivables action.",
      href: "/app/actions",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: timestamp(-1)
    },
    {
      id: "intelligence-note-approval",
      workspaceId: "workspace-demo",
      type: "anomaly_detected",
      title: "Approval delay needs review",
      message: "A procurement review has stayed pending beyond the attention threshold.",
      href: "/app/anomalies",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: false,
      createdAt: timestamp(-1)
    },
    {
      id: "intelligence-note-digest",
      workspaceId: "workspace-demo",
      type: "summary_ready",
      title: "Weekly operations digest ready",
      message: "A fresh weekly digest was generated for executive review.",
      href: "/app/assistant",
      visibleToRoles: ["owner", "admin", "manager"],
      isRead: true,
      createdAt: timestamp(-1)
    }
  ],
  intelligenceAuditLogs: seededAuditLogs,
  intelligenceSettings: [
    {
      workspaceId: "workspace-demo",
      assistantEnabled: true,
      automationEnabled: true,
      predictiveInsightsEnabled: true,
      anomalySensitivity: "balanced",
      updatedBy: "user-demo-owner",
      updatedAt: timestamp(-1)
    }
  ]
};

export function upgradeFlowV7State(state?: Partial<FlowV7State> | null): FlowV7State {
  return {
    ...createEmptyFlowV7State(),
    ...state,
    assistantSessions: state?.assistantSessions || [],
    automationRules: state?.automationRules || [],
    automationRuns: state?.automationRuns || [],
    anomalies: state?.anomalies || [],
    actionTasks: state?.actionTasks || [],
    drafts: state?.drafts || [],
    intelligenceNotifications: state?.intelligenceNotifications || [],
    intelligenceAuditLogs: state?.intelligenceAuditLogs || [],
    intelligenceSettings: state?.intelligenceSettings || []
  };
}
