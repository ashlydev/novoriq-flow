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
import { AuditLog, UserRole } from "@/lib/types";
import {
  getBranchComparisons,
  getDepartmentSummaries,
  getExecutiveSummary,
  getPermissionCoverageSummary,
  getProcurementSummary,
  mergeEnterpriseAuditLogs
} from "@/lib/v6-calculations";
import {
  createDefaultPermissionProfiles,
  createEmptyFlowV6State,
  seedFlowV6State,
  upgradeFlowV6State
} from "@/lib/v6-seed";
import { loadFlowV6State, saveFlowV6State } from "@/lib/v6-storage";
import {
  BranchControlSetting,
  ControlPolicy,
  Department,
  DepartmentMembership,
  EnterpriseModuleKey,
  EnterpriseNotification,
  EnterpriseReview,
  ExportJob,
  FlowV6State,
  PermissionAction,
  PermissionProfile
} from "@/lib/v6-types";

interface PermissionProfilePayload {
  actions: PermissionAction[];
  branchScope: PermissionProfile["branchScope"];
  departmentScope: PermissionProfile["departmentScope"];
  canViewSensitive: boolean;
}

interface DepartmentPayload {
  name: string;
  code: string;
  branchId?: string;
  managerUserId?: string;
  description?: string;
  status: Department["status"];
}

interface BranchControlPayload {
  approvalThreshold: number;
  spendLimit: number;
  riskLevel: BranchControlSetting["riskLevel"];
  notes?: string;
}

interface ControlPolicyPayload {
  module: EnterpriseModuleKey;
  eventKey: string;
  label: string;
  thresholdAmount?: number;
  branchId?: string;
  departmentId?: string;
  requiresReview: boolean;
  autoEscalate: boolean;
  notes?: string;
}

interface ReviewPayload {
  entityType: EnterpriseReview["entityType"];
  entityId: string;
  module: EnterpriseModuleKey;
  title: string;
  description: string;
  branchId?: string;
  departmentId?: string;
  amount?: number;
  reason?: string;
  controlPolicyId?: string;
}

interface ReviewDecisionPayload {
  status: "approved" | "rejected" | "returned";
  note?: string;
}

interface ExportJobPayload {
  module: EnterpriseModuleKey;
  title: string;
  format: ExportJob["format"];
  filtersSummary?: string;
}

interface FlowV6ContextValue {
  isHydrated: boolean;
  permissionProfiles: PermissionProfile[];
  departments: Department[];
  departmentMemberships: DepartmentMembership[];
  reviews: EnterpriseReview[];
  controlPolicies: ControlPolicy[];
  branchControlSettings: BranchControlSetting[];
  exportJobs: ExportJob[];
  enterpriseNotifications: EnterpriseNotification[];
  unreadEnterpriseCount: number;
  branchComparisons: ReturnType<typeof getBranchComparisons>;
  departmentSummaries: ReturnType<typeof getDepartmentSummaries>;
  procurementSummary: ReturnType<typeof getProcurementSummary>;
  executiveSummary: ReturnType<typeof getExecutiveSummary>;
  permissionCoverage: ReturnType<typeof getPermissionCoverageSummary>;
  enterpriseAuditLogs: AuditLog[];
  getPermissionProfile: (
    role: UserRole,
    module: EnterpriseModuleKey
  ) => PermissionProfile | undefined;
  canAccessModule: (
    module: EnterpriseModuleKey,
    action?: PermissionAction
  ) => boolean;
  getDepartmentForProfile: (profileId: string) => Department | undefined;
  getAccessibleBranchIds: () => string[];
  savePermissionProfile: (
    role: UserRole,
    module: EnterpriseModuleKey,
    payload: PermissionProfilePayload
  ) => { success: boolean; message: string };
  saveDepartment: (
    payload: DepartmentPayload,
    departmentId?: string
  ) => { success: boolean; message: string; id?: string };
  assignProfileToDepartment: (
    profileId: string,
    departmentId: string,
    title?: string,
    role?: DepartmentMembership["role"]
  ) => { success: boolean; message: string };
  saveBranchControlSetting: (
    branchId: string,
    payload: BranchControlPayload
  ) => { success: boolean; message: string };
  saveControlPolicy: (
    payload: ControlPolicyPayload,
    policyId?: string
  ) => { success: boolean; message: string; id?: string };
  createReview: (payload: ReviewPayload) => { success: boolean; message: string; id?: string };
  decideReview: (
    reviewId: string,
    payload: ReviewDecisionPayload
  ) => { success: boolean; message: string };
  createExportJob: (
    payload: ExportJobPayload
  ) => { success: boolean; message: string; id?: string };
  markEnterpriseNotificationRead: (notificationId: string) => void;
  markAllEnterpriseNotificationsRead: () => void;
  resetV6DemoState: () => void;
}

