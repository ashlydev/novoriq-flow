"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, EmptyState, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function AnomaliesPage() {
  const { canAccess } = useBusinessOS();
  const { anomalies, dismissAnomaly, markAnomalyReviewed } = useFlowV7();

  if (!canAccess("view_anomalies")) {
    return (
      <AccessDeniedState description="Anomaly visibility is limited to roles with intelligent oversight access." />
    );
  }

  const open = anomalies.filter((entry) => entry.status === "open");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Anomalies"
        title="Explainable alerts for unusual business patterns."
        description="These alerts are rule-based and grounded in real Flow data. Each card explains why it was triggered so teams can review or dismiss with confidence."
      />

      <div className="metric-grid">
        <MetricCard label="Open anomalies" value={String(open.length)} />
        <MetricCard label="Reviewed" value={String(anomalies.filter((entry) => entry.status === "reviewed").length)} />
        <MetricCard label="Dismissed" value={String(anomalies.filter((entry) => entry.status === "dismissed").length)} />
        <MetricCard label="Critical" value={String(open.filter((entry) => entry.tone === "danger").length)} />
      </div>

      <Card>
        {anomalies.length ? (
          anomalies.map((anomaly) => (
            <div className="list-row" key={anomaly.id}>
              <div className="list-title">
                <div>
                  <strong>{anomaly.title}</strong>
                  <p>{anomaly.summary}</p>
                </div>
                <div className="button-row">
                  <StatusBadge
                    label={anomaly.tone}
                    tone={
                      anomaly.tone === "danger"
                        ? "danger"
                        : anomaly.tone === "warning"
                          ? "warning"
                          : anomaly.tone === "success"
                            ? "success"
                            : "muted"
                    }
                  />
                  <StatusBadge
                    label={anomaly.status}
                    tone={
                      anomaly.status === "reviewed"
                        ? "success"
                        : anomaly.status === "dismissed"
                          ? "muted"
                          : "warning"
                    }
                  />
                </div>
              </div>
              <div className="kpi-stack">
                <div className="info-pair">
                  <span>Why this exists</span>
                  <strong>{anomaly.explanation}</strong>
                </div>
                {anomaly.metricLabel ? (
                  <div className="info-pair">
                    <span>{anomaly.metricLabel}</span>
                    <strong>{anomaly.metricValue || "Tracked"}</strong>
                  </div>
                ) : null}
              </div>
              <div className="button-row">
                {anomaly.href ? (
                  <Link className="button button-secondary" href={anomaly.href}>
                    Open related view
                  </Link>
                ) : null}
                {anomaly.status === "open" ? (
                  <Button
                    kind="secondary"
                    onClick={() => markAnomalyReviewed(anomaly.id)}
                    type="button"
                  >
                    Mark reviewed
                  </Button>
                ) : null}
                {anomaly.status !== "dismissed" ? (
                  <Button
                    kind="danger"
                    onClick={() => dismissAnomaly(anomaly.id)}
                    type="button"
                  >
                    Dismiss
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No anomalies detected"
            description="When Flow sees unusual spend, delayed approvals, branch risk, or reconciliation mismatch patterns, they will appear here."
          />
        )}
      </Card>
    </div>
  );
}
