"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { getInvoiceTotal, getPurchaseTotal } from "@/lib/calculations";
import {
  filterByBranch,
  getApprovalCounts,
  getBranchSummaries,
  getCashFlowForecast,
  getLowStockItems,
  getPrimaryBranch,
  getProjectSummaries,
  getRecordMeta,
  mergeOperationalAlerts
} from "@/lib/v3-calculations";
import {
  createEmptyFlowV3State,
  seedFlowV3State,
  upgradeFlowV3State
} from "@/lib/v3-seed";
import {
  loadFlowV3State,
  loadRemoteFlowV3State,
  queueFlowV3StateSave,
  saveFlowV3State
} from "@/lib/v3-storage";
import {
  ApprovalEntityType,
  ApprovalRequest,
  Branch,
  ManagedRecordType,
  OperationalAlert,
  ProjectJob,
  RecordMeta,
  StockProfile,
  TeamInvite,
  TeamMemberProfile,
  TemplateSettings,
  VaultDocument
} from "@/lib/v3-types";

interface BranchPayload {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerName?: string;
  isPrimary?: boolean;
}

interface TeamInvitePayload {
  fullName: string;
  email: string;
  role: "owner" | "admin" | "manager" | "staff";
  department?: string;
  notes?: string;
}

interface TeamProfilePayload {
  department?: string;
  notes?: string;
}

interface ApprovalDecisionPayload {
  status: "approved" | "rejected";
  note?: string;
}

interface StockProfilePayload {
  isTracked: boolean;
  openingQuantity: number;
  reorderLevel: number;
}

interface StockAdjustmentPayload {
  branchId?: string;
  direction: "increase" | "decrease";
  quantity: number;
  reason: string;
  notes?: string;
}

interface ProjectPayload {
  name: string;
  code: string;
  customerId?: string;
  branchId?: string;
  status: "active" | "completed" | "archived";
  notes?: string;
  budgetAmount?: number;
}

interface DocumentPayload {
  title: string;
  category: VaultDocument["category"];
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  linkedEntityType?: ManagedRecordType;
  linkedEntityId?: string;
  branchId?: string;
  projectId?: string;
}

interface TemplatePayload {
  invoiceStyle: TemplateSettings["invoiceStyle"];
  quoteStyle: TemplateSettings["quoteStyle"];
  receiptStyle: TemplateSettings["receiptStyle"];
  footerNote?: string;
  showLogo: boolean;
}

interface FlowV3ContextValue {
  isHydrated: boolean;
  currentBranchId: string;
  currentBranch?: Branch;
  branches: Branch[];
  teamProfiles: TeamMemberProfile[];
  teamInvites: TeamInvite[];
  approvals: ApprovalRequest[];
  approvalCounts: ReturnType<typeof getApprovalCounts>;
  stockProfiles: StockProfile[];
  lowStockItems: ReturnType<typeof getLowStockItems>;
  projects: ProjectJob[];
  projectSummaries: ReturnType<typeof getProjectSummaries>;
  branchSummaries: ReturnType<typeof getBranchSummaries>;
  cashFlowForecast: ReturnType<typeof getCashFlowForecast>;
  documents: VaultDocument[];
  templateSettings: TemplateSettings;
  operationalAlerts: OperationalAlert[];
  unreadOperationalCount: number;
  setCurrentBranchId: (branchId: string) => void;
  saveBranch: (payload: BranchPayload, branchId?: string) => { success: boolean; message: string; id?: string };
  archiveBranch: (branchId: string) => { success: boolean; message: string };
  inviteTeamMember: (payload: TeamInvitePayload) => { success: boolean; message: string; id?: string };
  updateTeamProfile: (profileId: string, payload: TeamProfilePayload) => { success: boolean; message: string };
  setTeamProfileStatus: (profileId: string, status: TeamMemberProfile["status"]) => { success: boolean; message: string };
  decideApproval: (approvalId: string, payload: ApprovalDecisionPayload) => { success: boolean; message: string };
  saveStockProfile: (itemId: string, payload: StockProfilePayload) => { success: boolean; message: string };
  recordStockAdjustment: (itemId: string, payload: StockAdjustmentPayload) => { success: boolean; message: string };
  saveProject: (payload: ProjectPayload, projectId?: string) => { success: boolean; message: string; id?: string };
  archiveProject: (projectId: string) => { success: boolean; message: string };
  linkRecordMeta: (
    entityType: ManagedRecordType,
    entityId: string,
    payload: { branchId?: string; projectId?: string }
  ) => { success: boolean; message: string };
  getRecordBranchId: (entityType: ManagedRecordType, entityId: string) => string | undefined;
  getRecordProjectId: (entityType: ManagedRecordType, entityId: string) => string | undefined;
  saveDocument: (payload: DocumentPayload) => { success: boolean; message: string; id?: string };
  deleteDocument: (documentId: string) => { success: boolean; message: string };
  updateTemplateSettings: (payload: TemplatePayload) => { success: boolean; message: string };
  markOperationalAlertRead: (alertId: string) => void;
  markAllOperationalAlertsRead: () => void;
  resetV3DemoState: () => void;
}

