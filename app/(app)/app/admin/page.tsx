"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function AdminPage() {
  const { canAccess, workspaceData } = useBusinessOS();
  const { branches, teamProfiles } = useFlowV3();
  const {
    departmentSummaries,
    enterpriseNotifications,
    executiveSummary,
    exportJobs,
    reviews
  } = useFlowV6();
  const { actionCenterSummary, automationRules, intelligenceSettings, anomalies } = useFlowV7();

  if (!canAccess("view_admin_console")) {
    return (
      <AccessDeniedState description="The admin console is limited to roles with enterprise administration visibility." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Admin"
        title="Business admin console for structured operations."
        description="See users, branches, reviews, alerts, exports, and control surfaces in one enterprise-capable admin layer."
      />

      <div className="metric-grid">
        <MetricCard label="Team members" value={String(teamProfiles.length)} />
        <MetricCard label="Branches" value={String(branches.filter((branch) => branch.status === "active").length)} />
        <MetricCard
          label="Open reviews"
          tone={executiveSummary.pendingReviews ? "warning" : "success"}
          value={String(executiveSummary.pendingReviews)}
        />
        <MetricCard
          label="Unread enterprise alerts"
          tone={enterpriseNotifications.some((alert) => !alert.isRead) ? "warning" : "success"}
          value={String(enterpriseNotifications.filter((alert) => !alert.isRead).length)}
        />
        <MetricCard label="Exports" value={String(exportJobs.length)} />
        <MetricCard label="Automations" value={String(automationRules.length)} />
      </div>

      <div className="list-grid">
        <Card>
          <p className="eyebrow">Control surfaces</p>
          <div className="button-row">
            <Link className="button button-secondary" href="/app/permissions">
              Permissions
            </Link>
            <Link className="button button-secondary" href="/app/departments">
              Departments
            </Link>
            <Link className="button button-secondary" href="/app/reviews">
              Maker-checker
            </Link>
            <Link className="button button-secondary" href="/app/branch-comparison">
              Branch controls
            </Link>
            <Link className="button button-secondary" href="/app/automations">
              Automations
            </Link>
            <Link className="button button-secondary" href="/app/assistant">
              Assistant
            </Link>
            <Link className="button button-secondary" href="/app/exports">
              Exports
            </Link>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Admin watchlist</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Users managed</span>
              <strong>{teamProfiles.length}</strong>
            </div>
            <div className="info-pair">
              <span>Settings prefix rules</span>
              <strong>{workspaceData.settings?.invoicePrefix || "INV"} / {workspaceData.settings?.purchasePrefix || "PO"}</strong>
            </div>
            <div className="info-pair">
              <span>Departments</span>
              <strong>{departmentSummaries.length}</strong>
            </div>
            <div className="info-pair">
              <span>Returned reviews</span>
              <strong>{reviews.filter((review) => review.status === "returned").length}</strong>
            </div>
            <div className="info-pair">
              <span>Open action tasks</span>
              <strong>{actionCenterSummary.open}</strong>
            </div>
            <div className="info-pair">
              <span>Open anomalies</span>
              <strong>{anomalies.filter((entry) => entry.status === "open").length}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Department leads</p>
          {departmentSummaries.map((row) => (
            <div className="list-row" key={row.department.id}>
              <div className="list-title">
                <div>
                  <strong>{row.department.name}</strong>
                  <p>{row.lead?.fullName || "No lead assigned"}</p>
                </div>
                <StatusBadge label={`${row.memberCount} members`} tone="muted" />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Recent enterprise alerts</p>
          {enterpriseNotifications.slice(0, 6).map((alert) => (
            <div className="list-row" key={alert.id}>
              <div className="list-title">
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                </div>
                <StatusBadge label={alert.isRead ? "read" : "unread"} tone={alert.isRead ? "muted" : "warning"} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Intelligence controls</p>
        <div className="kpi-stack">
          <div className="info-pair">
            <span>Assistant enabled</span>
            <strong>{intelligenceSettings.assistantEnabled ? "Yes" : "No"}</strong>
          </div>
          <div className="info-pair">
            <span>Automation enabled</span>
            <strong>{intelligenceSettings.automationEnabled ? "Yes" : "No"}</strong>
          </div>
          <div className="info-pair">
            <span>Predictive insights</span>
            <strong>{intelligenceSettings.predictiveInsightsEnabled ? "Yes" : "No"}</strong>
          </div>
          <div className="info-pair">
            <span>Anomaly sensitivity</span>
            <strong>{intelligenceSettings.anomalySensitivity}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}
