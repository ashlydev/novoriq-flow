import { getPurchaseTotal } from "@/lib/calculations";
import { AuditLog, Purchase } from "@/lib/types";
import { ApprovalRequest, Branch, TeamMemberProfile } from "@/lib/v3-types";
import { ExportJob, Department, DepartmentMembership, EnterpriseReview, PermissionProfile, BranchControlSetting, ControlPolicy } from "@/lib/v6-types";

function sortByDateDesc<T extends { createdAt: string }>(rows: T[]) {
  return [...rows].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function getBranchComparisons(params: {
  branches: Branch[];
  branchSummaries: Array<{
    branch: Branch;
    revenue: number;
    receivables: number;
    payables: number;
    expenses: number;
  }>;
  branchControlSettings: BranchControlSetting[];
  approvals: ApprovalRequest[];
  reviews: EnterpriseReview[];
  branchIds?: string[];
}) {
  const filteredSummaries = params.branchSummaries.filter((summary) =>
    params.branchIds?.length ? params.branchIds.includes(summary.branch.id) : true
  );

  return filteredSummaries.map((summary) => {
    const control = params.branchControlSettings.find(
      (setting) => setting.branchId === summary.branch.id
    );
    const pendingApprovals = params.approvals.filter(
      (approval) => approval.branchId === summary.branch.id && approval.status === "pending"
    ).length;
    const pendingReviews = params.reviews.filter(
      (review) => review.branchId === summary.branch.id && review.status === "pending_review"
    ).length;
    const returnedReviews = params.reviews.filter(
      (review) => review.branchId === summary.branch.id && review.status === "returned"
    ).length;
    const riskScore =
      (control?.riskLevel === "risk" ? 3 : control?.riskLevel === "watch" ? 2 : 1) +
      (pendingApprovals > 0 ? 1 : 0) +
      (pendingReviews > 0 ? 1 : 0) +
      (summary.payables > summary.revenue * 0.5 ? 1 : 0);

    return {
      ...summary,
      control,
      pendingApprovals,
      pendingReviews,
      returnedReviews,
      riskScore,
      riskLabel:
        riskScore >= 5
          ? "High control attention"
          : riskScore >= 3
            ? "Watch closely"
            : "Stable"
    };
  });
}

export function getDepartmentSummaries(params: {
  departments: Department[];
  memberships: DepartmentMembership[];
  teamProfiles: TeamMemberProfile[];
  reviews: EnterpriseReview[];
  branchIds?: string[];
}) {
  return params.departments
    .filter(
      (department) =>
        department.status === "active" &&
        (!params.branchIds?.length ||
          !department.branchId ||
          params.branchIds.includes(department.branchId))
    )
    .map((department) => {
      const memberships = params.memberships.filter(
        (membership) => membership.departmentId === department.id
      );
      const memberProfiles = memberships
        .map((membership) =>
          params.teamProfiles.find(
            (profile) =>
              profile.id === membership.profileId || profile.userId === membership.userId
          )
        )
        .filter(Boolean) as TeamMemberProfile[];
      const lead = memberProfiles.find((profile) =>
        memberships.some(
          (membership) =>
            membership.departmentId === department.id &&
            membership.role === "lead" &&
            (membership.profileId === profile.id || membership.userId === profile.userId)
        )
      );
      const pendingReviews = params.reviews.filter(
        (review) => review.departmentId === department.id && review.status === "pending_review"
      ).length;
      const returnedReviews = params.reviews.filter(
        (review) => review.departmentId === department.id && review.status === "returned"
      ).length;

      return {
        department,
        lead,
        memberCount: memberProfiles.length,
        activeMemberCount: memberProfiles.filter((profile) => profile.status === "active").length,
        pendingReviews,
        returnedReviews
      };
    });
}

export function getProcurementSummary(params: {
  purchases: Purchase[];
  controlPolicies: ControlPolicy[];
  reviews: EnterpriseReview[];
  supplierCreditSummary: {
    totalOutstanding: number;
    totalOverdue: number;
    pressureCount: number;
  };
}) {
  const purchasePolicies = params.controlPolicies.filter(
    (policy) => policy.module === "purchases" && policy.requiresReview
  );
  const thresholds = purchasePolicies
    .map((policy) => policy.thresholdAmount || 0)
    .filter(Boolean);
  const reviewThreshold = thresholds.length ? Math.min(...thresholds) : 0;
  const highValuePurchases = params.purchases.filter(
    (purchase) => getPurchaseTotal(purchase) >= reviewThreshold && reviewThreshold > 0
  );
  const pendingReviews = params.reviews.filter(
    (review) => review.module === "purchases" && review.status === "pending_review"
  );
  const returnedReviews = params.reviews.filter(
    (review) => review.module === "purchases" && review.status === "returned"
  );

  return {
    reviewThreshold,
    highValuePurchases,
    pendingReviewCount: pendingReviews.length,
    returnedReviewCount: returnedReviews.length,
    supplierPressureCount: params.supplierCreditSummary.pressureCount,
    supplierOutstanding: params.supplierCreditSummary.totalOutstanding,
    supplierOverdue: params.supplierCreditSummary.totalOverdue
  };
}

export function getPermissionCoverageSummary(profiles: PermissionProfile[]) {
  return profiles.reduce<Record<string, number>>((accumulator, profile) => {
    accumulator[profile.role] = (accumulator[profile.role] || 0) + profile.actions.length;
    return accumulator;
  }, {});
}

export function getExecutiveSummary(params: {
  branchComparisons: ReturnType<typeof getBranchComparisons>;
  departmentSummaries: ReturnType<typeof getDepartmentSummaries>;
  approvalCounts: { pending: number; approved: number; rejected: number };
  financeSummary: {
    openPaymentRequests: number;
    unreconciledCount: number;
    mismatchCount: number;
  };
  reviews: EnterpriseReview[];
  exportJobs: ExportJob[];
  operationalAlerts: Array<{ isRead: boolean }>;
  financialHealth: { capitalReadinessScore: number };
}) {
  const pendingReviews = params.reviews.filter(
    (review) => review.status === "pending_review"
  ).length;
  const riskyBranches = params.branchComparisons.filter(
    (row) => row.control?.riskLevel === "risk" || row.riskScore >= 5
  ).length;
  const returnedReviews = params.reviews.filter(
    (review) => review.status === "returned"
  ).length;
  const readyExports = params.exportJobs.filter((job) => job.status === "ready").length;

  return {
    pendingReviews,
    returnedReviews,
    riskyBranches,
    departmentCount: params.departmentSummaries.length,
    delayedApprovals: params.approvalCounts.pending,
    openCollections: params.financeSummary.openPaymentRequests,
    financeMismatchCount: params.financeSummary.mismatchCount,
    unreconciledCount: params.financeSummary.unreconciledCount,
    operationalWarningCount: params.operationalAlerts.filter((alert) => !alert.isRead).length,
    readyExports,
    readinessScore: params.financialHealth.capitalReadinessScore
  };
}

export function mergeEnterpriseAuditLogs(
  baseLogs: AuditLog[],
  enterpriseLogs: AuditLog[]
) {
  return sortByDateDesc([...baseLogs, ...enterpriseLogs]);
}