const FlowV3Context = createContext<FlowV3ContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function defaultTemplateSettings(workspaceId: string): TemplateSettings {
  const timestamp = createTimestamp();
  return {
    workspaceId,
    invoiceStyle: "classic",
    quoteStyle: "classic",
    receiptStyle: "compact",
    footerNote: "Thank you for choosing Novoriq Flow.",
    showLogo: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function ensureWorkspaceState(params: {
  state: ReturnType<typeof upgradeFlowV3State>;
  workspaceId: string;
  activeBranchId: string;
  teamMembers: Array<{ member: { id: string; userId: string; role: TeamMemberProfile["role"] }; user?: { fullName: string; email: string } }>;
  invoices: Array<{ id: string }>;
  quotes: Array<{ id: string }>;
  expenses: Array<{ id: string; amount: number; createdBy?: string }>;
  purchases: Array<{ id: string; status: string; createdBy?: string; lineItems: Array<{ quantity: number; unitCost: number }> }>;
  items: Array<{ id: string }>;
  expenseThreshold: number;
}) {
  const primaryBranch =
    params.state.branches.find(
      (branch) => branch.workspaceId === params.workspaceId && branch.isPrimary && branch.status === "active"
    ) ||
    {
      id: createId("branch"),
      workspaceId: params.workspaceId,
      name: "Main branch",
      code: "MAIN",
      isPrimary: true,
      status: "active" as const,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

  let nextState = params.state;
  let changed = false;

  if (!params.state.branches.some((branch) => branch.workspaceId === params.workspaceId)) {
    nextState = {
      ...nextState,
      branches: [...nextState.branches, primaryBranch]
    };
    changed = true;
  }

  if (!nextState.templateSettings.some((record) => record.workspaceId === params.workspaceId)) {
    nextState = {
      ...nextState,
      templateSettings: [...nextState.templateSettings, defaultTemplateSettings(params.workspaceId)]
    };
    changed = true;
  }

  params.teamMembers.forEach((entry) => {
    if (
      !nextState.teamProfiles.some(
        (profile) =>
          profile.workspaceId === params.workspaceId &&
          (profile.workspaceMemberId === entry.member.id || profile.userId === entry.member.userId)
      )
    ) {
      nextState = {
        ...nextState,
        teamProfiles: [
          ...nextState.teamProfiles,
          {
            id: createId("team"),
            workspaceId: params.workspaceId,
            workspaceMemberId: entry.member.id,
            userId: entry.member.userId,
            fullName: entry.user?.fullName || "Workspace user",
            email: entry.user?.email || "",
            role: entry.member.role,
            status: "active",
            createdAt: createTimestamp(),
            updatedAt: createTimestamp()
          }
        ]
      };
      changed = true;
    }
  });

  params.items.forEach((item) => {
    if (
      !nextState.stockProfiles.some(
        (profile) => profile.workspaceId === params.workspaceId && profile.itemId === item.id
      )
    ) {
      nextState = {
        ...nextState,
        stockProfiles: [
          ...nextState.stockProfiles,
          {
            id: createId("stock-profile"),
            workspaceId: params.workspaceId,
            itemId: item.id,
            isTracked: false,
            openingQuantity: 0,
            reorderLevel: 0,
            preferredBranchId:
              params.activeBranchId !== "all" ? params.activeBranchId : primaryBranch.id,
            createdAt: createTimestamp(),
            updatedAt: createTimestamp()
          }
        ]
      };
      changed = true;
    }
  });

  const ensureMeta = (entityType: ManagedRecordType, entityId: string) => {
    if (
      !nextState.recordMeta.some(
        (record) =>
          record.workspaceId === params.workspaceId &&
          record.entityType === entityType &&
          record.entityId === entityId
      )
    ) {
      nextState = {
        ...nextState,
        recordMeta: [
          ...nextState.recordMeta,
          {
            id: createId("record-meta"),
            workspaceId: params.workspaceId,
            entityType,
            entityId,
            branchId:
              params.activeBranchId !== "all" ? params.activeBranchId : primaryBranch.id,
            createdAt: createTimestamp(),
            updatedAt: createTimestamp()
          }
        ]
      };
      changed = true;
    }
  };

  params.invoices.forEach((record) => ensureMeta("invoice", record.id));
  params.quotes.forEach((record) => ensureMeta("quote", record.id));
  params.expenses.forEach((record) => ensureMeta("expense", record.id));
  params.purchases.forEach((record) => ensureMeta("purchase", record.id));

  params.expenses.forEach((expense) => {
    const approvalId = `auto-approval-expense-${expense.id}`;
    if (
      expense.amount >= params.expenseThreshold &&
      !nextState.approvals.some((approval) => approval.id === approvalId)
    ) {
      const branchId =
        getRecordMeta(nextState.recordMeta, "expense", expense.id)?.branchId || primaryBranch.id;
      nextState = {
        ...nextState,
        approvals: [
          ...nextState.approvals,
          {
            id: approvalId,
            workspaceId: params.workspaceId,
            entityType: "expense",
            entityId: expense.id,
            branchId,
            title: "Large expense approval needed",
            description: "This expense crossed the configured approval threshold.",
            status: "pending",
            requestedBy: expense.createdBy || params.teamMembers[0]?.member.userId || "",
            createdAt: createTimestamp(),
            updatedAt: createTimestamp(),
            history: [
              {
                id: createId("approval-history"),
                action: "requested",
                actorUserId: expense.createdBy || params.teamMembers[0]?.member.userId || "",
                actorRole:
                  params.teamMembers.find(
                    (entry) => entry.member.userId === expense.createdBy
                  )?.member.role || "owner",
                note: "Auto-generated from expense control rules.",
                createdAt: createTimestamp()
              }
            ]
          }
        ]
      };
      changed = true;
    }
  });

  params.purchases.forEach((purchase) => {
    const total = purchase.lineItems.reduce(
      (sum, lineItem) => sum + lineItem.quantity * lineItem.unitCost,
      0
    );
    const approvalId = `auto-approval-purchase-${purchase.id}`;
    const isApprovalRequired = purchase.status !== "draft" && total >= 250;
    if (
      isApprovalRequired &&
      !nextState.approvals.some((approval) => approval.id === approvalId)
    ) {
      const branchId =
        getRecordMeta(nextState.recordMeta, "purchase", purchase.id)?.branchId ||
        primaryBranch.id;
      nextState = {
        ...nextState,
        approvals: [
          ...nextState.approvals,
          {
            id: approvalId,
            workspaceId: params.workspaceId,
            entityType: "purchase",
            entityId: purchase.id,
            branchId,
            title: "Purchase confirmation approval needed",
            description: "This purchase needs approval before it is treated as fully controlled.",
            status: "pending",
            requestedBy: purchase.createdBy || params.teamMembers[0]?.member.userId || "",
            createdAt: createTimestamp(),
            updatedAt: createTimestamp(),
            history: [
              {
                id: createId("approval-history"),
                action: "requested",
                actorUserId: purchase.createdBy || params.teamMembers[0]?.member.userId || "",
                actorRole:
                  params.teamMembers.find(
                    (entry) => entry.member.userId === purchase.createdBy
                  )?.member.role || "owner",
                note: "Auto-generated from purchase control rules.",
                createdAt: createTimestamp()
              }
            ]
          }
        ]
      };
      changed = true;
    }
  });

  return changed ? nextState : params.state;
}

export function FlowV3Provider({ children }: { children: React.ReactNode }) {
  const {
    canAccess,
    currentRole,
    currentUser,
    currentWorkspace,
    workspaceData
  } = useBusinessOS();
  const [state, setState] = useState(createEmptyFlowV3State);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteStateReady, setIsRemoteStateReady] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState("all");

  useEffect(() => {
    let isMounted = true;
    const loaded = loadFlowV3State();
    setState(upgradeFlowV3State(loaded || seedFlowV3State));
    setIsHydrated(true);

    void loadRemoteFlowV3State().then((remoteState) => {
      if (!isMounted) {
        return;
      }

      if (remoteState) {
        setState(upgradeFlowV3State(remoteState));
      }

      setIsRemoteStateReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isRemoteStateReady) {
      return;
    }

    saveFlowV3State(state);
    queueFlowV3StateSave(state);
  }, [isHydrated, isRemoteStateReady, state]);

  useEffect(() => {
    if (!isHydrated || !currentWorkspace) {
      return;
    }

    setState((current) =>
      ensureWorkspaceState({
        state: current,
        workspaceId: currentWorkspace.id,
        activeBranchId: currentBranchId,
        teamMembers: workspaceData.teamMembers.map((entry) => ({
          member: {
            id: entry.member.id,
            userId: entry.member.userId,
            role: entry.member.role
          },
          user: entry.user
            ? {
                fullName: entry.user.fullName,
                email: entry.user.email
              }
            : undefined
        })),
        invoices: workspaceData.invoices.map((record) => ({ id: record.id })),
        quotes: workspaceData.quotes.map((record) => ({ id: record.id })),
        expenses: workspaceData.expenses.map((record) => ({
          id: record.id,
          amount: record.amount,
          createdBy: record.createdBy
        })),
        purchases: workspaceData.purchases.map((record) => ({
          id: record.id,
          status: record.status,
          createdBy: record.createdBy,
          lineItems: record.lineItems
        })),
        items: workspaceData.items.map((record) => ({ id: record.id })),
        expenseThreshold: workspaceData.settings?.significantExpenseThreshold || 300
      })
    );
  }, [
    currentBranchId,
    currentWorkspace,
    isHydrated,
    workspaceData.expenses,
    workspaceData.invoices,
    workspaceData.items,
    workspaceData.purchases,
    workspaceData.quotes,
    workspaceData.teamMembers,
    workspaceData.settings
  ]);

  const scopedBranches = useMemo(
    () =>
      currentWorkspace
        ? state.branches
            .filter((branch) => branch.workspaceId === currentWorkspace.id)
            .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
        : [],
    [currentWorkspace, state.branches]
  );
  const currentBranch =
    currentBranchId === "all"
      ? undefined
      : scopedBranches.find((branch) => branch.id === currentBranchId);
  const scopedTeamProfiles = useMemo(
    () =>
      currentWorkspace
        ? state.teamProfiles.filter((profile) => profile.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.teamProfiles]
  );
  const scopedTeamInvites = useMemo(
    () =>
      currentWorkspace
        ? state.teamInvites.filter((invite) => invite.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.teamInvites]
  );
  const scopedApprovals = useMemo(
    () =>
      currentWorkspace
        ? state.approvals.filter((approval) => approval.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.approvals]
  );
  const scopedStockProfiles = useMemo(
    () =>
      currentWorkspace
        ? state.stockProfiles.filter((profile) => profile.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.stockProfiles]
  );
  const scopedStockAdjustments = useMemo(
    () =>
      currentWorkspace
        ? state.stockAdjustments.filter((adjustment) => adjustment.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.stockAdjustments]
  );
  const scopedProjects = useMemo(
    () =>
      currentWorkspace
        ? state.projects.filter((project) => project.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.projects]
  );
  const scopedRecordMeta = useMemo(
    () =>
      currentWorkspace
        ? state.recordMeta.filter((record) => record.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.recordMeta]
  );
  const scopedDocuments = useMemo(
    () =>
      currentWorkspace
        ? state.vaultDocuments.filter((document) => document.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.vaultDocuments]
  );
  const templateSettings =
    (currentWorkspace &&
      state.templateSettings.find((record) => record.workspaceId === currentWorkspace.id)) ||
    defaultTemplateSettings(currentWorkspace?.id || "workspace-template");

  const lowStockItems = useMemo(
    () =>
      getLowStockItems({
        items: workspaceData.items,
        stockProfiles: scopedStockProfiles,
        purchases: workspaceData.purchases,
        stockAdjustments: scopedStockAdjustments,
        recordMeta: scopedRecordMeta,
        branchId: currentBranchId
      }),
    [
      currentBranchId,
      scopedRecordMeta,
      scopedStockAdjustments,
      scopedStockProfiles,
      workspaceData.items,
      workspaceData.purchases
    ]
  );
  const cashFlowForecast = useMemo(
    () =>
      getCashFlowForecast({
        invoices: workspaceData.invoices,
        payments: workspaceData.payments,
        purchases: workspaceData.purchases,
        purchasePayments: workspaceData.purchasePayments,
        recordMeta: scopedRecordMeta,
        branchId: currentBranchId
      }),
    [
      currentBranchId,
      scopedRecordMeta,
      workspaceData.invoices,
      workspaceData.payments,
      workspaceData.purchases,
      workspaceData.purchasePayments
    ]
  );
  const branchSummaries = useMemo(
    () =>
      getBranchSummaries({
        branches: scopedBranches,
        recordMeta: scopedRecordMeta,
        invoices: workspaceData.invoices,
        payments: workspaceData.payments,
        expenses: workspaceData.expenses,
        purchases: workspaceData.purchases,
        purchasePayments: workspaceData.purchasePayments
      }),
    [
      scopedBranches,
      scopedRecordMeta,
      workspaceData.expenses,
      workspaceData.invoices,
      workspaceData.payments,
      workspaceData.purchases,
      workspaceData.purchasePayments
    ]
  );
  const projectSummaries = useMemo(
    () =>
      getProjectSummaries({
        projects: scopedProjects,
        recordMeta: scopedRecordMeta,
        invoices: workspaceData.invoices,
        payments: workspaceData.payments,
        expenses: workspaceData.expenses,
        purchases: workspaceData.purchases,
        purchasePayments: workspaceData.purchasePayments
      }),
    [
      scopedProjects,
      scopedRecordMeta,
      workspaceData.expenses,
      workspaceData.invoices,
      workspaceData.payments,
      workspaceData.purchases,
      workspaceData.purchasePayments
    ]
  );
  const approvalCounts = useMemo(() => getApprovalCounts(scopedApprovals), [scopedApprovals]);

  const generatedAlerts = useMemo(() => {
    if (!currentWorkspace) {
      return [];
    }

    const alerts: OperationalAlert[] = [];

    scopedApprovals
      .filter((approval) => approval.status === "pending")
      .forEach((approval) => {
        alerts.push({
          id: `generated-approval-${approval.id}`,
          workspaceId: currentWorkspace.id,
          type: "approval_needed",
          title: approval.title,
          message: approval.description,
          href: "/app/approvals",
          visibleToRoles: ["owner", "admin", "manager"],
          branchId: approval.branchId,
          isRead: false,
          createdAt: approval.updatedAt
        });
      });

    lowStockItems.forEach((entry) => {
      if (entry.status === "low_stock" || entry.status === "out_of_stock") {
        alerts.push({
          id: `generated-stock-${entry.item.id}-${entry.status}`,
          workspaceId: currentWorkspace.id,
          type: entry.status === "out_of_stock" ? "out_of_stock" : "low_stock",
          title:
            entry.status === "out_of_stock"
              ? `${entry.item.name} is out of stock`
              : `${entry.item.name} is running low`,
          message: `Quantity on hand is ${entry.quantity}.`,
          href: "/app/stock",
          visibleToRoles: ["owner", "admin", "manager", "staff"],
          branchId: entry.profile?.preferredBranchId,
          isRead: false,
          createdAt: createTimestamp()
        });
      }
    });

    if (cashFlowForecast.projectedNet < 0) {
      alerts.push({
        id: `generated-cash-${currentWorkspace.id}-${currentBranchId}`,
        workspaceId: currentWorkspace.id,
        type: "cash_flow_warning",
        title: "Cash pressure forecast is building",
        message: `Upcoming payables exceed receivables by ${Math.abs(
          cashFlowForecast.projectedNet
        ).toFixed(2)} in the current forecast window.`,
        href: "/app/reports",
        visibleToRoles: ["owner", "admin", "manager"],
        branchId: currentBranch?.id,
        isRead: false,
        createdAt: createTimestamp()
      });
    }

    projectSummaries
      .filter((summary) => summary.estimatedProfit < 0)
      .forEach((summary) => {
        alerts.push({
          id: `generated-project-${summary.project.id}`,
          workspaceId: currentWorkspace.id,
          type: "project_margin",
          title: `${summary.project.name} is margin-negative`,
          message: "Collected revenue is below linked expense and purchase costs.",
          href: `/app/projects/${summary.project.id}`,
          visibleToRoles: ["owner", "admin", "manager"],
          branchId: summary.project.branchId,
          projectId: summary.project.id,
          isRead: false,
          createdAt: summary.project.updatedAt
        });
      });

    return alerts;
  }, [
    cashFlowForecast.projectedNet,
    currentBranch?.id,
    currentBranchId,
    currentWorkspace,
    lowStockItems,
    projectSummaries,
    scopedApprovals
  ]);

  const operationalAlerts = useMemo(
    () =>
      mergeOperationalAlerts(
        currentWorkspace
          ? state.operationalAlerts.filter((alert) => alert.workspaceId === currentWorkspace.id)
          : [],
        generatedAlerts
      ).filter(
        (alert) => !alert.visibleToRoles || !currentRole || alert.visibleToRoles.includes(currentRole)
      ),
    [currentRole, currentWorkspace, generatedAlerts, state.operationalAlerts]
  );
  const unreadOperationalCount = operationalAlerts.filter((alert) => !alert.isRead).length;

  const ensureContext = () => {
    if (!currentWorkspace || !currentUser || !currentRole) {
      return { ok: false as const, message: "Workspace context is missing." };
    }

    return {
      ok: true as const,
      workspaceId: currentWorkspace.id,
      userId: currentUser.id,
      role: currentRole
    };
  };

  const saveBranch = (payload: BranchPayload, branchId?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_branches")) {
      return { success: false, message: "You do not have access to manage branches." };
    }

    const existing = state.branches.find((record) => record.id === branchId);
    const timestamp = createTimestamp();
    const branch: Branch = {
      id: branchId || createId("branch"),
      workspaceId: context.workspaceId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      address: payload.address?.trim(),
      phone: payload.phone?.trim(),
      managerName: payload.managerName?.trim(),
      isPrimary: Boolean(payload.isPrimary),
      status: existing?.status || "active",
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp
    };

    setState((current) => ({
      ...current,
      branches: branchId
        ? current.branches.map((record) =>
            record.id === branchId
              ? branch
              : branch.isPrimary && record.workspaceId === context.workspaceId
                ? { ...record, isPrimary: false, updatedAt: timestamp }
                : record
          )
        : [
            ...current.branches.map((record) =>
              branch.isPrimary && record.workspaceId === context.workspaceId
                ? { ...record, isPrimary: false, updatedAt: timestamp }
                : record
            ),
            branch
          ]
    }));

    return {
      success: true,
      message: branchId ? "Branch updated." : "Branch created.",
      id: branch.id
    };
  };

  const archiveBranch = (branchId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_branches")) {
      return { success: false, message: "You do not have access to archive branches." };
    }

    setState((current) => ({
      ...current,
      branches: current.branches.map((record) =>
        record.id === branchId
          ? { ...record, status: "archived", isPrimary: false, updatedAt: createTimestamp() }
          : record
      )
    }));
    if (currentBranchId === branchId) {
      setCurrentBranchId("all");
    }
    return { success: true, message: "Branch archived." };
  };

  const inviteTeamMember = (payload: TeamInvitePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_team")) {
      return { success: false, message: "You do not have access to invite team members." };
    }

    const invite: TeamInvite = {
      id: createId("invite"),
      workspaceId: context.workspaceId,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      department: payload.department?.trim(),
      status: "pending",
      invitedBy: context.userId,
      notes: payload.notes?.trim(),
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

    setState((current) => ({
      ...current,
      teamInvites: [invite, ...current.teamInvites],
      operationalAlerts: [
        {
          id: `invite-alert-${invite.id}`,
          workspaceId: context.workspaceId,
          type: "branch_attention",
          title: "New teammate invited",
          message: `${invite.fullName} was added as ${invite.role}.`,
          href: "/app/team",
          visibleToRoles: ["owner", "admin"],
          isRead: false,
          createdAt: invite.createdAt
        },
        ...current.operationalAlerts
      ]
    }));

    return { success: true, message: "Team invite created.", id: invite.id };
  };

  const updateTeamProfile = (profileId: string, payload: TeamProfilePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_team")) {
      return { success: false, message: "You do not have access to manage team details." };
    }

    setState((current) => ({
      ...current,
      teamProfiles: current.teamProfiles.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              department: payload.department?.trim(),
              notes: payload.notes?.trim(),
              updatedAt: createTimestamp()
            }
          : profile
      )
    }));
    return { success: true, message: "Team member updated." };
  };

  const setTeamProfileStatus = (
    profileId: string,
    status: TeamMemberProfile["status"]
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_team")) {
      return { success: false, message: "You do not have access to change team status." };
    }

    setState((current) => ({
      ...current,
      teamProfiles: current.teamProfiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, status, updatedAt: createTimestamp() }
          : profile
      )
    }));
    return { success: true, message: `Team member marked ${status}.` };
  };

  const decideApproval = (approvalId: string, payload: ApprovalDecisionPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_approvals")) {
      return { success: false, message: "You do not have access to resolve approvals." };
    }

    const approval = scopedApprovals.find((record) => record.id === approvalId);
    if (!approval) {
      return { success: false, message: "Approval request not found." };
    }

    const timestamp = createTimestamp();
    setState((current) => ({
      ...current,
      approvals: current.approvals.map((record) =>
        record.id === approvalId
          ? {
              ...record,
              status: payload.status,
              approverId: context.userId,
              currentNote: payload.note?.trim(),
              updatedAt: timestamp,
              history: [
                ...record.history,
                {
                  id: createId("approval-history"),
                  action: payload.status,
                  actorUserId: context.userId,
                  actorRole: context.role,
                  note: payload.note?.trim(),
                  createdAt: timestamp
                }
              ]
            }
          : record
      ),
      operationalAlerts: [
        {
          id: `approval-result-${approvalId}-${payload.status}`,
          workspaceId: context.workspaceId,
          type: payload.status === "approved" ? "approval_approved" : "approval_rejected",
          title: `${approval.title} ${payload.status}`,
          message: payload.note?.trim() || "Approval decision was recorded.",
          href: "/app/approvals",
          visibleToRoles: ["owner", "admin", "manager"],
          branchId: approval.branchId,
          isRead: false,
          createdAt: timestamp
        },
        ...current.operationalAlerts
      ]
    }));
    return {
      success: true,
      message: payload.status === "approved" ? "Approval granted." : "Approval rejected."
    };
  };

  const saveStockProfile = (itemId: string, payload: StockProfilePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_stock")) {
      return { success: false, message: "You do not have access to manage stock settings." };
    }

    const existing = scopedStockProfiles.find((record) => record.itemId === itemId);
    const timestamp = createTimestamp();
    const profile: StockProfile = {
      id: existing?.id || createId("stock-profile"),
      workspaceId: context.workspaceId,
      itemId,
      isTracked: payload.isTracked,
      openingQuantity: Number(payload.openingQuantity),
      reorderLevel: Number(payload.reorderLevel),
      preferredBranchId: currentBranch?.id || existing?.preferredBranchId,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp
    };

    setState((current) => ({
      ...current,
      stockProfiles: existing
        ? current.stockProfiles.map((record) => (record.id === existing.id ? profile : record))
        : [profile, ...current.stockProfiles]
    }));
    return { success: true, message: "Stock settings updated." };
  };

  const recordStockAdjustment = (itemId: string, payload: StockAdjustmentPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_stock")) {
      return { success: false, message: "You do not have access to record stock adjustments." };
    }

    if (payload.quantity <= 0) {
      return { success: false, message: "Adjustment quantity must be greater than zero." };
    }

    setState((current) => ({
      ...current,
      stockAdjustments: [
        {
          id: createId("stock-adjustment"),
          workspaceId: context.workspaceId,
          itemId,
          branchId: payload.branchId || currentBranch?.id,
          direction: payload.direction,
          quantity: Number(payload.quantity),
          reason: payload.reason.trim(),
          notes: payload.notes?.trim(),
          createdBy: context.userId,
          createdAt: createTimestamp()
        },
        ...current.stockAdjustments
      ]
    }));
    return { success: true, message: "Stock adjustment recorded." };
  };

  const saveProject = (payload: ProjectPayload, projectId?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_projects")) {
      return { success: false, message: "You do not have access to manage projects." };
    }

    const existing = scopedProjects.find((record) => record.id === projectId);
    const timestamp = createTimestamp();
    const project: ProjectJob = {
      id: projectId || createId("project"),
      workspaceId: context.workspaceId,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      customerId: payload.customerId,
      branchId: payload.branchId || currentBranch?.id,
      status: payload.status,
      notes: payload.notes?.trim(),
      budgetAmount:
        payload.budgetAmount === undefined ? undefined : Number(payload.budgetAmount),
      createdBy: existing?.createdBy || context.userId,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp
    };

    setState((current) => ({
      ...current,
      projects: existing
        ? current.projects.map((record) => (record.id === projectId ? project : record))
        : [project, ...current.projects]
    }));
    return {
      success: true,
      message: projectId ? "Project updated." : "Project created.",
      id: project.id
    };
  };

  const archiveProject = (projectId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_projects")) {
      return { success: false, message: "You do not have access to archive projects." };
    }

    setState((current) => ({
      ...current,
      projects: current.projects.map((record) =>
        record.id === projectId
          ? { ...record, status: "archived", updatedAt: createTimestamp() }
          : record
      )
    }));
    return { success: true, message: "Project archived." };
  };

  const linkRecordMeta = (
    entityType: ManagedRecordType,
    entityId: string,
    payload: { branchId?: string; projectId?: string }
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_projects")) {
      return { success: false, message: "You do not have access to link records." };
    }

    const existing = scopedRecordMeta.find(
      (record) => record.entityType === entityType && record.entityId === entityId
    );
    const timestamp = createTimestamp();
    const nextRecord: RecordMeta = {
      id: existing?.id || createId("record-meta"),
      workspaceId: context.workspaceId,
      entityType,
      entityId,
      branchId:
        payload.branchId || existing?.branchId || currentBranch?.id || getPrimaryBranch(scopedBranches, context.workspaceId)?.id,
      projectId: payload.projectId,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp
    };

    setState((current) => ({
      ...current,
      recordMeta: existing
        ? current.recordMeta.map((record) =>
            record.id === existing.id ? nextRecord : record
          )
        : [nextRecord, ...current.recordMeta]
    }));
    return { success: true, message: "Record link updated." };
  };

  const getRecordBranchId = (entityType: ManagedRecordType, entityId: string) =>
    scopedRecordMeta.find(
      (record) => record.entityType === entityType && record.entityId === entityId
    )?.branchId;

  const getRecordProjectId = (entityType: ManagedRecordType, entityId: string) =>
    scopedRecordMeta.find(
      (record) => record.entityType === entityType && record.entityId === entityId
    )?.projectId;

  const saveDocument = (payload: DocumentPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_documents")) {
      return { success: false, message: "You do not have access to manage documents." };
    }

    const document: VaultDocument = {
      id: createId("document"),
      workspaceId: context.workspaceId,
      title: payload.title.trim(),
      category: payload.category,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      sizeBytes: payload.sizeBytes,
      dataUrl: payload.dataUrl,
      linkedEntityType: payload.linkedEntityType,
      linkedEntityId: payload.linkedEntityId,
      branchId: payload.branchId || currentBranch?.id,
      projectId: payload.projectId,
      uploadedBy: context.userId,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp()
    };

    setState((current) => ({
      ...current,
      vaultDocuments: [document, ...current.vaultDocuments]
    }));
    return { success: true, message: "Document uploaded.", id: document.id };
  };

  const deleteDocument = (documentId: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_documents")) {
      return { success: false, message: "You do not have access to remove documents." };
    }

    setState((current) => ({
      ...current,
      vaultDocuments: current.vaultDocuments.filter((document) => document.id !== documentId)
    }));
    return { success: true, message: "Document removed." };
  };

  const updateTemplateSettings = (payload: TemplatePayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_templates")) {
      return { success: false, message: "You do not have access to update templates." };
    }

    const nextSettings: TemplateSettings = {
      ...templateSettings,
      workspaceId: context.workspaceId,
      invoiceStyle: payload.invoiceStyle,
      quoteStyle: payload.quoteStyle,
      receiptStyle: payload.receiptStyle,
      footerNote: payload.footerNote?.trim(),
      showLogo: payload.showLogo,
      updatedAt: createTimestamp()
    };

    setState((current) => ({
      ...current,
      templateSettings: current.templateSettings.some(
        (record) => record.workspaceId === context.workspaceId
      )
        ? current.templateSettings.map((record) =>
            record.workspaceId === context.workspaceId ? nextSettings : record
          )
        : [nextSettings, ...current.templateSettings]
    }));
    return { success: true, message: "Template settings updated." };
  };

  const markOperationalAlertRead = (alertId: string) => {
    const scopedAlert = operationalAlerts.find((alert) => alert.id === alertId);
    if (!scopedAlert || !currentWorkspace) {
      return;
    }

    setState((current) => {
      if (current.operationalAlerts.some((alert) => alert.id === alertId)) {
        return {
          ...current,
          operationalAlerts: current.operationalAlerts.map((alert) =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          )
        };
      }

      return {
        ...current,
        operationalAlerts: [{ ...scopedAlert, isRead: true }, ...current.operationalAlerts]
      };
    });
  };

  const markAllOperationalAlertsRead = () => {
    if (!currentWorkspace) {
      return;
    }

    setState((current) => {
      const existingIds = new Set(current.operationalAlerts.map((alert) => alert.id));
      const derived = operationalAlerts
        .filter((alert) => !existingIds.has(alert.id))
        .map((alert) => ({ ...alert, isRead: true }));
      return {
        ...current,
        operationalAlerts: [
          ...current.operationalAlerts.map((alert) =>
            alert.workspaceId === currentWorkspace.id ? { ...alert, isRead: true } : alert
          ),
          ...derived
        ]
      };
    });
  };

  const resetV3DemoState = () => {
    setState(seedFlowV3State);
    setCurrentBranchId("all");
  };

  const value = useMemo(
    () => ({
      isHydrated,
      currentBranchId,
      currentBranch,
      branches: scopedBranches,
      teamProfiles: scopedTeamProfiles,
      teamInvites: scopedTeamInvites,
      approvals: scopedApprovals,
      approvalCounts,
      stockProfiles: scopedStockProfiles,
      lowStockItems,
      projects: scopedProjects,
      projectSummaries,
      branchSummaries,
      cashFlowForecast,
      documents: scopedDocuments,
      templateSettings,
      operationalAlerts,
      unreadOperationalCount,
      setCurrentBranchId,
      saveBranch,
      archiveBranch,
      inviteTeamMember,
      updateTeamProfile,
      setTeamProfileStatus,
      decideApproval,
      saveStockProfile,
      recordStockAdjustment,
      saveProject,
      archiveProject,
      linkRecordMeta,
      getRecordBranchId,
      getRecordProjectId,
      saveDocument,
      deleteDocument,
      updateTemplateSettings,
      markOperationalAlertRead,
      markAllOperationalAlertsRead,
      resetV3DemoState
    }),
    [
      approvalCounts,
      branchSummaries,
      cashFlowForecast,
      currentBranch,
      currentBranchId,
      isHydrated,
      lowStockItems,
      operationalAlerts,
      projectSummaries,
      scopedApprovals,
      scopedBranches,
      scopedDocuments,
      scopedProjects,
      scopedStockProfiles,
      scopedTeamInvites,
      scopedTeamProfiles,
      templateSettings,
      unreadOperationalCount
    ]
  );

  return <FlowV3Context.Provider value={value}>{children}</FlowV3Context.Provider>;
}

export function useFlowV3() {
  const context = useContext(FlowV3Context);
  if (!context) {
    throw new Error("useFlowV3 must be used within FlowV3Provider.");
  }

  return context;
}
