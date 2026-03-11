"use client";

import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Button, Card, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function BranchComparisonPage() {
  const { canAccess, currentWorkspace } = useBusinessOS();
  const { branches } = useFlowV3();
  const { branchComparisons, saveBranchControlSetting } = useFlowV6();
  const [message, setMessage] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(branchComparisons[0]?.branch.id || "");
  const selected = useMemo(
    () => branchComparisons.find((row) => row.branch.id === selectedBranchId),
    [branchComparisons, selectedBranchId]
  );
  const [form, setForm] = useState({
    approvalThreshold: selected?.control?.approvalThreshold || 500,
    spendLimit: selected?.control?.spendLimit || 5000,
    riskLevel: selected?.control?.riskLevel || "stable",
    notes: selected?.control?.notes || ""
  });

  if (!canAccess("view_branch_comparison")) {
    return (
      <AccessDeniedState description="Branch comparison is limited to roles with branch analytics visibility." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Branch comparison"
        title="Compare branches with clearer controls."
        description="See revenue, receivables, payables, review pressure, and branch-level control settings in one place."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Branches tracked" value={String(branchComparisons.length)} />
        <MetricCard
          label="High-risk branches"
          tone={branchComparisons.some((row) => row.control?.riskLevel === "risk") ? "danger" : "success"}
          value={String(branchComparisons.filter((row) => row.control?.riskLevel === "risk").length)}
        />
        <MetricCard
          label="Pending reviews"
          tone={branchComparisons.some((row) => row.pendingReviews) ? "warning" : "success"}
          value={String(branchComparisons.reduce((total, row) => total + row.pendingReviews, 0))}
        />
        <MetricCard
          label="Pending approvals"
          value={String(branchComparisons.reduce((total, row) => total + row.pendingApprovals, 0))}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Branch rankings</p>
          {branchComparisons.map((row) => (
            <div className="list-row" key={row.branch.id}>
              <div className="list-title">
                <div>
                  <strong>{row.branch.name}</strong>
                  <p>
                    Revenue {formatCurrency(row.revenue, currency)} · Expenses {formatCurrency(row.expenses, currency)}
                  </p>
                </div>
                <StatusBadge
                  label={row.riskLabel}
                  tone={
                    row.control?.riskLevel === "risk"
                      ? "danger"
                      : row.control?.riskLevel === "watch"
                        ? "warning"
                        : "success"
                  }
                />
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>Receivables</span>
                  <strong>{formatCurrency(row.receivables, currency)}</strong>
                </div>
                <div className="info-pair">
                  <span>Payables</span>
                  <strong>{formatCurrency(row.payables, currency)}</strong>
                </div>
                <div className="info-pair">
                  <span>Pending reviews</span>
                  <strong>{row.pendingReviews}</strong>
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Branch control settings</p>
          <Select
            label="Branch"
            onChange={(event) => {
              const branchId = event.target.value;
              const branch = branchComparisons.find((row) => row.branch.id === branchId);
              setSelectedBranchId(branchId);
              setForm({
                approvalThreshold: branch?.control?.approvalThreshold || 500,
                spendLimit: branch?.control?.spendLimit || 5000,
                riskLevel: branch?.control?.riskLevel || "stable",
                notes: branch?.control?.notes || ""
              });
            }}
            value={selectedBranchId}
          >
            {branches
              .filter((branch) => branch.status === "active")
              .map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </Select>
          {selected ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  saveBranchControlSetting(selected.branch.id, {
                    approvalThreshold: Number(form.approvalThreshold),
                    spendLimit: Number(form.spendLimit),
                    riskLevel: form.riskLevel as typeof form.riskLevel,
                    notes: form.notes
                  }).message
                );
              }}
            >
              <div className="form-grid">
                <Select
                  label="Approval threshold"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      approvalThreshold: Number(event.target.value)
                    }))
                  }
                  value={String(form.approvalThreshold)}
                >
                  <option value="500">500</option>
                  <option value="700">700</option>
                  <option value="900">900</option>
                  <option value="1200">1200</option>
                </Select>
                <Select
                  label="Spend limit"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      spendLimit: Number(event.target.value)
                    }))
                  }
                  value={String(form.spendLimit)}
                >
                  <option value="3500">3500</option>
                  <option value="4500">4500</option>
                  <option value="6000">6000</option>
                  <option value="8000">8000</option>
                </Select>
                <Select
                  label="Risk level"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      riskLevel: event.target.value as typeof current.riskLevel
                    }))
                  }
                  value={form.riskLevel}
                >
                  <option value="stable">Stable</option>
                  <option value="watch">Watch</option>
                  <option value="risk">Risk</option>
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
                <Button type="submit">Save branch controls</Button>
              </div>
            </form>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
