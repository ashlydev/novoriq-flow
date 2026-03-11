"use client";

import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge } from "@/components/shared/ui";
import { formatCurrency, formatDateTime } from "@/lib/calculations";
import { ReconciliationRecord } from "@/lib/v5-types";

type StatusFilter = "all" | ReconciliationRecord["status"];
type KindFilter = "all" | ReconciliationRecord["kind"];

export default function ReconciliationPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    financeSummary,
    getReconciliationForPayment,
    getReconciliationForPurchasePayment,
    reconcilePayment,
    reconcilePurchasePayment,
    reconciliationRecords
  } = useFlowV5();
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  if (!canAccess("view_finance")) {
    return (
      <AccessDeniedState description="Reconciliation is limited to roles with finance visibility." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const filteredRecords = useMemo(
    () =>
      reconciliationRecords.filter((record) => {
        const matchesKind = kindFilter === "all" ? true : record.kind === kindFilter;
        const matchesStatus = statusFilter === "all" ? true : record.status === statusFilter;
        return matchesKind && matchesStatus;
      }),
    [kindFilter, reconciliationRecords, statusFilter]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reconciliation"
        title="Keep payment records and invoice evidence aligned."
        description="This layer is intentionally manual and explainable. It helps the business confirm, flag, and review payments rather than pretending unsupported bank automation exists."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Unreconciled" tone={financeSummary.unreconciledCount ? "warning" : "success"} value={String(financeSummary.unreconciledCount)} />
        <MetricCard label="Mismatches" tone={financeSummary.mismatchCount ? "danger" : "success"} value={String(financeSummary.mismatchCount)} />
        <MetricCard label="Invoice payments" value={String(reconciliationRecords.filter((record) => record.kind === "invoice_payment").length)} />
        <MetricCard label="Supplier payments" value={String(reconciliationRecords.filter((record) => record.kind === "supplier_payment").length)} />
      </div>

      <Card>
        <div className="form-grid">
          <Select
            label="Kind"
            onChange={(event) => setKindFilter(event.target.value as KindFilter)}
            value={kindFilter}
          >
            <option value="all">All records</option>
            <option value="invoice_payment">Invoice payments</option>
            <option value="supplier_payment">Supplier payments</option>
          </Select>
          <Select
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="unreconciled">Unreconciled</option>
            <option value="partial">Partial</option>
            <option value="reconciled">Reconciled</option>
            <option value="mismatch">Mismatch</option>
          </Select>
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Reconciliation queue</p>
        {filteredRecords.length ? (
          filteredRecords.map((record) => {
            const payment =
              record.kind === "invoice_payment"
                ? workspaceData.payments.find((entry) => entry.id === record.paymentId)
                : workspaceData.purchasePayments.find(
                    (entry) => entry.id === record.purchasePaymentId
                  );
            const linkedRecord =
              record.kind === "invoice_payment"
                ? getReconciliationForPayment(record.paymentId || "")
                : getReconciliationForPurchasePayment(record.purchasePaymentId || "");
            const baseAmount = payment?.amount || 0;

            return (
              <div className="list-row" key={record.id}>
                <div className="list-title">
                  <div>
                    <strong>{payment?.reference || payment?.id || "Payment record"}</strong>
                    <p>{record.kind === "invoice_payment" ? "Invoice payment" : "Supplier payment"}</p>
                  </div>
                  <StatusBadge
                    label={linkedRecord?.status || record.status}
                    tone={
                      record.status === "reconciled"
                        ? "success"
                        : record.status === "mismatch"
                          ? "danger"
                          : record.status === "partial"
                            ? "warning"
                            : "muted"
                    }
                  />
                </div>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Amount</span>
                    <strong>{formatCurrency(baseAmount, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Matched</span>
                    <strong>{formatCurrency(record.matchedAmount, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Reviewed</span>
                    <strong>{formatDateTime(record.lastEvaluatedAt)}</strong>
                  </div>
                </div>
                {canAccess("manage_reconciliation") ? (
                  <>
                    <div className="form-grid">
                      <Input
                        label="Matched amount"
                        onChange={(event) =>
                          setDraftAmounts((current) => ({
                            ...current,
                            [record.id]: event.target.value
                          }))
                        }
                        type="number"
                        value={draftAmounts[record.id] ?? String(record.matchedAmount)}
                      />
                      <Input
                        label="Review note"
                        onChange={(event) =>
                          setDraftNotes((current) => ({
                            ...current,
                            [record.id]: event.target.value
                          }))
                        }
                        value={draftNotes[record.id] ?? record.note ?? ""}
                      />
                    </div>
                    <div className="button-row">
                      <Button
                        onClick={() =>
                          setMessage(
                            record.kind === "invoice_payment"
                              ? reconcilePayment(record.paymentId || "", {
                                  status: "reconciled",
                                  matchedAmount: Number(draftAmounts[record.id] ?? record.matchedAmount),
                                  note: draftNotes[record.id]
                                }).message
                              : reconcilePurchasePayment(record.purchasePaymentId || "", {
                                  status: "reconciled",
                                  matchedAmount: Number(draftAmounts[record.id] ?? record.matchedAmount),
                                  note: draftNotes[record.id]
                                }).message
                          )
                        }
                        type="button"
                      >
                        Reconcile
                      </Button>
                      <Button
                        kind="secondary"
                        onClick={() =>
                          setMessage(
                            record.kind === "invoice_payment"
                              ? reconcilePayment(record.paymentId || "", {
                                  status: "partial",
                                  matchedAmount: Number(draftAmounts[record.id] ?? record.matchedAmount),
                                  note: draftNotes[record.id]
                                }).message
                              : reconcilePurchasePayment(record.purchasePaymentId || "", {
                                  status: "partial",
                                  matchedAmount: Number(draftAmounts[record.id] ?? record.matchedAmount),
                                  note: draftNotes[record.id]
                                }).message
                          )
                        }
                        type="button"
                      >
                        Set partial
                      </Button>
                      <Button
                        kind="danger"
                        onClick={() =>
                          setMessage(
                            record.kind === "invoice_payment"
                              ? reconcilePayment(record.paymentId || "", {
                                  status: "mismatch",
                                  matchedAmount: Number(draftAmounts[record.id] ?? record.matchedAmount),
                                  note: draftNotes[record.id]
                                }).message
                              : reconcilePurchasePayment(record.purchasePaymentId || "", {
                                  status: "mismatch",
                                  matchedAmount: Number(draftAmounts[record.id] ?? record.matchedAmount),
                                  note: draftNotes[record.id]
                                }).message
                          )
                        }
                        type="button"
                      >
                        Flag mismatch
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState
            description="Reconciliation records will appear once payments and supplier settlements are captured."
            title="No reconciliation records match"
          />
        )}
      </Card>
    </div>
  );
}
