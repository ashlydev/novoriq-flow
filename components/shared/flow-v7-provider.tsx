"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import {
  formatCurrency,
  getInvoiceOutstanding,
  getInvoiceStatus,
  getPurchaseOutstanding
} from "@/lib/calculations";
import { AuditLog, UserRole } from "@/lib/types";
import {
  getActionCenterSummary,
  getAssistantAnswer,
  getDetectedAnomalies,
  getIntelligentSummaries,
  getPredictiveInsights,
  getRecommendations,
  mergeIntelligenceAuditLogs
} from "@/lib/v7-calculations";
import {
  createEmptyFlowV7State,
  seedFlowV7State,
  upgradeFlowV7State
} from "@/lib/v7-seed";
import { loadFlowV7State, saveFlowV7State } from "@/lib/v7-storage";
import {
  ActionTask,
  AssistantDraft,
  AssistantIntent,
  AssistantSession,
  AutomationRule,
  AutomationTemplateKey,
  DraftKind,
  FlowV7State,
  IntelligenceNotification,
  IntelligenceSettings,
  automationTemplates
} from "@/lib/v7-types";

interface AutomationRulePayload {
  name: string;
  templateKey?: AutomationTemplateKey;
  description: string;
  triggerType: AutomationRule["triggerType"];
  conditionSummary: string;
  actionSummary: string;
  isEnabled: boolean;
  branchId?: string;
  departmentId?: string;
  thresholdValue?: number;
  targetRoles?: UserRole[];
}

interface TaskUpdatePayload {
  status: ActionTask["status"];
  snoozedUntil?: string;
}

interface DraftPayload {
  kind: DraftKind;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface IntelligenceSettingsPayload {
  assistantEnabled: boolean;
  automationEnabled: boolean;
  predictiveInsightsEnabled: boolean;
  anomalySensitivity: IntelligenceSettings["anomalySensitivity"];
}

interface FlowV7ContextValue {
  isHydrated: boolean;
  assistantSessions: AssistantSession[];
  automationRules: AutomationRule[];
  automationRuns: FlowV7State["automationRuns"];
  anomalies: FlowV7State["anomalies"];
  recommendations: ReturnType<typeof getRecommendations>;
  actionTasks: ActionTask[];
  openTasks: ActionTask[];
  predictiveInsights: ReturnType<typeof getPredictiveInsights>;
  summaries: ReturnType<typeof getIntelligentSummaries>;
  drafts: AssistantDraft[];
  intelligenceNotifications: IntelligenceNotification[];
  unreadIntelligenceCount: number;
  intelligenceSettings: IntelligenceSettings;
  assistantSuggestedPrompts: string[];
  actionCenterSummary: ReturnType<typeof getActionCenterSummary>;
  intelligenceAuditLogs: AuditLog[];
  getSession: (sessionId: string) => AssistantSession | undefined;
  getDraftsForEntity: (entityType: string, entityId: string) => AssistantDraft[];
  askAssistant: (
    question: string,
    sessionId?: string
  ) => { success: boolean; message: string; sessionId?: string; interactionId?: string };
  saveAutomationRule: (
    payload: AutomationRulePayload,
    ruleId?: string
  ) => { success: boolean; message: string; id?: string };
  runAutomationRule: (ruleId: string) => { success: boolean; message: string; id?: string };
  markAnomalyReviewed: (anomalyId: string) => { success: boolean; message: string };
  dismissAnomaly: (anomalyId: string) => { success: boolean; message: string };
  updateTaskStatus: (
    taskId: string,
    payload: TaskUpdatePayload
  ) => { success: boolean; message: string };
  createTaskFromRecommendation: (
    recommendationId: string
  ) => { success: boolean; message: string; id?: string };
  generateDraft: (
    payload: DraftPayload
  ) => { success: boolean; message: string; id?: string };
  markIntelligenceNotificationRead: (notificationId: string) => void;
  markAllIntelligenceNotificationsRead: () => void;
  updateIntelligenceSettings: (
    payload: IntelligenceSettingsPayload
  ) => { success: boolean; message: string };
  resetV7DemoState: () => void;
}

const FlowV7Context = createContext<FlowV7ContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function truncateTitle(question: string) {
  return question.trim().split(/\s+/).slice(0, 6).join(" ") || "Assistant session";
}

function buildDefaultAutomationRules(workspaceId: string, userId: string): AutomationRule[] {
  const chosen = [
    "overdue_invoice_follow_up",
    "approval_delay_escalation",
    "low_stock_alert",
    "weekly_operations_digest"
  ] as AutomationTemplateKey[];

  return chosen.map((key) => {
    const template = automationTemplates.find((entry) => entry.key === key)!;
    return {
      id: createId("automation-rule"),
      workspaceId,
      name: template.name,
      templateKey: template.key,
      description: template.description,
      triggerType: template.triggerType,
      conditionSummary: template.defaultConditionSummary,
      actionSummary: template.defaultActionSummary,
      isEnabled: true,
      targetRoles: ["owner", "admin", "manager"],
      createdBy: userId,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };
  });
}

function createAuditLog(params: {
  workspaceId: string;
  entityType: AuditLog["entityType"];
  entityId: string;
  action: AuditLog["action"];
  actorUserId: string;
  actorRole: UserRole;
  title: string;
  summary: string;
  metadata?: AuditLog["metadata"];
}): AuditLog {
  return {
    id: createId("audit-v7"),
    workspaceId: params.workspaceId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    title: params.title,
    summary: params.summary,
    metadata: params.metadata,
    createdAt: createTimestamp()
  };
}

export function FlowV7Provider({ children }: { children: React.ReactNode }) {
  const {
    canAccess,
    currentRole,
    currentUser,
    currentWorkspace,
    dashboardMetrics,
    outstandingByCustomer,
    workspaceData
  } = useBusinessOS();
  const {
    approvalCounts,
    approvals,
    branchSummaries,
    branches,
    cashFlowForecast,
    lowStockItems
  } = useFlowV3();
  const { networkSummary, purchaseOrders } = useFlowV4();
  const {
    eligibleInvoices,
    financeSummary,
    financialHealth,
    supplierCreditSummary
  } = useFlowV5();
  const {
    branchComparisons,
    canAccessModule,
    enterpriseAuditLogs,
    executiveSummary,
    procurementSummary,
    reviews
  } = useFlowV6();
  const [state, setState] = useState<FlowV7State>(createEmptyFlowV7State);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadFlowV7State();
    setState(upgradeFlowV7State(loaded || seedFlowV7State));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveFlowV7State(state);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated || !currentWorkspace || !currentUser) {
      return;
    }

