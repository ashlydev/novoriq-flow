"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { Button, Card, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatDateTime } from "@/lib/calculations";

export default function FinanceReadinessPage() {
  const { canAccess } = useBusinessOS();
  const {
    captureReadinessSnapshot,
    financialHealth,
    generatePartnerFinancePackage,
    partnerFinancePackages,
    readinessHistory
  } = useFlowV5();

  if (!canAccess("view_financing_readiness")) {
    return (
      <AccessDeniedState description="Financing readiness is limited to manager, admin, and owner roles." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Readiness"
        title="Finance readiness stays explainable."
        description="This view does not approve funding. It shows the operating signals that may help or weaken future partner-finance readiness."
        action={
          <div className="button-row">
            <Button kind="secondary" onClick={() => captureReadinessSnapshot()} type="button">
              Capture snapshot
            </Button>
            <Button onClick={() => generatePartnerFinancePackage()} type="button">
              Generate partner pack
            </Button>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard label="Readiness score" value={`${financialHealth.capitalReadinessScore}/100`} />
        <MetricCard
          label="Band"
          tone={
            financialHealth.readinessBand === "strong"
              ? "success"
              : financialHealth.readinessBand === "steady"
                ? "warning"
                : "danger"
          }
          value={financialHealth.readinessBand}
        />
        <MetricCard label="Signals" value={String(financialHealth.signals.length)} />
        <MetricCard label="Partner packs" value={String(partnerFinancePackages.length)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">What is helping</p>
          {financialHealth.strengths.length ? (
            financialHealth.strengths.map((entry) => (
              <div className="list-row" key={entry}>
                <p>{entry}</p>
              </div>
            ))
          ) : (
            <p>No major strengths are standing out yet.</p>
          )}
        </Card>

        <Card>
          <p className="eyebrow">What to improve</p>
          {financialHealth.improvements.length ? (
            financialHealth.improvements.map((entry) => (
              <div className="list-row" key={entry}>
                <p>{entry}</p>
              </div>
            ))
          ) : (
            <p>No urgent improvements are currently flagged.</p>
          )}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Signal breakdown</p>
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
        </Card>

        <Card>
          <p className="eyebrow">Package readiness</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Current band</span>
              <strong>{financialHealth.readinessBand}</strong>
            </div>
            <div className="info-pair">
              <span>Cash pressure</span>
              <strong>{financialHealth.cashPressureLabel}</strong>
            </div>
            <div className="info-pair">
              <span>Partner export mode</span>
              <strong>internal only</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/finance/eligible-invoices">
              Review eligible invoices
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Readiness history</p>
        {readinessHistory.map((entry) => (
          <div className="list-row" key={entry.id}>
            <div className="list-title">
              <div>
                <strong>{entry.capitalReadinessScore}/100</strong>
                <p>{entry.note || "Snapshot captured."}</p>
              </div>
              <StatusBadge
                label={entry.readinessBand}
                tone={
                  entry.readinessBand === "strong"
                    ? "success"
                    : entry.readinessBand === "steady"
                      ? "warning"
                      : "danger"
                }
              />
            </div>
            <p>{formatDateTime(entry.generatedAt)}</p>
          </div>
        ))}
      </Card>

      <Card>
        <p className="eyebrow">Partner package history</p>
        {partnerFinancePackages.map((entry) => (
          <div className="list-row" key={entry.id}>
            <div className="list-title">
              <div>
                <strong>{entry.reference}</strong>
                <p>{entry.summaryNote || "Partner-ready package created."}</p>
              </div>
              <StatusBadge label={entry.status} tone="success" />
            </div>
            <p>{formatDateTime(entry.createdAt)}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
