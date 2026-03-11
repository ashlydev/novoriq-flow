"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function ExecutivePage() {
  const { canAccess } = useBusinessOS();
  const {
    branchComparisons,
    departmentSummaries,
    executiveSummary,
    exportJobs,
    reviews
  } = useFlowV6();
  const { predictiveInsights, recommendations } = useFlowV7();

  if (!canAccess("view_executive_dashboard")) {
    return (
      <AccessDeniedState description="Executive visibility is limited to owner, admin, and selected manager roles." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Executive"
        title="Executive visibility with tighter controls."
        description="Compare branches, watch approvals, and track cross-module risk without turning the workspace into a bloated ERP."
        action={
          <div className="button-row">
            <Link className="button button-primary" href="/app/reviews">
              Review queue
            </Link>
            <Link className="button button-secondary" href="/app/branch-comparison">
              Branch comparison
            </Link>
            <Link className="button button-secondary" href="/app/exports">
              Exports
            </Link>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Pending reviews"
          tone={executiveSummary.pendingReviews ? "warning" : "success"}
          value={String(executiveSummary.pendingReviews)}
        />
        <MetricCard
          label="Risky branches"
          tone={executiveSummary.riskyBranches ? "danger" : "success"}
          value={String(executiveSummary.riskyBranches)}
        />
        <MetricCard
          label="Delayed approvals"
          tone={executiveSummary.delayedApprovals ? "warning" : "success"}
          value={String(executiveSummary.delayedApprovals)}
        />
        <MetricCard
          label="Finance readiness"
          value={`${executiveSummary.readinessScore}/100`}
        />
        <MetricCard
          label="Ready exports"
          value={String(executiveSummary.readyExports)}
        />
        <MetricCard
          label="Predictive warnings"
          value={String(predictiveInsights.filter((entry) => entry.tone !== "success").length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Branch performance comparison</p>
          {branchComparisons.map((row) => (
            <div className="list-row" key={row.branch.id}>
              <div className="list-title">
                <div>
                  <strong>{row.branch.name}</strong>
                  <p>
                    Revenue {row.revenue.toFixed(2)} · Receivables {row.receivables.toFixed(2)} ·
                    Payables {row.payables.toFixed(2)}
                  </p>
                </div>
                <StatusBadge
                  label={row.riskLabel}
                  tone={
                    row.control?.riskLevel === "risk"
                      ? "danger"
                      : row.control?.riskLevel === "watch"
                        ? "warning"
                        : "success"
                  }
                />
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>Pending reviews</span>
                  <strong>{row.pendingReviews}</strong>
                </div>
                <div className="info-pair">
                  <span>Pending approvals</span>
                  <strong>{row.pendingApprovals}</strong>
                </div>
                <div className="info-pair">
                  <span>Spend limit</span>
                  <strong>{row.control?.spendLimit || 0}</strong>
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Department performance</p>
          {departmentSummaries.map((row) => (
            <div className="list-row" key={row.department.id}>
              <div className="list-title">
                <div>
                  <strong>{row.department.name}</strong>
                  <p>{row.department.description || "No department summary set."}</p>
                </div>
                <StatusBadge
                  label={row.lead?.fullName || "No lead"}
                  tone="muted"
                />
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>Members</span>
                  <strong>{row.memberCount}</strong>
                </div>
                <div className="info-pair">
                  <span>Pending reviews</span>
                  <strong>{row.pendingReviews}</strong>
                </div>
                <div className="info-pair">
                  <span>Returned</span>
                  <strong>{row.returnedReviews}</strong>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Executive recommendations</p>
          {recommendations.slice(0, 5).map((recommendation) => (
            <div className="list-row" key={recommendation.id}>
              <div className="list-title">
                <div>
                  <strong>{recommendation.title}</strong>
                  <p>{recommendation.summary}</p>
                </div>
                <StatusBadge
                  label={recommendation.priority}
                  tone={
                    recommendation.priority === "high"
                      ? "danger"
                      : recommendation.priority === "medium"
                        ? "warning"
                        : "muted"
                  }
                />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Predictive outlook</p>
          {predictiveInsights.slice(0, 5).map((insight) => (
            <div className="list-row" key={insight.id}>
              <div className="list-title">
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.summary}</p>
                </div>
                <StatusBadge
                  label={insight.horizonLabel}
                  tone={insight.tone === "danger" ? "danger" : insight.tone === "warning" ? "warning" : "muted"}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Reviews needing attention</p>
          {reviews.slice(0, 6).map((review) => (
            <div className="list-row" key={review.id}>
              <div className="list-title">
                <div>
                  <strong>{review.title}</strong>
                  <p>{review.description}</p>
                </div>
                <StatusBadge
                  label={review.status.replaceAll("_", " ")}
                  tone={
                    review.status === "approved"
                      ? "success"
                      : review.status === "rejected"
                        ? "danger"
                        : review.status === "returned"
                          ? "warning"
                          : "muted"
                  }
                />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Recent export activity</p>
          {exportJobs.slice(0, 5).map((job) => (
            <div className="list-row" key={job.id}>
              <div className="list-title">
                <div>
                  <strong>{job.title}</strong>
                  <p>{job.filtersSummary || "Standard export scope"}</p>
                </div>
                <StatusBadge
                  label={job.status}
                  tone={
                    job.status === "ready"
                      ? "success"
                      : job.status === "failed"
                        ? "danger"
                        : "warning"
                  }
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
