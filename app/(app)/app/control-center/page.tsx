"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function ControlCenterPage() {
  const { canAccess } = useBusinessOS();
  const { approvalCounts, operationalAlerts } = useFlowV3();
  const { financeSummary } = useFlowV5();
  const {
    enterpriseNotifications,
    executiveSummary,
    procurementSummary,
    reviews
  } = useFlowV6();
  const { actionCenterSummary, anomalies, automationRuns } = useFlowV7();

  if (!canAccess("view_control_center")) {
    return (
      <AccessDeniedState description="The control center is limited to roles with enterprise oversight visibility." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Control center"
        title="Operational control without clutter."
        description="Use one queue for approvals, finance mismatches, procurement issues, branch risks, and enterprise alerts."
      />

      <div className="metric-grid">
        <MetricCard
          label="Pending approvals"
          tone={approvalCounts.pending ? "warning" : "success"}
          value={String(approvalCounts.pending)}
        />
        <MetricCard
          label="Pending reviews"
          tone={executiveSummary.pendingReviews ? "warning" : "success"}
          value={String(executiveSummary.pendingReviews)}
        />
        <MetricCard
          label="Finance mismatches"
          tone={financeSummary.mismatchCount ? "danger" : "success"}
          value={String(financeSummary.mismatchCount)}
        />
        <MetricCard
          label="Procurement threshold"
          value={String(procurementSummary.reviewThreshold || 0)}
        />
        <MetricCard
          label="Unread enterprise alerts"
          value={String(enterpriseNotifications.filter((item) => !item.isRead).length)}
        />
        <MetricCard
          label="Open action tasks"
          tone={actionCenterSummary.open ? "warning" : "success"}
          value={String(actionCenterSummary.open)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Action queues</p>
          <div className="button-row" style={{ marginBottom: 16 }}>
            <Link className="button button-secondary" href="/app/reviews">
              Open maker-checker
            </Link>
            <Link className="button button-secondary" href="/app/procurement">
              Procurement controls
            </Link>
            <Link className="button button-secondary" href="/app/approvals">
              Classic approvals
            </Link>
            <Link className="button button-secondary" href="/app/finance/reconciliation">
              Reconciliation
            </Link>
            <Link className="button button-secondary" href="/app/actions">
              Action center
            </Link>
            <Link className="button button-secondary" href="/app/anomalies">
              Anomalies
            </Link>
          </div>
          {reviews.slice(0, 6).map((review) => (
            <div className="list-row" key={review.id}>
              <div className="list-title">
                <div>
                  <strong>{review.title}</strong>
                  <p>{review.reason || review.description}</p>
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
          <p className="eyebrow">Enterprise and smart alerts</p>
          {[...enterpriseNotifications, ...anomalies.filter((entry) => entry.status === "open").map((entry) => ({
            id: entry.id,
            title: entry.title,
            message: entry.summary,
            isRead: entry.status !== "open"
          }))].slice(0, 6).map((notification) => (
            <div className="list-row" key={notification.id}>
              <div className="list-title">
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
                <StatusBadge
                  label={notification.isRead ? "read" : "unread"}
                  tone={notification.isRead ? "muted" : "warning"}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Procurement watch</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>High-value purchases</span>
              <strong>{procurementSummary.highValuePurchases.length}</strong>
            </div>
            <div className="info-pair">
              <span>Pending procurement reviews</span>
              <strong>{procurementSummary.pendingReviewCount}</strong>
            </div>
            <div className="info-pair">
              <span>Supplier pressure</span>
              <strong>{procurementSummary.supplierPressureCount}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Operational warnings and automation runs</p>
          {[...operationalAlerts.map((alert) => ({
            id: alert.id,
            title: alert.title,
            message: alert.message,
            label: alert.type.replaceAll("_", " ")
          })), ...automationRuns.slice(0, 3).map((run) => ({
            id: run.id,
            title: run.title,
            message: run.summary,
            label: run.status
          }))].slice(0, 5).map((alert) => (
            <div className="list-row" key={alert.id}>
              <div className="list-title">
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                </div>
                <StatusBadge label={alert.label} tone="warning" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
