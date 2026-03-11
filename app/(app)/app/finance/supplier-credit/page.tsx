"use client";

import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { Button, Card, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";
import { SupplierCreditTerm } from "@/lib/v5-types";

export default function SupplierCreditPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const { supplierCreditSummary, supplierCreditTerms, updateSupplierCreditTerm } = useFlowV5();
  const [message, setMessage] = useState("");
  const [supplierId, setSupplierId] = useState(supplierCreditTerms[0]?.supplierId || workspaceData.suppliers[0]?.id || "");
  const currentTerm = supplierCreditTerms.find((entry) => entry.supplierId === supplierId);
  const [form, setForm] = useState({
    creditDays: currentTerm?.creditDays || 14,
    reminderDays: currentTerm?.reminderDays || 3,
    creditLimitEstimate: currentTerm?.creditLimitEstimate || 0,
    status: (currentTerm?.status || "watch") as SupplierCreditTerm["status"],
    notes: currentTerm?.notes || ""
  });

  if (!canAccess("view_finance")) {
    return (
      <AccessDeniedState description="Supplier-credit visibility is limited to roles with finance visibility." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Supplier credit"
        title="Keep supplier terms and obligations visible."
        description="This is a simple supplier-credit foundation for visibility and reminders, not a full trade-finance engine."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Outstanding" tone="warning" value={formatCurrency(supplierCreditSummary.totalOutstanding, currency)} />
        <MetricCard label="Overdue" tone="danger" value={formatCurrency(supplierCreditSummary.totalOverdue, currency)} />
        <MetricCard label="Due soon" tone="warning" value={formatCurrency(supplierCreditSummary.totalDueSoon, currency)} />
        <MetricCard label="Pressure suppliers" tone={supplierCreditSummary.pressureCount ? "danger" : "success"} value={String(supplierCreditSummary.pressureCount)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Supplier credit terms</p>
          {canAccess("manage_supplier_credit") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  updateSupplierCreditTerm(supplierId, {
                    ...form,
                    creditLimitEstimate: form.creditLimitEstimate || undefined
                  }).message
                );
              }}
            >
              <Select
                label="Supplier"
                onChange={(event) => {
                  const nextId = event.target.value;
                  const nextTerm = supplierCreditTerms.find((entry) => entry.supplierId === nextId);
                  setSupplierId(nextId);
                  setForm({
                    creditDays: nextTerm?.creditDays || 14,
                    reminderDays: nextTerm?.reminderDays || 3,
                    creditLimitEstimate: nextTerm?.creditLimitEstimate || 0,
                    status: (nextTerm?.status || "watch") as SupplierCreditTerm["status"],
                    notes: nextTerm?.notes || ""
                  });
                }}
                value={supplierId}
              >
                {workspaceData.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
              <div className="form-grid">
                <Select
                  label="Credit days"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      creditDays: Number(event.target.value)
                    }))
                  }
                  value={String(form.creditDays)}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                  <option value="30">30 days</option>
                </Select>
                <Select
                  label="Reminder days"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reminderDays: Number(event.target.value)
                    }))
                  }
                  value={String(form.reminderDays)}
                >
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </Select>
                <Select
                  label="Status"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as SupplierCreditTerm["status"]
                    }))
                  }
                  value={form.status}
                >
                  <option value="healthy">Healthy</option>
                  <option value="watch">Watch</option>
                  <option value="pressure">Pressure</option>
                </Select>
                <Select
                  label="Credit limit estimate"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      creditLimitEstimate: Number(event.target.value)
                    }))
                  }
                  value={String(form.creditLimitEstimate)}
                >
                  <option value="0">Not set</option>
                  <option value="500">500</option>
                  <option value="800">800</option>
                  <option value="1000">1000</option>
                  <option value="1500">1500</option>
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
                <Button type="submit">Save supplier credit terms</Button>
              </div>
            </form>
          ) : (
            <p>Supplier-credit editing is restricted for your role.</p>
          )}
        </Card>

        <Card>
          <p className="eyebrow">Supplier obligations</p>
          {supplierCreditSummary.rows.map((row) => (
            <div className="list-row" key={row.term.id}>
              <div className="list-title">
                <div>
                  <strong>{row.supplier?.name || "Supplier"}</strong>
                  <p>{row.term.creditDays} day terms · remind {row.term.reminderDays} days before due</p>
                </div>
                <StatusBadge
                  label={row.term.status}
                  tone={
                    row.term.status === "healthy"
                      ? "success"
                      : row.term.status === "watch"
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>Outstanding</span>
                  <strong>{formatCurrency(row.outstanding, currency)}</strong>
                </div>
                <div className="info-pair">
                  <span>Due soon</span>
                  <strong>{formatCurrency(row.dueSoon, currency)}</strong>
                </div>
                <div className="info-pair">
                  <span>Overdue</span>
                  <strong>{formatCurrency(row.overdue, currency)}</strong>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
