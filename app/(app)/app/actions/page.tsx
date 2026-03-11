"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, EmptyState, MetricCard, PageHeader, Select, StatusBadge } from "@/components/shared/ui";

export default function ActionCenterPage() {
  const { canAccess } = useBusinessOS();
  const { actionCenterSummary, actionTasks, updateTaskStatus } = useFlowV7();

  if (!canAccess("view_action_center")) {
    return (
      <AccessDeniedState description="The action center is limited to roles with intelligent workflow visibility." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Action center"
        title="Turn alerts, recommendations, and automations into tracked work."
        description="Action tasks stay lightweight and operational so teams can close follow-ups without turning Flow into a project management suite."
      />

      <div className="metric-grid">
        <MetricCard label="Open tasks" value={String(actionCenterSummary.open)} />
        <MetricCard label="High priority" value={String(actionCenterSummary.highPriority)} />
        <MetricCard label="Overdue tasks" value={String(actionCenterSummary.overdue)} />
        <MetricCard label="Completed" value={String(actionCenterSummary.done)} />
      </div>

      <Card>
        {actionTasks.length ? (
          actionTasks.map((task) => (
            <div className="list-row" key={task.id}>
              <div className="list-title">
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                </div>
                <div className="button-row">
                  <StatusBadge
                    label={task.priority}
                    tone={
                      task.priority === "critical"
                        ? "danger"
                        : task.priority === "high"
                          ? "warning"
                          : task.priority === "low"
                            ? "muted"
                            : "default"
                    }
                  />
                  <StatusBadge
                    label={task.status}
                    tone={
                      task.status === "done"
                        ? "success"
                        : task.status === "dismissed"
                          ? "muted"
                          : task.status === "snoozed"
                            ? "warning"
                            : "default"
                    }
                  />
                </div>
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>Source</span>
                  <strong>{task.sourceType}</strong>
                </div>
                <div className="info-pair">
                  <span>Assigned role</span>
                  <strong>{task.assignedRole || "Unassigned"}</strong>
                </div>
                <div className="info-pair">
                  <span>Due</span>
                  <strong>{task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"}</strong>
                </div>
              </div>
              <div className="button-row">
                {task.href ? (
                  <Link className="button button-secondary" href={task.href}>
                    Open source
                  </Link>
                ) : null}
                {task.status !== "done" ? (
                  <Button
                    kind="secondary"
                    onClick={() => updateTaskStatus(task.id, { status: "done" })}
                    type="button"
                  >
                    Mark done
                  </Button>
                ) : null}
                {task.status !== "snoozed" ? (
                  <Button
                    kind="secondary"
                    onClick={() =>
                      updateTaskStatus(task.id, {
                        status: "snoozed",
                        snoozedUntil: new Date(Date.now() + 86400000).toISOString()
                      })
                    }
                    type="button"
                  >
                    Snooze 1 day
                  </Button>
                ) : null}
                {task.status !== "dismissed" ? (
                  <Button
                    kind="danger"
                    onClick={() => updateTaskStatus(task.id, { status: "dismissed" })}
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
            title="No action tasks yet"
            description="Tasks generated from automations, anomalies, and recommendations will appear here."
          />
        )}
      </Card>
    </div>
  );
}
