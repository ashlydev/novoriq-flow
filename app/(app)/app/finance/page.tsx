"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function FinancePage() {
  const { canAccess, currentWorkspace } = useBusinessOS();
  const {
    financialHealth,
    financeNotifications,
    financeSummary,
    ledgerEntries,
    partnerFinancePackages,
    supplierCreditSummary
  } = useFlowV5();
  const { anomalies, predictiveInsights, recommendations } = useFlowV7();

  if (!canAccess("view_finance")) {
    return (
      <AccessDeniedState description="Finance views are limited to roles with finance visibility." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Finance"
        title="Use business activity to improve cash control and finance readiness."
        description="Track collections, reconciliation, supplier-credit pressure, and capital-readiness signals without pretending the product is a bank."
        action={
          <div className="button-row">
            <Link className="button button-primary" href="/app/finance/collections">
              Collections
            </Link>
            <Link className="button button-secondary" href="/app/finance/reconciliation">
              Reconciliation
            </Link>
            <Link className="button button-secondary" href="/app/finance/readiness">
              Readiness
            </Link>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Capital readiness"
          tone={
            financialHealth.capitalReadinessScore >= 70
              ? "success"
              : financialHealth.capitalReadinessScore >= 45
                ? "warning"
                : "danger"
          }
          value={`${financialHealth.capitalReadinessScore}/100`}
          hint={financialHealth.readinessBand}
        />
        <MetricCard
          label="Open requests"
          tone={financeSummary.openPaymentRequests ? "warning" : "success"}
          value={String(financeSummary.openPaymentRequests)}
          hint="Shareable collection requests"
        />
        <MetricCard
          label="Unreconciled"
          tone={financeSummary.unreconciledCount ? "warning" : "success"}
          value={String(financeSummary.unreconciledCount)}
          hint="Payments still awaiting review"
        />
        <MetricCard
          label="Eligible invoices"
          tone={financeSummary.eligibleInvoiceCount ? "success" : "default"}
          value={String(financeSummary.eligibleInvoiceCount)}
          hint="Potential financing candidates"
        />
        <MetricCard
          label="Finance anomalies"
          tone={anomalies.filter((entry) => entry.status === "open").length ? "warning" : "success"}
          value={String(anomalies.filter((entry) => entry.status === "open").length)}
          hint="Explainable finance-side warnings"
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Financial health</p>
          <div className="panel-stack">
            {financialHealth.signals.map((signal) => (
              <div className="list-row" key={signal.id}>
                <div className="list-title">
                  <div>
                    <strong>{signal.label}</strong>
                    <p>{signal.explanation}</p>
                  </div>
                  <StatusBadge label={signal.value} tone={signal.tone} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Collection and pressure panel</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Supplier pressure</span>
              <strong>{formatCurrency(supplierCreditSummary.totalOverdue, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Due soon supplier obligations</span>
              <strong>{formatCurrency(supplierCreditSummary.totalDueSoon, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Mismatches</span>
              <strong>{financeSummary.mismatchCount}</strong>
            </div>
            <div className="summary-line">
              <span>Unread finance alerts</span>
              <strong>{financeNotifications.filter((entry) => !entry.isRead).length}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Predictive finance watch</p>
          {predictiveInsights.slice(0, 3).map((insight) => (
            <div className="list-row" key={insight.id}>
              <div className="list-title">
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.summary}</p>
                </div>
                <StatusBadge label="predictive" tone="muted" />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Recommended next finance actions</p>
          {recommendations.slice(0, 4).map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-title">
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.summary}</p>
                </div>
                <StatusBadge label={entry.priority} tone={entry.priority === "high" ? "warning" : "muted"} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Recent finance movements</p>
          {ledgerEntries.slice(0, 6).map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-title">
                <div>
                  <strong>{entry.label}</strong>
                  <p>{entry.counterpartyName || entry.description || "Finance event"}</p>
                </div>
                <StatusBadge
                  label={`${entry.direction} ${formatCurrency(entry.amount, currency)}`}
                  tone={entry.direction === "inflow" ? "success" : "warning"}
                />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Partner-finance readiness</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Readiness band</span>
              <strong>{financialHealth.readinessBand}</strong>
            </div>
            <div className="info-pair">
              <span>Packages prepared</span>
              <strong>{partnerFinancePackages.length}</strong>
            </div>
            <div className="info-pair">
              <span>Cash pressure</span>
              <strong>{financialHealth.cashPressureLabel}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/finance/readiness">
              Open readiness
            </Link>
            <Link className="button button-secondary" href="/app/finance/eligible-invoices">
              Eligible invoices
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
