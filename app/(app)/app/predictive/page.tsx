"use client";

import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, EmptyState, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function PredictivePage() {
  const { canAccess } = useBusinessOS();
  const { predictiveInsights } = useFlowV7();

  if (!canAccess("view_predictive_insights")) {
    return (
      <AccessDeniedState description="Predictive insights are limited to roles with finance or executive visibility." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Predictive"
        title="Forward-looking risk signals with explicit labels."
        description="These cards are predictive, not historical fact. Each one explains the underlying pattern so teams understand what might become a problem soon."
      />

      <div className="metric-grid">
        <MetricCard label="Signals" value={String(predictiveInsights.length)} />
        <MetricCard label="Warnings" value={String(predictiveInsights.filter((entry) => entry.tone === "warning").length)} />
        <MetricCard label="Critical watch" value={String(predictiveInsights.filter((entry) => entry.tone === "danger").length)} />
        <MetricCard label="Stable" value={String(predictiveInsights.filter((entry) => entry.tone === "success").length)} />
      </div>

      <Card>
        {predictiveInsights.length ? (
          predictiveInsights.map((insight) => (
            <div className="list-row" key={insight.id}>
              <div className="list-title">
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.summary}</p>
                </div>
                <div className="button-row">
                  <StatusBadge label="predictive" tone="muted" />
                  <StatusBadge
                    label={insight.tone}
                    tone={
                      insight.tone === "danger"
                        ? "danger"
                        : insight.tone === "warning"
                          ? "warning"
                          : insight.tone === "success"
                            ? "success"
                            : "muted"
                    }
                  />
                </div>
              </div>
              <div className="kpi-stack">
                <div className="info-pair">
                  <span>Why this is shown</span>
                  <strong>{insight.explanation}</strong>
                </div>
                <div className="info-pair">
                  <span>Time horizon</span>
                  <strong>{insight.horizonLabel}</strong>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No predictive signals yet"
            description="Predictive cards appear when the business has enough activity to surface future-facing risks."
          />
        )}
      </Card>
    </div>
  );
}