const FlowV6Context = createContext<FlowV6ContextValue | undefined>(undefined);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createTimestamp() {
  return new Date().toISOString();
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
    id: createId("audit-v6"),
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

export function FlowV6Provider({ children }: { children: React.ReactNode }) {
  const { canAccess, currentRole, currentUser, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    approvalCounts,
    approvals,
    branchSummaries,
    branches,
    currentBranchId,
    operationalAlerts,
    teamProfiles
  } = useFlowV3();
  const { networkSummary, purchaseOrders } = useFlowV4();
  const {
    financeAuditLogs,
    financeSummary,
    financialHealth,
    supplierCreditSummary
  } = useFlowV5();
  const [state, setState] = useState<FlowV6State>(createEmptyFlowV6State);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadFlowV6State();
    setState(upgradeFlowV6State(loaded || seedFlowV6State));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveFlowV6State(state);
  }, [isHydrated, state]);

  useEffect(() => {
    if (!isHydrated || !currentWorkspace || !currentUser) {
      return;
    }

    setState((current) => {
      let changed = false;
      let nextState = current;
      const existingProfiles = current.permissionProfiles.filter(
        (profile) => profile.workspaceId === currentWorkspace.id
      );

      if (!existingProfiles.length) {
        changed = true;
        nextState = {
          ...nextState,
          permissionProfiles: [
            ...createDefaultPermissionProfiles(currentWorkspace.id, currentUser.id),
            ...nextState.permissionProfiles
          ]
        };
      }

      const missingBranchControls = branches.filter(
        (branch) =>
          branch.status === "active" &&
          !nextState.branchControlSettings.some(
            (setting) =>
              setting.workspaceId === currentWorkspace.id && setting.branchId === branch.id
          )
      );

      if (missingBranchControls.length) {
        changed = true;
        nextState = {
          ...nextState,
          branchControlSettings: [
            ...missingBranchControls.map((branch) => ({
              id: createId("branch-control"),
              workspaceId: currentWorkspace.id,
              branchId: branch.id,
              approvalThreshold:
                workspaceData.settings?.significantExpenseThreshold || 500,
              spendLimit: 5000,
              riskLevel: "stable" as const,
              notes: `${branch.name} enterprise controls auto-created.`,
              updatedBy: currentUser.id,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            })),
            ...nextState.branchControlSettings
          ]
        };
      }

      const departmentNames = Array.from(
        new Set(teamProfiles.map((profile) => profile.department).filter(Boolean))
      ) as string[];
      const missingDepartments = departmentNames.filter(
        (name) =>
          !nextState.departments.some(
            (department) =>
              department.workspaceId === currentWorkspace.id &&
              department.name.toLowerCase() === name.toLowerCase()
          )
      );

      if (missingDepartments.length) {
        changed = true;
        nextState = {
          ...nextState,
          departments: [
            ...missingDepartments.map((name) => ({
              id: createId("department"),
              workspaceId: currentWorkspace.id,
              name,
              code: name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "TEAM",
              status: "active" as const,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            })),
            ...nextState.departments
          ]
        };
      }

      const departmentsForWorkspace = nextState.departments.filter(
        (department) => department.workspaceId === currentWorkspace.id
      );
      const missingMemberships = teamProfiles.filter((profile) => {
        const matchedDepartment = departmentsForWorkspace.find(
          (department) =>
            department.name.toLowerCase() === (profile.department || "").toLowerCase()
        );
        if (!matchedDepartment) {
          return false;
        }

        return !nextState.departmentMemberships.some(
          (membership) =>
            membership.workspaceId === currentWorkspace.id &&
            (membership.profileId === profile.id || membership.userId === profile.userId)
        );
      });

      if (missingMemberships.length) {
        changed = true;
        nextState = {
          ...nextState,
          departmentMemberships: [
            ...missingMemberships.map((profile) => {
              const matchedDepartment = departmentsForWorkspace.find(
                (department) =>
                  department.name.toLowerCase() === (profile.department || "").toLowerCase()
              );

              return {
                id: createId("department-member"),
                workspaceId: currentWorkspace.id,
                departmentId: matchedDepartment?.id || "",
                profileId: profile.id,
                userId: profile.userId,
                title: profile.role === "manager" || profile.role === "owner" ? "Lead" : "Member",
                role:
                  profile.role === "manager" || profile.role === "owner" || profile.role === "admin"
                    ? ("lead" as const)
                    : ("member" as const),
                createdAt: createTimestamp(),
                updatedAt: createTimestamp()
              };
            }),
            ...nextState.departmentMemberships
          ]
        };
      }

      return changed ? nextState : current;
    });
  }, [
    branches,
    currentUser,
    currentWorkspace,
    isHydrated,
    teamProfiles,
    workspaceData.settings?.significantExpenseThreshold
  ]);

  function ensureContext() {
    if (!currentWorkspace || !currentUser || !currentRole) {
      return { ok: false as const, message: "Enterprise context is not ready." };
    }

    return {
      ok: true as const,
      workspaceId: currentWorkspace.id,
      userId: currentUser.id,
      role: currentRole
    };
  }

  const permissionProfiles = useMemo(
    () =>
      currentWorkspace
        ? state.permissionProfiles.filter((profile) => profile.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.permissionProfiles]
  );
  const departments = useMemo(
    () =>
      currentWorkspace
        ? state.departments.filter((department) => department.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.departments]
  );
  const departmentMemberships = useMemo(
    () =>
      currentWorkspace
        ? state.departmentMemberships.filter(
            (membership) => membership.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.departmentMemberships]
  );
  const reviews = useMemo(
    () =>
      currentWorkspace
        ? state.reviews.filter((review) => review.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.reviews]
  );
  const controlPolicies = useMemo(
    () =>
      currentWorkspace
        ? state.controlPolicies.filter((policy) => policy.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.controlPolicies]
  );
  const branchControlSettings = useMemo(
    () =>
      currentWorkspace
        ? state.branchControlSettings.filter(
            (setting) => setting.workspaceId === currentWorkspace.id
          )
        : [],
    [currentWorkspace, state.branchControlSettings]
  );
  const exportJobs = useMemo(
    () =>
      currentWorkspace
        ? state.exportJobs.filter((job) => job.workspaceId === currentWorkspace.id)
        : [],
    [currentWorkspace, state.exportJobs]
  );
  const enterpriseNotifications = useMemo(
    () =>
      currentWorkspace
        ? state.enterpriseNotifications.filter(
            (notification) =>
              notification.workspaceId === currentWorkspace.id &&
              (!notification.visibleToRoles ||
                !currentRole ||
                notification.visibleToRoles.includes(currentRole))
          )
        : [],
    [currentRole, currentWorkspace, state.enterpriseNotifications]
  );
  const unreadEnterpriseCount = enterpriseNotifications.filter(
    (notification) => !notification.isRead
  ).length;

  const currentProfile = teamProfiles.find((profile) => profile.userId === currentUser?.id);
  const getAccessibleBranchIds = () => {
    const activeBranchIds = branches
      .filter((branch) => branch.status === "active")
      .map((branch) => branch.id);
    if (currentRole === "owner" || currentRole === "admin" || !currentProfile) {
      return activeBranchIds;
    }

    const scopedDepartmentIds = departmentMemberships
      .filter(
        (membership) =>
          membership.profileId === currentProfile.id || membership.userId === currentProfile.userId
      )
      .map((membership) => membership.departmentId);
    const scopedBranchIds = departments
      .filter(
        (department) =>
          scopedDepartmentIds.includes(department.id) && department.branchId
      )
      .map((department) => department.branchId as string);

    return scopedBranchIds.length ? scopedBranchIds : activeBranchIds;
  };

  const accessibleBranchIds = getAccessibleBranchIds();
  const branchComparisons = useMemo(
    () =>
      getBranchComparisons({
        branches,
        branchSummaries,
        branchControlSettings,
        approvals,
        reviews,
        branchIds: accessibleBranchIds
      }),
    [accessibleBranchIds, approvals, branchControlSettings, branchSummaries, branches, reviews]
  );
  const departmentSummaries = useMemo(
    () =>
      getDepartmentSummaries({
        departments,
        memberships: departmentMemberships,
        teamProfiles,
        reviews,
        branchIds: accessibleBranchIds
      }),
    [accessibleBranchIds, departments, departmentMemberships, reviews, teamProfiles]
  );
  const procurementSummary = useMemo(
    () =>
      getProcurementSummary({
        purchases: workspaceData.purchases,
        controlPolicies,
        reviews,
        supplierCreditSummary
      }),
    [controlPolicies, reviews, supplierCreditSummary, workspaceData.purchases]
  );
  const executiveSummary = useMemo(
    () =>
      getExecutiveSummary({
        branchComparisons,
        departmentSummaries,
        approvalCounts,
        financeSummary,
        reviews,
        exportJobs,
        operationalAlerts,
        financialHealth
      }),
    [
      approvalCounts,
      branchComparisons,
      departmentSummaries,
      exportJobs,
      financeSummary,
      financialHealth,
      operationalAlerts,
      reviews
    ]
  );
  const permissionCoverage = useMemo(
    () => getPermissionCoverageSummary(permissionProfiles),
    [permissionProfiles]
  );
  const enterpriseAuditLogs = useMemo(
    () =>
      mergeEnterpriseAuditLogs(
        financeAuditLogs,
        currentWorkspace
          ? state.enterpriseAuditLogs.filter((log) => log.workspaceId === currentWorkspace.id)
          : []
      ),
    [currentWorkspace, financeAuditLogs, state.enterpriseAuditLogs]
  );

  function getPermissionProfile(role: UserRole, module: EnterpriseModuleKey) {
    return permissionProfiles.find(
      (profile) => profile.role === role && profile.module === module
    );
  }

  function canAccessModule(
    module: EnterpriseModuleKey,
    action: PermissionAction = "view"
  ) {
    if (!currentRole) {
      return false;
    }

    const profile = getPermissionProfile(currentRole, module);
    if (!profile) {
      return false;
    }

    if (profile.actions.includes(action)) {
      return true;
    }

    if (action === "approve" && profile.actions.includes("manage_sensitive")) {
      return true;
    }

    if (action === "export" && profile.actions.includes("manage_sensitive")) {
      return true;
    }

    return false;
  }

  function getDepartmentForProfile(profileId: string) {
    const membership = departmentMemberships.find(
      (entry) => entry.profileId === profileId
    );
    return departments.find((department) => department.id === membership?.departmentId);
  }

  const savePermissionProfile = (
    role: UserRole,
    module: EnterpriseModuleKey,
    payload: PermissionProfilePayload
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_permissions")) {
      return { success: false, message: "You do not have access to manage permissions." };
    }

    const existing = getPermissionProfile(role, module);
    const profileId = existing?.id || createId("permission-profile");
    setState((current) => {
      const auditLog = createAuditLog({
        workspaceId: context.workspaceId,
        entityType: "permission_profile",
        entityId: profileId,
        action: existing ? "edited" : "created",
        actorUserId: context.userId,
        actorRole: context.role,
        title: existing ? "Permission profile updated" : "Permission profile created",
        summary: `${role} access for ${module} was updated.`,
        metadata: {
          actions: payload.actions.join(", "),
          branchScope: payload.branchScope,
          departmentScope: payload.departmentScope,
          sensitive: payload.canViewSensitive
        }
      });
      return {
        ...current,
        permissionProfiles: existing
          ? current.permissionProfiles.map((profile) =>
              profile.id === existing.id
                ? {
                    ...profile,
                    ...payload,
                    updatedBy: context.userId,
                    updatedAt: createTimestamp()
                  }
                : profile
            )
          : [
              {
                id: profileId,
                workspaceId: context.workspaceId,
                role,
                module,
                ...payload,
                updatedBy: context.userId,
                updatedAt: createTimestamp()
              },
              ...current.permissionProfiles
            ],
        enterpriseNotifications: [
          {
            id: createId("enterprise-note"),
            workspaceId: context.workspaceId,
            type: "permission_changed",
            title: "Permissions changed",
            message: `${role} access for ${module} was updated.`,
            href: "/app/permissions",
            visibleToRoles: ["owner", "admin"],
            isRead: false,
            createdAt: createTimestamp()
          },
          ...current.enterpriseNotifications
        ],
        enterpriseAuditLogs: [auditLog, ...current.enterpriseAuditLogs]
      };
    });

    return { success: true, message: "Permission profile updated." };
  };

  const saveDepartment = (payload: DepartmentPayload, departmentId?: string) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_departments")) {
      return { success: false, message: "You do not have access to manage departments." };
    }

    const existing = departments.find((department) => department.id === departmentId);
    const id = existing?.id || createId("department");
    setState((current) => ({
      ...current,
      departments: existing
        ? current.departments.map((department) =>
            department.id === existing.id
              ? { ...department, ...payload, updatedAt: createTimestamp() }
              : department
          )
        : [
            {
              id,
              workspaceId: context.workspaceId,
              ...payload,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.departments
          ],
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "department",
          entityId: id,
          action: existing ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: existing ? "Department updated" : "Department created",
          summary: `${payload.name} department was ${existing ? "updated" : "created"}.`
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return {
      success: true,
      message: existing ? "Department updated." : "Department created.",
      id
    };
  };

  const assignProfileToDepartment = (
    profileId: string,
    departmentId: string,
    title?: string,
    role: DepartmentMembership["role"] = "member"
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_departments")) {
      return { success: false, message: "You do not have access to assign departments." };
    }

    const profile = teamProfiles.find((entry) => entry.id === profileId);
    const existing = departmentMemberships.find(
      (membership) => membership.profileId === profileId
    );
    if (!profile) {
      return { success: false, message: "Team profile not found." };
    }

    setState((current) => ({
      ...current,
      departmentMemberships: existing
        ? current.departmentMemberships.map((membership) =>
            membership.id === existing.id
              ? {
                  ...membership,
                  departmentId,
                  title,
                  role,
                  updatedAt: createTimestamp()
                }
              : membership
          )
        : [
            {
              id: createId("department-member"),
              workspaceId: context.workspaceId,
              departmentId,
              profileId,
              userId: profile.userId,
              title,
              role,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.departmentMemberships
          ],
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "department",
          entityId: departmentId,
          action: "assigned",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Department assignment updated",
          summary: `${profile.fullName} was assigned to a department.`,
          metadata: {
            profileId,
            title: title || "",
            role
          }
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return { success: true, message: "Department assignment updated." };
  };

  const saveBranchControlSetting = (
    branchId: string,
    payload: BranchControlPayload
  ) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_branches")) {
      return { success: false, message: "You do not have access to manage branch controls." };
    }

    const existing = branchControlSettings.find((setting) => setting.branchId === branchId);
    const id = existing?.id || createId("branch-control");
    setState((current) => ({
      ...current,
      branchControlSettings: existing
        ? current.branchControlSettings.map((setting) =>
            setting.id === existing.id
              ? {
                  ...setting,
                  ...payload,
                  updatedBy: context.userId,
                  updatedAt: createTimestamp()
                }
              : setting
          )
        : [
            {
              id,
              workspaceId: context.workspaceId,
              branchId,
              ...payload,
              updatedBy: context.userId,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.branchControlSettings
          ],
      enterpriseNotifications:
        payload.riskLevel === "risk"
          ? [
              {
                id: createId("enterprise-note"),
                workspaceId: context.workspaceId,
                type: "branch_risk_alert",
                title: "Branch risk alert",
                message: "A branch control profile is now marked as risk.",
                href: "/app/branch-comparison",
                visibleToRoles: ["owner", "admin", "manager"],
                branchId,
                isRead: false,
                createdAt: createTimestamp()
              },
              ...current.enterpriseNotifications
            ]
          : current.enterpriseNotifications,
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "branch_control",
          entityId: id,
          action: existing ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Branch control updated",
          summary: "Branch threshold and risk settings were updated.",
          metadata: {
            approvalThreshold: payload.approvalThreshold,
            spendLimit: payload.spendLimit,
            riskLevel: payload.riskLevel
          }
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return { success: true, message: "Branch control updated." };
  };

  const saveControlPolicy = (payload: ControlPolicyPayload, policyId?: string) => {
    const context = ensureContext();
    if (
      !context.ok ||
      (!canAccess("manage_procurement_controls") && !canAccess("manage_settings"))
    ) {
      return { success: false, message: "You do not have access to manage control policies." };
    }

    const existing = controlPolicies.find((policy) => policy.id === policyId);
    const id = existing?.id || createId("control-policy");
    setState((current) => ({
      ...current,
      controlPolicies: existing
        ? current.controlPolicies.map((policy) =>
            policy.id === existing.id
              ? {
                  ...policy,
                  ...payload,
                  updatedBy: context.userId,
                  updatedAt: createTimestamp()
                }
              : policy
          )
        : [
            {
              id,
              workspaceId: context.workspaceId,
              ...payload,
              updatedBy: context.userId,
              createdAt: createTimestamp(),
              updatedAt: createTimestamp()
            },
            ...current.controlPolicies
          ],
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "control_policy",
          entityId: id,
          action: existing ? "edited" : "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Control policy updated",
          summary: `${payload.label} was ${existing ? "updated" : "created"}.`,
          metadata: {
            module: payload.module,
            eventKey: payload.eventKey,
            threshold: payload.thresholdAmount || 0
          }
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return {
      success: true,
      message: existing ? "Control policy updated." : "Control policy created.",
      id
    };
  };

  const createReview = (payload: ReviewPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccessModule(payload.module, "create")) {
      return { success: false, message: "You do not have access to submit this review." };
    }

    const id = createId("review");
    setState((current) => ({
      ...current,
      reviews: [
        {
          id,
          workspaceId: context.workspaceId,
          ...payload,
          status: "pending_review",
          requestedBy: context.userId,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp(),
          history: [
            {
              id: createId("review-history"),
              action: "submitted",
              actorUserId: context.userId,
              actorRole: context.role,
              note: payload.reason,
              createdAt: createTimestamp()
            }
          ]
        },
        ...current.reviews
      ],
      enterpriseNotifications: [
        {
          id: createId("enterprise-note"),
          workspaceId: context.workspaceId,
          type: "approval_pending",
          title: "Approval pending",
          message: `${payload.title} is waiting for maker-checker review.`,
          href: "/app/reviews",
          visibleToRoles: ["owner", "admin", "manager"],
          branchId: payload.branchId,
          departmentId: payload.departmentId,
          isRead: false,
          createdAt: createTimestamp()
        },
        ...current.enterpriseNotifications
      ],
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "review_request",
          entityId: id,
          action: "created",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Maker-checker review submitted",
          summary: payload.title,
          metadata: {
            module: payload.module,
            amount: payload.amount || 0,
            entityType: payload.entityType
          }
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return { success: true, message: "Review submitted for approval.", id };
  };

  const decideReview = (reviewId: string, payload: ReviewDecisionPayload) => {
    const context = ensureContext();
    if (!context.ok || !canAccess("manage_approvals")) {
      return { success: false, message: "You do not have access to review this queue." };
    }

    const review = reviews.find((entry) => entry.id === reviewId);
    if (!review) {
      return { success: false, message: "Review request not found." };
    }

    setState((current) => ({
      ...current,
      reviews: current.reviews.map((entry) =>
        entry.id === review.id
          ? {
              ...entry,
              status: payload.status,
              reviewerId: context.userId,
              updatedAt: createTimestamp(),
              history: [
                ...entry.history,
                {
                  id: createId("review-history"),
                  action:
                    payload.status === "approved"
                      ? "approved"
                      : payload.status === "rejected"
                        ? "rejected"
                        : "returned",
                  actorUserId: context.userId,
                  actorRole: context.role,
                  note: payload.note,
                  createdAt: createTimestamp()
                }
              ]
            }
          : entry
      ),
      enterpriseNotifications: [
        {
          id: createId("enterprise-note"),
          workspaceId: context.workspaceId,
          type:
            payload.status === "approved"
              ? "operational_kpi_warning"
              : payload.status === "rejected"
                ? "approval_rejected"
                : "procurement_issue_alert",
          title:
            payload.status === "approved"
              ? "Review approved"
              : payload.status === "rejected"
                ? "Review rejected"
                : "Review returned",
          message: payload.note || `${review.title} moved to ${payload.status}.`,
          href: "/app/reviews",
          visibleToRoles: ["owner", "admin", "manager"],
          branchId: review.branchId,
          departmentId: review.departmentId,
          isRead: false,
          createdAt: createTimestamp()
        },
        ...current.enterpriseNotifications
      ],
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "review_request",
          entityId: review.id,
          action:
            payload.status === "approved"
              ? "accepted"
              : payload.status === "rejected"
                ? "rejected"
                : "returned",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Maker-checker review updated",
          summary: `${review.title} is now ${payload.status}.`,
          metadata: {
            note: payload.note || "",
            module: review.module
          }
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return { success: true, message: "Review decision recorded." };
  };

  const createExportJob = (payload: ExportJobPayload) => {
    const context = ensureContext();
    if (
      !context.ok ||
      (!canAccess("manage_export_jobs") && !canAccessModule(payload.module, "export"))
    ) {
      return { success: false, message: "You do not have access to create exports." };
    }

    const id = createId("export-job");
    setState((current) => ({
      ...current,
      exportJobs: [
        {
          id,
          workspaceId: context.workspaceId,
          ...payload,
          status: payload.format === "pdf" ? "queued" : "ready",
          createdBy: context.userId,
          downloadLabel:
            payload.format === "pdf"
              ? undefined
              : `${payload.title.toLowerCase().replace(/\s+/g, "-")}.${payload.format}`,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp()
        },
        ...current.exportJobs
      ],
      enterpriseNotifications: [
        {
          id: createId("enterprise-note"),
          workspaceId: context.workspaceId,
          type: "system_admin_alert",
          title: "Export job created",
          message: `${payload.title} export was queued for delivery.`,
          href: "/app/exports",
          visibleToRoles: ["owner", "admin", "manager"],
          isRead: false,
          createdAt: createTimestamp()
        },
        ...current.enterpriseNotifications
      ],
      enterpriseAuditLogs: [
        createAuditLog({
          workspaceId: context.workspaceId,
          entityType: "export_job",
          entityId: id,
          action: "queued",
          actorUserId: context.userId,
          actorRole: context.role,
          title: "Export job queued",
          summary: `${payload.title} export was created.`,
          metadata: {
            format: payload.format,
            module: payload.module,
            filters: payload.filtersSummary || ""
          }
        }),
        ...current.enterpriseAuditLogs
      ]
    }));

    return {
      success: true,
      message: "Export job created.",
      id
    };
  };

  const markEnterpriseNotificationRead = (notificationId: string) => {
    setState((current) => ({
      ...current,
      enterpriseNotifications: current.enterpriseNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const markAllEnterpriseNotificationsRead = () => {
    if (!currentWorkspace) {
      return;
    }

    setState((current) => ({
      ...current,
      enterpriseNotifications: current.enterpriseNotifications.map((notification) =>
        notification.workspaceId === currentWorkspace.id
          ? { ...notification, isRead: true }
          : notification
      )
    }));
  };

  const resetV6DemoState = () => {
    setState(seedFlowV6State);
  };

  return (
    <FlowV6Context.Provider
      value={{
        isHydrated,
        permissionProfiles,
        departments,
        departmentMemberships,
        reviews,
        controlPolicies,
        branchControlSettings,
        exportJobs,
        enterpriseNotifications,
        unreadEnterpriseCount,
        branchComparisons,
        departmentSummaries,
        procurementSummary,
        executiveSummary,
        permissionCoverage,
        enterpriseAuditLogs,
        getPermissionProfile,
        canAccessModule,
        getDepartmentForProfile,
        getAccessibleBranchIds,
        savePermissionProfile,
        saveDepartment,
        assignProfileToDepartment,
        saveBranchControlSetting,
        saveControlPolicy,
        createReview,
        decideReview,
        createExportJob,
        markEnterpriseNotificationRead,
        markAllEnterpriseNotificationsRead,
        resetV6DemoState
      }}
    >
      {children}
    </FlowV6Context.Provider>
  );
}

export function useFlowV6() {
  const context = useContext(FlowV6Context);
  if (!context) {
    throw new Error("useFlowV6 must be used within FlowV6Provider.");
  }

  return context;
}
