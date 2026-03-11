"use client";

import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { Button, Card, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function EligibleInvoicesPage() {
  const { canAccess, currentWorkspace } = useBusinessOS();
  const { eligibleInvoices, setInvoiceCandidateSelection } = useFlowV5();
  const [message, setMessage] = useState("");

  if (!canAccess("view_financing_readiness")) {
    return (
      <AccessDeniedState description="Invoice readiness views are limited to manager, admin, and owner roles." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Eligible invoices"
        title="Review invoice candidates for future financing workflows."
        description="These are explainable readiness candidates, not approved funding decisions."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Strong candidates" tone="success" value={String(eligibleInvoices.filter((entry) => entry.status === "strong_candidate").length)} />
        <MetricCard label="Needs review" tone="warning" value={String(eligibleInvoices.filter((entry) => entry.status === "review").length)} />
        <MetricCard label="Not ready" tone="danger" value={String(eligibleInvoices.filter((entry) => entry.status === "not_ready").length)} />
        <MetricCard label="Selected" value={String(eligibleInvoices.filter((entry) => entry.selected).length)} />
      </div>

      <Card>
        {eligibleInvoices.map((candidate) => (
          <div className="list-row" key={candidate.invoiceId}>
            <div className="list-title">
              <div>
                <strong>{candidate.reference}</strong>
                <p>{candidate.customerName}</p>
              </div>
              <div className="button-row">
                <StatusBadge
                  label={`${candidate.score}/100`}
                  tone={
                    candidate.status === "strong_candidate"
                      ? "success"
                      : candidate.status === "review"
                        ? "warning"
                        : "danger"
                  }
                />
                <StatusBadge
                  label={candidate.readinessLabel}
                  tone={
                    candidate.status === "strong_candidate"
                      ? "success"
                      : candidate.status === "review"
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
            </div>
            <p>Outstanding {formatCurrency(candidate.outstandingAmount, currency)}</p>
            {candidate.reasons.length ? (
              <div className="panel-stack">
                {candidate.reasons.map((reason) => (
                  <p key={reason}>Reason: {reason}</p>
                ))}
              </div>
            ) : null}
            {candidate.blockers.length ? (
              <div className="panel-stack">
                {candidate.blockers.map((blocker) => (
                  <p key={blocker}>Blocker: {blocker}</p>
                ))}
              </div>
            ) : null}
            <div className="button-row">
              <Button
                kind={candidate.selected ? "secondary" : "primary"}
                onClick={() =>
                  setMessage(
                    setInvoiceCandidateSelection(
                      candidate.invoiceId,
                      !candidate.selected,
                      candidate.selected
                        ? "Removed from review set."
                        : "Added to partner-finance review set."
                    ).message
                  )
                }
                type="button"
              >
                {candidate.selected ? "Remove from review" : "Flag for review"}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
