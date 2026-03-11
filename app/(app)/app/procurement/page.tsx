"use client";

import Link from "next/link";
import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Button, Card, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { formatCurrency, getPurchaseStatus } from "@/lib/calculations";

export default function ProcurementPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    controlPolicies,
    createReview,
    procurementSummary,
    reviews,
    saveControlPolicy
  } = useFlowV6();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<{
    module: "purchases" | "finance" | "settings";
    eventKey: string;
    label: string;
    thresholdAmount: string;
    requiresReview: "yes" | "no";
    autoEscalate: "yes" | "no";
    notes: string;
  }>({
    module: "purchases" as const,
    eventKey: "purchase_over_threshold",
    label: "Procurement threshold control",
    thresholdAmount: String(procurementSummary.reviewThreshold || 750),
    requiresReview: "yes",
    autoEscalate: "yes",
    notes: ""
  });

  if (!canAccess("view_procurement_controls")) {
    return (
      <AccessDeniedState description="Procurement controls are limited to roles with spend-governance visibility." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Procurement"
        title="Procurement controls without ERP bloat."
        description="Use spend thresholds, review queues, and supplier pressure visibility to keep purchasing controlled."
        action={
          <div className="button-row">
            <Link className="button button-secondary" href="/app/purchases">
              Purchases
            </Link>
            <Link className="button button-secondary" href="/app/network/orders">
              Purchase orders
            </Link>
          </div>
        }
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Review threshold" value={formatCurrency(procurementSummary.reviewThreshold || 0, currency)} />
        <MetricCard
          label="High-value purchases"
          tone={procurementSummary.highValuePurchases.length ? "warning" : "success"}
          value={String(procurementSummary.highValuePurchases.length)}
        />
        <MetricCard
          label="Pending procurement reviews"
          tone={procurementSummary.pendingReviewCount ? "warning" : "success"}
          value={String(procurementSummary.pendingReviewCount)}
        />
        <MetricCard
          label="Supplier pressure"
          tone={procurementSummary.supplierPressureCount ? "danger" : "success"}
          value={String(procurementSummary.supplierPressureCount)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Control policies</p>
          {canAccess("manage_procurement_controls") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  saveControlPolicy({
                    module: form.module,
                    eventKey: form.eventKey,
                    label: form.label,
                    thresholdAmount: Number(form.thresholdAmount) || undefined,
                    requiresReview: form.requiresReview === "yes",
                    autoEscalate: form.autoEscalate === "yes",
                    notes: form.notes
                  }).message
                );
              }}
            >
              <div className="form-grid">
                <Select
                  label="Module"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      module: event.target.value as typeof current.module
                    }))
                  }
                  value={form.module}
                >
                  <option value="purchases">Purchases</option>
                  <option value="finance">Finance</option>
                  <option value="settings">Settings</option>
                </Select>
                <Select
                  label="Event"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, eventKey: event.target.value }))
                  }
                  value={form.eventKey}
                >
                  <option value="purchase_over_threshold">Purchase over threshold</option>
                  <option value="expense_over_threshold">Expense over threshold</option>
                  <option value="critical_setting_change">Critical setting change</option>
                </Select>
                <Select
                  label="Requires review"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requiresReview: event.target.value as "yes" | "no"
                    }))
                  }
                  value={form.requiresReview}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
                <Select
                  label="Auto-escalate"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      autoEscalate: event.target.value as "yes" | "no"
                    }))
                  }
                  value={form.autoEscalate}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
                <Select
                  label="Threshold"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, thresholdAmount: event.target.value }))
                  }
                  value={form.thresholdAmount}
                >
                  <option value="500">500</option>
                  <option value="750">750</option>
                  <option value="900">900</option>
                  <option value="1200">1200</option>
                </Select>
              </div>
              <Textarea
                label="Notes"
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                value={form.notes}
              />
              <div className="form-actions">
                <Button type="submit">Save control policy</Button>
              </div>
            </form>
          ) : (
            <p>Procurement policy editing is restricted for your role.</p>
          )}
        </Card>

        <Card>
          <p className="eyebrow">Active procurement policies</p>
          {controlPolicies
            .filter((policy) => policy.module === "purchases")
            .map((policy) => (
              <div className="list-row" key={policy.id}>
                <div className="list-title">
                  <div>
                    <strong>{policy.label}</strong>
                    <p>{policy.notes || "No extra policy note."}</p>
                  </div>
                  <StatusBadge
                    label={policy.requiresReview ? "review required" : "watch"}
                    tone={policy.requiresReview ? "warning" : "muted"}
                  />
                </div>
                <p>Threshold {formatCurrency(policy.thresholdAmount || 0, currency)}</p>
              </div>
            ))}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">High-value purchases</p>
        {procurementSummary.highValuePurchases.map((purchase) => {
          const supplier = workspaceData.suppliers.find((entry) => entry.id === purchase.supplierId);
          const existingReview = reviews.find(
            (review) => review.entityType === "purchase" && review.entityId === purchase.id
          );
          return (
            <div className="list-row" key={purchase.id}>
              <div className="list-title">
                <div>
                  <strong>{purchase.reference}</strong>
                  <p>{supplier?.name || "Supplier"} · {getPurchaseStatus(purchase, workspaceData.purchasePayments)}</p>
                </div>
                <StatusBadge
                  label={existingReview ? existingReview.status.replaceAll("_", " ") : "not submitted"}
                  tone={
                    existingReview?.status === "approved"
                      ? "success"
                      : existingReview?.status === "rejected"
                        ? "danger"
                        : existingReview?.status === "returned"
                          ? "warning"
                          : "muted"
                  }
                />
              </div>
              <div className="button-row">
                {!existingReview ? (
                  <Button
                    onClick={() =>
                      setMessage(
                        createReview({
                          entityType: "purchase",
                          entityId: purchase.id,
                          module: "purchases",
                          title: `${purchase.reference} procurement review`,
                          description: "Submitted from procurement controls for maker-checker approval.",
                          amount: purchase.lineItems.reduce(
                            (total, line) => total + line.quantity * line.unitCost,
                            0
                          ),
                          reason: "Purchase exceeded current procurement threshold."
                        }).message
                      )
                    }
                    type="button"
                  >
                    Submit for review
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
