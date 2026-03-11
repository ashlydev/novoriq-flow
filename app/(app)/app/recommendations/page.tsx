"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, EmptyState, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function RecommendationsPage() {
  const { canAccess } = useBusinessOS();
  const { createTaskFromRecommendation, recommendations } = useFlowV7();

  if (!canAccess("view_recommendations")) {
    return (
      <AccessDeniedState description="Recommendations are limited to roles with intelligent guidance visibility." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Recommendations"
        title="Actionable guidance grounded in actual business patterns."
        description="Recommendations are designed to be explicit, explainable, and easy to act on. Each one states why it exists and links back to the source record or control area."
      />

      <div className="metric-grid">
        <MetricCard label="Total" value={String(recommendations.length)} />
        <MetricCard label="High priority" value={String(recommendations.filter((entry) => entry.priority === "high").length)} />
        <MetricCard label="Collections" value={String(recommendations.filter((entry) => entry.category === "collections").length)} />
        <MetricCard label="Finance" value={String(recommendations.filter((entry) => entry.category === "finance").length)} />
      </div>

      <Card>
        {recommendations.length ? (
          recommendations.map((recommendation) => (
            <div className="list-row" key={recommendation.id}>
              <div className="list-title">
                <div>
                  <strong>{recommendation.title}</strong>
                  <p>{recommendation.summary}</p>
                </div>
                <div className="button-row">
                  <StatusBadge label={recommendation.category} tone="muted" />
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
              <p>{recommendation.explanation}</p>
              <div className="button-row">
                {recommendation.href ? (
                  <Link className="button button-secondary" href={recommendation.href}>
                    Open source
                  </Link>
                ) : null}
                <Button
                  kind="secondary"
                  onClick={() => createTaskFromRecommendation(recommendation.id)}
                  type="button"
                >
                  Create task
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No recommendations yet"
            description="Recommendations will appear once Flow can rank collections, branch risk, procurement pressure, or other operational patterns."
          />
        )}
      </Card>
    </div>
  );
}