    setState((current) => {
      let changed = false;
      let nextState = current;
      const hasSettings = current.intelligenceSettings.some(
        (entry) => entry.workspaceId === currentWorkspace.id
      );
      if (!hasSettings) {
        changed = true;
        nextState = {
          ...nextState,
          intelligenceSettings: [
            {
              workspaceId: currentWorkspace.id,
              assistantEnabled: true,
              automationEnabled: true,
              predictiveInsightsEnabled: true,
              anomalySensitivity: "balanced",
              updatedBy: currentUser.id,
              updatedAt: createTimestamp()
            },
            ...nextState.intelligenceSettings
          ]
        };
      }

      const existingRules = nextState.automationRules.filter(
        (rule) => rule.workspaceId === currentWorkspace.id
      );
      if (!existingRules.length) {
        changed = true;
        nextState = {
          ...nextState,
          automationRules: [
            ...buildDefaultAutomationRules(currentWorkspace.id, currentUser.id),
            ...nextState.automationRules
          ]
        };
      }

      return changed ? nextState : current;
    });
  }, [currentUser, currentWorkspace, isHydrated]);

  function ensureContext() {
    if (!currentWorkspace || !currentUser || !currentRole) {
      return { ok: false as const, message: "Intelligence context is not ready." };
    }

    return {
      ok: true as const,
      workspaceId: currentWorkspace.id,
      userId: currentUser.id,
      role: currentRole
    };
  }

  const assistantSessions = useMemo(
    () =>
      currentWorkspace && currentUser
        ? state.assistantSessions.filter(
            (session) =>
              session.workspaceId === currentWorkspace.id && session.userId === currentUser.id
          )
        : [],
    [currentUser, currentWorkspace, state.assistantSessions]
  );
  const automationRules = useMemo(
    () =>
      currentWorkspace
        ? state.automationRules.filter((rule) => rule.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.automationRules]
  );
  const automationRuns = useMemo(
    () =>
      currentWorkspace
        ? state.automationRuns.filter((run) => run.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.automationRuns]
  );
  const drafts = useMemo(
    () =>
      currentWorkspace
        ? state.drafts.filter((draft) => draft.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.drafts]
  );
  const rawIntelligenceNotifications = useMemo(
    () =>
      currentWorkspace
        ? state.intelligenceNotifications.filter(
            (note) =>
              note.workspaceId === currentWorkspace.id &&
              (!note.visibleToRoles || !currentRole || note.visibleToRoles.includes(currentRole))
          )
        : [],
    [currentRole, currentWorkspace, state.intelligenceNotifications]
  );
  const unreadIntelligenceCount = rawIntelligenceNotifications.filter(
    (note) => !note.isRead
  ).length;
  const intelligenceSettings =
    (currentWorkspace &&
      state.intelligenceSettings.find((entry) => entry.workspaceId === currentWorkspace.id)) || {
      workspaceId: currentWorkspace?.id || "",
      assistantEnabled: true,
      automationEnabled: true,
      predictiveInsightsEnabled: true,
      anomalySensitivity: "balanced" as const,
      updatedBy: currentUser?.id || "",
      updatedAt: createTimestamp()
    };

  const summaries = useMemo(
    () =>
      getIntelligentSummaries({
        workspaceId: currentWorkspace?.id || "",
        currency: currentWorkspace?.currency || "USD",
        dashboardMetrics,
        financeSummary,
        financialHealth,
        approvalCounts,
        executiveSummary,
        branchComparisons,
        procurementSummary,
        cashFlowForecast
      }).filter(
        (summary) =>
          !summary.visibleToRoles || !currentRole || summary.visibleToRoles.includes(currentRole)
      ),
    [
      approvalCounts,
      branchComparisons,
      cashFlowForecast,
      currentRole,
      currentWorkspace?.currency,
      currentWorkspace?.id,
      dashboardMetrics,
      executiveSummary,
      financeSummary,
      financialHealth,
      procurementSummary
    ]
  );

  const recommendations = useMemo(
    () =>
      getRecommendations({
        workspaceId: currentWorkspace?.id || "",
        currency: currentWorkspace?.currency || "USD",
        customers: workspaceData.customers,
        invoices: workspaceData.invoices,
        payments: workspaceData.payments,
        branches,
        branchComparisons,
        reviews,
        lowStockItems: lowStockItems.map((entry) => ({
          item: entry.item,
          status:
            entry.status === "out_of_stock"
              ? "out"
              : entry.status === "low_stock"
                ? "low"
                : "healthy"
        })),
        eligibleInvoices,
        financeSummary,
        supplierCreditSummary
      }).filter(
        (entry) => !entry.visibleToRoles || !currentRole || entry.visibleToRoles.includes(currentRole)
      ),
    [
      branchComparisons,
      branches,
      currentRole,
      currentWorkspace?.currency,
      currentWorkspace?.id,
      eligibleInvoices,
      financeSummary,
      lowStockItems,
      reviews,
      supplierCreditSummary,
      workspaceData.customers,
      workspaceData.invoices,
      workspaceData.payments
    ]
  );

  const predictiveInsights = useMemo(() => {
    if (!intelligenceSettings.predictiveInsightsEnabled) {
      return [];
    }

    return getPredictiveInsights({
      workspaceId: currentWorkspace?.id || "",
      currency: currentWorkspace?.currency || "USD",
      dashboardMetrics,
      cashFlowForecast,
      executiveSummary,
      financeSummary,
      financialHealth,
      supplierCreditSummary
    }).filter(
      (entry) => !entry.visibleToRoles || !currentRole || entry.visibleToRoles.includes(currentRole)
    );
  }, [
    cashFlowForecast,
    currentRole,
    currentWorkspace?.currency,
    currentWorkspace?.id,
    dashboardMetrics,
    executiveSummary,
    financeSummary,
    financialHealth,
    intelligenceSettings.predictiveInsightsEnabled,
    supplierCreditSummary
  ]);

  const anomalies = useMemo(() => {
    const detected = getDetectedAnomalies({
      workspaceId: currentWorkspace?.id || "",
      currency: currentWorkspace?.currency || "USD",
      invoices: workspaceData.invoices,
      payments: workspaceData.payments,
      expenses: workspaceData.expenses,
      purchases: workspaceData.purchases,
      purchasePayments: workspaceData.purchasePayments,
      approvals,
      reviews,
      branchComparisons,
      purchaseOrders,
      financeSummary
    });
    const stateById = new Map(
      (currentWorkspace
        ? state.anomalies.filter((entry) => entry.workspaceId === currentWorkspace.id)
        : []
      ).map((entry) => [entry.id, entry])
    );

    return detected.map((entry) => {
      const stored = stateById.get(entry.id);
      return stored
        ? {
            ...entry,
            status: stored.status,
            reviewedBy: stored.reviewedBy,
            reviewedAt: stored.reviewedAt
          }
        : entry;
    });
  }, [
    approvals,
    branchComparisons,
    currentWorkspace,
    financeSummary,
    purchaseOrders,
    reviews,
    state.anomalies,
    workspaceData.expenses,
    workspaceData.invoices,
    workspaceData.payments,
    workspaceData.purchasePayments,
    workspaceData.purchases
  ]);

  const actionTasks = useMemo(() => {
    const scoped = currentWorkspace
      ? state.actionTasks.filter((task) => task.workspaceId === currentWorkspace.id)
      : [];
    if (currentRole === "owner" || currentRole === "admin" || currentRole === "manager") {
      return scoped;
    }

    return scoped.filter(
      (task) => !task.assignedRole || task.assignedRole === currentRole
    );
  }, [currentRole, currentWorkspace, state.actionTasks]);
  const openTasks = actionTasks.filter((task) => task.status === "open");
  const actionCenterSummary = useMemo(
    () => getActionCenterSummary(actionTasks),
    [actionTasks]
  );

  const intelligenceAuditLogs = useMemo(
    () =>
      mergeIntelligenceAuditLogs(
        enterpriseAuditLogs,
        currentWorkspace
          ? state.intelligenceAuditLogs.filter((entry) => entry.workspaceId === currentWorkspace.id)
          : []
      ),
    [currentWorkspace, enterpriseAuditLogs, state.intelligenceAuditLogs]
  );

  const assistantSuggestedPrompts = useMemo(() => {
    if (currentRole === "staff") {
      return [
        "What tasks are open for me right now?",
        "Summarize approvals that need follow-up",
        "Draft a supplier follow-up note"
      ];
    }
    if (currentRole === "manager") {
      return [
        "Which branch is performing worst this month?",
        "What approvals are still pending?",
        "What needs attention right now?"
      ];
    }
    return [
      "What invoices are overdue right now?",
      "What suppliers need payment this week?",
      "What is hurting cash flow right now?",
      "Summarize the last 7 days of business activity"
    ];
  }, [currentRole]);

  function getSession(sessionId: string) {
    return assistantSessions.find((session) => session.id === sessionId);
  }

  function getDraftsForEntity(entityType: string, entityId: string) {
    return drafts.filter(
      (draft) => draft.relatedEntityType === entityType && draft.relatedEntityId === entityId
    );
  }

  function buildDraftContent(kind: DraftKind, relatedEntityType?: string, relatedEntityId?: string) {
    if (kind === "overdue_payment_reminder" && relatedEntityType === "invoice" && relatedEntityId) {
      const invoice = workspaceData.invoices.find((record) => record.id === relatedEntityId);
      const customer = workspaceData.customers.find((record) => record.id === invoice?.customerId);
      if (invoice) {
        const amount = getInvoiceOutstanding(invoice, workspaceData.payments);
        return {
          title: `Overdue reminder for ${invoice.reference}`,
          content: `Hi ${customer?.name || "there"}, this is a reminder that ${invoice.reference} still has ${formatCurrency(amount, currentWorkspace?.currency || "USD")} outstanding. Please confirm the payment date or share any issue blocking settlement so we can update the account clearly.`
        };
      }
    }

    if (kind === "supplier_follow_up" && relatedEntityType === "supplier" && relatedEntityId) {
      const supplier = workspaceData.suppliers.find((record) => record.id === relatedEntityId);
      const supplierRow = supplierCreditSummary.rows.find(
        (entry) => entry.term.supplierId === relatedEntityId
      );
      return {
        title: `Supplier follow-up for ${supplier?.name || "supplier"}`,
        content: `Hello ${supplier?.name || "team"}, we are reviewing current supplier obligations and would like to align on the outstanding amount of ${formatCurrency(supplierRow?.outstanding || 0, currentWorkspace?.currency || "USD")}. Please confirm the expected due timing or any updated credit terms.`
      };
    }

    if (kind === "approval_comment" && relatedEntityType === "review_request" && relatedEntityId) {
      const review = reviews.find((record) => record.id === relatedEntityId);
      return {
        title: `Approval note for ${review?.title || "review"}`,
        content: `Review note: ${review?.title || "This item"} needs a clearer decision path. Please confirm the business justification, supporting records, and next action so the queue can move without delay.`
      };
    }

    if (kind === "invoice_cover_note" && relatedEntityType === "invoice" && relatedEntityId) {
      const invoice = workspaceData.invoices.find((record) => record.id === relatedEntityId);
      const customer = workspaceData.customers.find((record) => record.id === invoice?.customerId);
      return {
        title: `Cover note for ${invoice?.reference || "invoice"}`,
        content: `Please find ${invoice?.reference || "the attached invoice"} for ${customer?.name || "your account"}. It reflects the agreed work and current due date. Let us know if you need any supporting detail or purchase order reference included before processing.`
      };
    }

    const executiveSummaryCard =
      summaries.find((entry) => entry.scope === "executive") ||
      summaries.find((entry) => entry.scope === "dashboard");
    return {
      title: "Manager summary",
      content: executiveSummaryCard
        ? `${executiveSummaryCard.summary} Key highlights: ${executiveSummaryCard.highlights.join("; ")}.`
        : "Current business summary is not available yet."
    };
  }

  const askAssistant = (question: string, sessionId?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_assistant") || !intelligenceSettings.assistantEnabled) {
      return { success: false, message: "Assistant access is not available." };
    }

    const questionValue = question.trim();
    if (!questionValue) {
      return { success: false, message: "Enter a business question first." };
    }

    const response = getAssistantAnswer({
      question: questionValue,
      currency: currentWorkspace?.currency || "USD",
      role: currentRole,
      canViewReceivables: canAccess("view_receivables") || canAccess("view_finance"),
      canViewPayables: canAccess("view_payables") || canAccess("view_finance"),
      canViewApprovals: canAccess("view_approvals"),
      canViewBranches: canAccess("view_branch_comparison") || canAccess("view_branches"),
      canViewExecutive: canAccess("view_executive_dashboard"),
      customers: workspaceData.customers,
      suppliers: workspaceData.suppliers,
      invoices: workspaceData.invoices,
      payments: workspaceData.payments,
      purchaseRows: supplierCreditSummary.rows,
      branchComparisons,
      approvals,
      reviews,
      activities: workspaceData.activities,
      summaries,
      recommendations,
      predictiveInsights
    });

    const nextSessionId = sessionId || createId("assistant-session");
    const interactionId = createId("assistant-interaction");
    setState((current) => {
      const existing = current.assistantSessions.find((entry) => entry.id === nextSessionId);
      const interaction = {
        id: interactionId,
        question: questionValue,
        intent: response.intent,
        answer: response.answer,
        hardFacts: response.hardFacts,
        derivedInsights: response.derivedInsights,
        followUps: response.followUps,
        sources: response.sources,
        askedAt: createTimestamp()
      };

      return {
        ...current,
        assistantSessions: existing
          ? current.assistantSessions.map((session) =>
              session.id === existing.id
                ? {
                    ...session,
                    title: session.title || truncateTitle(questionValue),
                    lastIntent: response.intent,
                    updatedAt: createTimestamp(),
                    interactions: [...session.interactions, interaction]
                  }
                : session
            )
          : [
              {
                id: nextSessionId,
                workspaceId: context.workspaceId,
                userId: context.userId,
                title: truncateTitle(questionValue),
                lastIntent: response.intent,
                createdAt: createTimestamp(),
                updatedAt: createTimestamp(),
                interactions: [interaction]
              },
              ...current.assistantSessions
            ],
        intelligenceAuditLogs: [
          createAuditLog({
            workspaceId: context.workspaceId,
            entityType: "assistant_session",
            entityId: nextSessionId,
            action: "asked",
            actorUserId: context.userId,
            actorRole: context.role,
            title: "Assistant query recorded",
            summary: questionValue,
            metadata: {
              intent: response.intent
            }
          }),
          ...current.intelligenceAuditLogs
        ]
      };
    });

    return {
      success: true,
      message: "Assistant response ready.",
      sessionId: nextSessionId,
      interactionId
    };
  };

  const saveAutomationRule = (payload: AutomationRulePayload, ruleId?: string) => {
    const context = ensureContext();
    if (
      !context.ok ||
      (!canAccess("manage_automations") && !canAccessModule("intelligence", "edit"))
    ) {
      return { success: false, message: "You do not have access to manage automations." };
    }

    const existing = automationRules.find((entry) => entry.id === ruleId);
    const id = existing?.id || createId("automation-rule");
    setState((current) => ({
      ...current,
      automationRules: existing
        ? current.automationRules.map((entry) =>
            entry.id === existing.id
              ? { ...entry, ...payload, updatedAt: createTimestamp() }
              : entry
          )
        : [
            {
              id,
              workspaceId: context.workspaceId,
              createdBy: context.userId,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp(),
              ...payload
            },
            ...current.automationRules
          ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "automation_rule",
          entityId: id,
          action: existing ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: existing ? "Automation rule updated" : "Automation rule created",
          summary: `${payload.name} automation was ${existing ? "updated" : "created"}.`,
          metadata: {
            trigger: payload.triggerType,
            enabled: payload.isEnabled
          }
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return {
      success: true,
      message: existing ? "Automation updated." : "Automation created.",
      id
    };
  };

  const runAutomationRule = (ruleId: string) => {
    const context = ensureContext();
    if (
      !context.ok ||
      (!canAccess("manage_automations") && !canAccessModule("intelligence", "edit"))
    ) {
      return { success: false, message: "You do not have access to run automations." };
    }
    if (!intelligenceSettings.automationEnabled) {
      return { success: false, message: "Automations are currently disabled in settings." };
    }

    const rule = automationRules.find((entry) => entry.id === ruleId);
    if (!rule) {
      return { success: false, message: "Automation rule not found." };
    }

    let summary = "No matching records were found for this rule.";
    let explanation = "The automation was checked against current data but no trigger matched.";
    let status: FlowV7State["automationRuns"][number]["status"] = "skipped";
    let href = "/app/automations";
    let relatedEntityType: string | undefined;
    let relatedEntityId: string | undefined;
    let taskTitle = "";
    let taskDescription = "";
    let taskPriority: ActionTask["priority"] = "normal";

    if (rule.triggerType === "invoice_overdue") {
      const overdue = outstandingByCustomer.filter((entry) => entry.amount > 0);
      if (overdue.length) {
        const top = overdue[0];
        summary = `${overdue.length} overdue customer balances still need collection follow-up.`;
        explanation = "The automation found customers with live overdue exposure.";
        status = "completed";
        href = "/app/receivables";
        relatedEntityType = "customer";
        relatedEntityId = top.customer.id;
        taskTitle = `Follow up ${top.customer.name} overdue balance`;
        taskDescription = `Collections automation identified ${formatCurrency(top.amount, currentWorkspace?.currency || "USD")} overdue for ${top.customer.name}.`;
        taskPriority = "high";
      }
    } else if (rule.triggerType === "supplier_payable_due") {
      const supplierRow = supplierCreditSummary.rows.find(
        (entry) => entry.overdue > 0 || entry.dueSoon > 0
      );
      if (supplierRow) {
        summary = `${supplierRow.supplier?.name || "A supplier"} has a payable requiring attention.`;
        explanation = "The automation found supplier obligations that are overdue or due soon.";
        status = "completed";
        href = "/app/finance/supplier-credit";
        relatedEntityType = "supplier_credit";
        relatedEntityId = supplierRow.term.supplierId;
        taskTitle = `Review supplier payable for ${supplierRow.supplier?.name || "supplier"}`;
        taskDescription = `Finance should confirm the due amount of ${formatCurrency(supplierRow.overdue || supplierRow.dueSoon, currentWorkspace?.currency || "USD")}.`;
        taskPriority = "high";
      }
    } else if (rule.triggerType === "approval_delay") {
      const delayed = anomalies.find((entry) => entry.type === "approval_delay" && entry.status === "open");
      if (delayed) {
        summary = delayed.summary;
        explanation = delayed.explanation;
        status = "completed";
        href = delayed.href || "/app/reviews";
        relatedEntityType = delayed.relatedEntityType;
        relatedEntityId = delayed.relatedEntityId;
        taskTitle = "Clear delayed approval queue";
        taskDescription = delayed.summary;
        taskPriority = "critical";
      }
    } else if (rule.triggerType === "branch_performance_drop") {
      const risky = branchComparisons.find((entry) => entry.riskScore >= 5);
      if (risky) {
        summary = `${risky.branch.name} is below the desired branch control range.`;
        explanation = "The automation found a branch with high risk score.";
        status = "completed";
        href = "/app/branch-comparison";
        relatedEntityType = "branch_control";
        relatedEntityId = risky.branch.id;
        taskTitle = `Review ${risky.branch.name} branch controls`;
        taskDescription = risky.riskLabel;
        taskPriority = "high";
      }
    } else if (rule.triggerType === "unusual_spend" || rule.triggerType === "reconciliation_mismatch") {
      const anomaly = anomalies.find(
        (entry) =>
          entry.status === "open" &&
          (entry.type === "expense_spike" || entry.type === "reconciliation_mismatch")
      );
      if (anomaly) {
        summary = anomaly.summary;
        explanation = anomaly.explanation;
        status = "completed";
        href = anomaly.href || "/app/anomalies";
        relatedEntityType = anomaly.relatedEntityType;
        relatedEntityId = anomaly.relatedEntityId;
        taskTitle = anomaly.title;
        taskDescription = anomaly.summary;
        taskPriority = anomaly.tone === "danger" ? "critical" : "high";
      }
    } else if (rule.triggerType === "low_stock") {
      const stockIssue = lowStockItems.find((entry) => entry.status !== "healthy");
      if (stockIssue) {
        summary = `${stockIssue.item.name} has reached ${stockIssue.status === "out" ? "out of stock" : "low stock"} status.`;
        explanation = "The automation found a tracked item below its reorder level.";
        status = "completed";
        href = "/app/stock";
        relatedEntityType = "item";
        relatedEntityId = stockIssue.item.id;
        taskTitle = `Reorder ${stockIssue.item.name}`;
        taskDescription = summary;
        taskPriority = stockIssue.status === "out" ? "critical" : "high";
      }
    } else if (rule.triggerType === "document_missing") {
      const returnedReview = reviews.find((entry) => entry.status === "returned");
      if (returnedReview) {
        summary = `${returnedReview.title} still needs supporting detail before it can progress.`;
        explanation = "The automation uses returned review items as a missing-support signal.";
        status = "completed";
        href = "/app/reviews";
        relatedEntityType = "review_request";
        relatedEntityId = returnedReview.id;
        taskTitle = "Resubmit returned review with support";
        taskDescription = summary;
        taskPriority = "high";
      }
    } else if (rule.triggerType === "scheduled_digest") {
      const digest =
        summaries.find((entry) => entry.scope === "executive") ||
        summaries.find((entry) => entry.scope === "dashboard");
      if (digest) {
        summary = digest.summary;
        explanation = "The automation generated a summary from current business data.";
        status = "completed";
        href = "/app/assistant";
        relatedEntityType = "intelligent_summary";
        relatedEntityId = digest.id;
        taskTitle = "Review latest business digest";
        taskDescription = digest.summary;
        taskPriority = "normal";
      }
    }

    const runId = createId("automation-run");
    const notificationId = createId("intelligence-note");
    const taskId = status === "completed" && taskTitle ? createId("task") : undefined;
    setState((current) => ({
      ...current,
      automationRules: current.automationRules.map((entry) =>
        entry.id === rule.id ? { ...entry, lastRunAt: createTimestamp(), updatedAt: createTimestamp() } : entry
      ),
      automationRuns: [
        {
          id: runId,
          workspaceId: context.workspaceId,
          ruleId: rule.id,
          triggerType: rule.triggerType,
          status,
          title: `${rule.name} ${status === "skipped" ? "checked" : "ran"}`,
          summary,
          explanation,
          relatedEntityType,
          relatedEntityId,
          outputTaskId: taskId,
          outputNotificationId: notificationId,
          createdAt: createTimestamp()
        },
        ...current.automationRuns
      ],
      actionTasks:
        status === "completed" && taskId
          ? [
              {
                id: taskId,
                workspaceId: context.workspaceId,
                sourceType: "automation",
                sourceId: runId,
                title: taskTitle,
                description: taskDescription,
                priority: taskPriority,
                status: "open",
                assignedRole: rule.targetRoles?.[0] || "manager",
                dueAt: createTimestamp(),
                href,
                relatedEntityType,
                relatedEntityId,
                createdAt: createTimestamp(),
                updatedAt: createTimestamp()
              },
              ...current.actionTasks
            ]
          : current.actionTasks,
      intelligenceNotifications: [
        {
          id: notificationId,
          workspaceId: context.workspaceId,
          type: "automation_triggered",
          title: status === "completed" ? "Automation completed" : "Automation checked",
          message: summary,
          href,
          visibleToRoles: rule.targetRoles,
          isRead: false,
          createdAt: createTimestamp()
        },
        ...current.intelligenceNotifications
      ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "automation_run",
          entityId: runId,
          action: "triggered",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Automation rule executed",
          summary,
          metadata: {
            trigger: rule.triggerType,
            status
          }
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return {
      success: true,
      message: status === "completed" ? "Automation run completed." : "Automation checked.",
      id: runId
    };
  };

  const markAnomalyReviewed = (anomalyId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_anomalies")) {
      return { success: false, message: "You do not have access to anomaly review." };
    }

    const anomaly = anomalies.find((entry) => entry.id === anomalyId);
    if (!anomaly) {
      return { success: false, message: "Anomaly not found." };
    }

    setState((current) => ({
      ...current,
      anomalies: current.anomalies.some((entry) => entry.id === anomalyId)
        ? current.anomalies.map((entry) =>
            entry.id === anomalyId
              ? {
                  ...entry,
                  status: "reviewed",
                  reviewedBy: context.userId,
                  reviewedAt: createTimestamp()
                }
              : entry
          )
        : [
            {
              ...anomaly,
              status: "reviewed",
              reviewedBy: context.userId,
              reviewedAt: createTimestamp()
            },
            ...current.anomalies
          ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "anomaly_event",
          entityId: anomalyId,
          action: "resolved",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Anomaly reviewed",
          summary: anomaly.title
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return { success: true, message: "Anomaly marked as reviewed." };
  };

  const dismissAnomaly = (anomalyId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_anomalies")) {
      return { success: false, message: "You do not have access to anomaly review." };
    }

    const anomaly = anomalies.find((entry) => entry.id === anomalyId);
    if (!anomaly) {
      return { success: false, message: "Anomaly not found." };
    }

    setState((current) => ({
      ...current,
      anomalies: current.anomalies.some((entry) => entry.id === anomalyId)
        ? current.anomalies.map((entry) =>
            entry.id === anomalyId
              ? { ...entry, status: "dismissed", reviewedBy: context.userId, reviewedAt: createTimestamp() }
              : entry
          )
        : [
            {
              ...anomaly,
              status: "dismissed",
              reviewedBy: context.userId,
              reviewedAt: createTimestamp()
            },
            ...current.anomalies
          ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "anomaly_event",
          entityId: anomalyId,
          action: "dismissed",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Anomaly dismissed",
          summary: anomaly.title
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return { success: true, message: "Anomaly dismissed." };
  };

  const updateTaskStatus = (taskId: string, payload: TaskUpdatePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_action_center")) {
      return { success: false, message: "You do not have access to update tasks." };
    }

    const existing = actionTasks.find((task) => task.id === taskId);
    if (!existing) {
      return { success: false, message: "Task not found." };
    }

    setState((current) => ({
      ...current,
      actionTasks: current.actionTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: payload.status,
              snoozedUntil: payload.snoozedUntil,
              updatedAt: createTimestamp()
            }
          : task
      ),
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "action_task",
          entityId: taskId,
          action:
            payload.status === "done"
              ? "resolved"
              : payload.status === "snoozed"
                ? "snoozed"
                : payload.status === "dismissed"
                  ? "dismissed"
                  : "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Action task updated",
          summary: `${existing.title} moved to ${payload.status}.`
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return { success: true, message: "Task updated." };
  };

  const createTaskFromRecommendation = (recommendationId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("view_action_center")) {
      return { success: false, message: "You do not have access to create action tasks." };
    }

    const recommendation = recommendations.find((entry) => entry.id === recommendationId);
    if (!recommendation) {
      return { success: false, message: "Recommendation not found." };
    }

    const id = createId("task");
    setState((current) => ({
      ...current,
      actionTasks: [
        {
          id,
          workspaceId: context.workspaceId,
          sourceType: "recommendation",
          sourceId: recommendation.id,
          title: recommendation.title,
          description: recommendation.summary,
          priority:
            recommendation.priority === "high"
              ? "high"
              : recommendation.priority === "medium"
                ? "normal"
                : "low",
          status: "open",
          assignedRole: context.role,
          dueAt: createTimestamp(),
          href: recommendation.href,
          relatedEntityType: recommendation.relatedEntityType,
          relatedEntityId: recommendation.relatedEntityId,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp()
        },
        ...current.actionTasks
      ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "action_task",
          entityId: id,
          action: "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Task created from recommendation",
          summary: recommendation.title
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return { success: true, message: "Task created from recommendation.", id };
  };

  const generateDraft = (payload: DraftPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("generate_ai_drafts")) {
      return { success: false, message: "You do not have access to draft generation." };
    }

    const content = buildDraftContent(
      payload.kind,
      payload.relatedEntityType,
      payload.relatedEntityId
    );
    const id = createId("draft");
    setState((current) => ({
      ...current,
      drafts: [
        {
          id,
          workspaceId: context.workspaceId,
          kind: payload.kind,
          title: content.title,
          content: content.content,
          relatedEntityType: payload.relatedEntityType,
          relatedEntityId: payload.relatedEntityId,
          createdBy: context.userId,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp()
        },
        ...current.drafts
      ],
      intelligenceNotifications: [
        {
          id: createId("intelligence-note"),
          workspaceId: context.workspaceId,
          type: "draft_generated",
          title: "Draft generated",
          message: content.title,
          href:
            payload.relatedEntityType === "invoice" && payload.relatedEntityId
              ? `/app/invoices/${payload.relatedEntityId}`
              : "/app/assistant",
          visibleToRoles: [context.role],
          isRead: false,
          createdAt: createTimestamp()
        },
        ...current.intelligenceNotifications
      ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "assistant_draft",
          entityId: id,
          action: "generated_draft",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Assistant draft generated",
          summary: content.title,
          metadata: {
            kind: payload.kind
          }
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return { success: true, message: "Draft generated.", id };
  };

  const markIntelligenceNotificationRead = (notificationId: string) => {
    setState((current) => ({
      ...current,
      intelligenceNotifications: current.intelligenceNotifications.map((note) =>
        note.id === notificationId ? { ...note, isRead: true } : note
      )
    }));
  };

  const markAllIntelligenceNotificationsRead = () => {
    if (!currentWorkspace) {
      return;
    }

    setState((current) => ({
      ...current,
      intelligenceNotifications: current.intelligenceNotifications.map((note) =>
        note.workspaceId === currentWorkspace.id ? { ...note, isRead: true } : note
      )
    }));
  };

  const updateIntelligenceSettings = (payload: IntelligenceSettingsPayload) => {
    const context = ensureContext();
    if (
      !context.ok ||
      (!canAccess("manage_intelligence_settings") &&
        !canAccessModule("intelligence", "manage_sensitive"))
    ) {
      return { success: false, message: "You do not have access to intelligence settings." };
    }

    setState((current) => ({
      ...current,
      intelligenceSettings: current.intelligenceSettings.some(
        (entry) => entry.workspaceId === context.workspaceId
      )
        ? current.intelligenceSettings.map((entry) =>
            entry.workspaceId === context.workspaceId
              ? { ...entry, ...payload, updatedBy: context.userId, updatedAt: createTimestamp() }
              : entry
          )
        : [
            {
              workspaceId: context.workspaceId,
              ...payload,
              updatedBy: context.userId,
              updatedAt: createTimestamp()
            },
            ...current.intelligenceSettings
          ],
      intelligenceAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "intelligence_settings",
          entityId: context.workspaceId,
          action: "edited",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Intelligence settings updated",
          summary: "Assistant, automation, or predictive controls were updated."
        }),
        ...current.intelligenceAuditLogs
      ]
    }));

    return { success: true, message: "Intelligence settings updated." };
  };

  const resetV7DemoState = () => {
    setState(seedFlowV7State);
  };

  return (
    <FlowV7Context.Provider
      value={{
        isHydrated,
        assistantSessions,
        automationRules,
        automationRuns,
        anomalies,
        recommendations,
        actionTasks,
        openTasks,
        predictiveInsights,
        summaries,
        drafts,
        intelligenceNotifications: rawIntelligenceNotifications,
        unreadIntelligenceCount,
        intelligenceSettings,
        assistantSuggestedPrompts,
        actionCenterSummary,
        intelligenceAuditLogs,
        getSession,
        getDraftsForEntity,
        askAssistant,
        saveAutomationRule,
        runAutomationRule,
        markAnomalyReviewed,
        dismissAnomaly,
        updateTaskStatus,
        createTaskFromRecommendation,
        generateDraft,
        markIntelligenceNotificationRead,
        markAllIntelligenceNotificationsRead,
        updateIntelligenceSettings,
        resetV7DemoState
      }}
    >
      {children}
    </FlowV7Context.Provider>
  );
}

export function useFlowV7() {
  const context = useContext(FlowV7Context);
  if (!context) {
    throw new Error("useFlowV7 must be used within FlowV7Provider.");
  }

  return context;
}
