"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatDateTime } from "@/lib/calculations";

export default function NotificationsPage() {
  const {
    markAllNotificationsRead,
    markNotificationRead,
    workspaceData
  } = useBusinessOS();
  const {
    markAllOperationalAlertsRead,
    markOperationalAlertRead,
    operationalAlerts
  } = useFlowV3();
  const {
    markAllNetworkNotificationsRead,
    markNetworkNotificationRead,
    networkNotifications
  } = useFlowV4();
  const {
    financeNotifications,
    markAllFinanceNotificationsRead,
    markFinanceNotificationRead
  } = useFlowV5();
  const {
    enterpriseNotifications,
    markAllEnterpriseNotificationsRead,
    markEnterpriseNotificationRead
  } = useFlowV6();
  const {
    intelligenceNotifications,
    markAllIntelligenceNotificationsRead,
    markIntelligenceNotificationRead
  } = useFlowV7();

  const combinedNotifications = useMemo(
    () =>
      [
        ...workspaceData.notifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          severity: notification.severity,
          isRead: notification.isRead,
          source: "core" as const
        })),
        ...operationalAlerts.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          severity: notification.type === "out_of_stock" || notification.type === "cash_flow_warning" ? "critical" : "warning",
          isRead: notification.isRead,
          source: "operational" as const
        })),
        ...networkNotifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          severity: "warning",
          isRead: notification.isRead,
          source: "network" as const
        })),
        ...financeNotifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          severity: notification.type === "payment_mismatch_detected" || notification.type === "financial_health_warning" ? "critical" : "warning",
          isRead: notification.isRead,
          source: "finance" as const
        })),
        ...enterpriseNotifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          severity:
            notification.type === "branch_risk_alert" ||
            notification.type === "procurement_issue_alert" ||
            notification.type === "major_reconciliation_mismatch"
              ? "critical"
              : "warning",
          isRead: notification.isRead,
          source: "enterprise" as const
        })),
        ...intelligenceNotifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          href: notification.href,
          createdAt: notification.createdAt,
          severity:
            notification.type === "anomaly_detected" ||
            notification.type === "predictive_warning"
              ? "critical"
              : "warning",
          isRead: notification.isRead,
          source: "intelligence" as const
        }))
      ].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [
      enterpriseNotifications,
      financeNotifications,
      intelligenceNotifications,
      networkNotifications,
      operationalAlerts,
      workspaceData.notifications
    ]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Notifications"
        title="Operational alerts with better signal."
        description="Operational, network, finance, enterprise, and intelligence events land here with links back to the source record: due dates, approvals, low stock, anomalies, collections, reconciliation, readiness, and relationship activity."
        action={
          <div className="button-row">
            <Button kind="secondary" onClick={markAllNotificationsRead} type="button">
              Mark core read
            </Button>
            <Button kind="secondary" onClick={markAllOperationalAlertsRead} type="button">
              Mark operational read
            </Button>
            <Button kind="secondary" onClick={markAllNetworkNotificationsRead} type="button">
              Mark network read
            </Button>
            <Button kind="secondary" onClick={markAllFinanceNotificationsRead} type="button">
              Mark finance read
            </Button>
            <Button kind="secondary" onClick={markAllEnterpriseNotificationsRead} type="button">
              Mark enterprise read
            </Button>
            <Button kind="secondary" onClick={markAllIntelligenceNotificationsRead} type="button">
              Mark intelligence read
            </Button>
          </div>
        }
      />

      <Card>
        {combinedNotifications.length ? (
          combinedNotifications.map((notification) => (
            <div className="list-row" key={`${notification.source}-${notification.id}`}>
              <div className="list-title">
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                </div>
                <div className="button-row">
                  <StatusBadge
                    label={notification.source}
                    tone={
                      notification.source === "operational"
                        ? "warning"
                        : notification.source === "network"
                          ? "success"
                          : notification.source === "finance"
                            ? "danger"
                            : notification.source === "enterprise"
                              ? "danger"
                              : notification.source === "intelligence"
                                ? "warning"
                                : "muted"
                    }
                  />
                  <StatusBadge
                    label={notification.isRead ? "read" : "unread"}
                    tone={notification.isRead ? "muted" : "warning"}
                  />
                </div>
              </div>
              <p>{formatDateTime(notification.createdAt)}</p>
              <div className="button-row">
                {!notification.isRead ? (
                  <Button
                    kind="secondary"
                    onClick={() =>
                      notification.source === "core"
                        ? markNotificationRead(notification.id)
                        : notification.source === "operational"
                          ? markOperationalAlertRead(notification.id)
                          : notification.source === "network"
                            ? markNetworkNotificationRead(notification.id)
                            : notification.source === "finance"
                              ? markFinanceNotificationRead(notification.id)
                              : notification.source === "enterprise"
                                ? markEnterpriseNotificationRead(notification.id)
                                : markIntelligenceNotificationRead(notification.id)
                    }
                    type="button"
                  >
                    Mark read
                  </Button>
                ) : null}
                {notification.href ? (
                  <Link className="button button-primary" href={notification.href}>
                    Open record
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            description="Alerts will appear here once the workspace starts generating operational events."
            title="No notifications yet"
          />
        )}
      </Card>
    </div>
  );
}
