"use client";

import { AuditLog } from "@/lib/types";
import { Card, EmptyState, StatusBadge } from "@/components/shared/ui";
import { formatDateTime } from "@/lib/calculations";

export function AuditLogList({
  logs,
  actorLabelById,
  title = "Audit trail",
  description = "Important actions are tracked here for accountability."
}: {
  logs: AuditLog[];
  actorLabelById?: Record<string, string>;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <p className="eyebrow">{title}</p>
      <p>{description}</p>
      {logs.length ? (
        <div className="panel-stack" style={{ marginTop: 16 }}>
          {logs.map((log) => (
            <div className="list-row" key={log.id}>
              <div className="list-title">
                <div>
                  <strong>{log.title}</strong>
                  <p>{log.summary}</p>
                  {log.metadata ? (
                    <p>
                      {Object.entries(log.metadata)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <StatusBadge label={log.action.replace("_", " ")} tone="muted" />
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>Actor</span>
                  <strong>{actorLabelById?.[log.actorUserId] || log.actorRole}</strong>
                </div>
                <div className="info-pair">
                  <span>Entity</span>
                  <strong>{log.entityType.replace("_", " ")}</strong>
                </div>
                <div className="info-pair">
                  <span>When</span>
                  <strong>{formatDateTime(log.createdAt)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            description="Actions like payments, purchase confirmations, settings changes, and receipt reprints will appear here."
            title="No audit activity yet"
          />
        </div>
      )}
    </Card>
  );
}
