"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { Button, Card, EmptyState, Input, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function BranchDetailPage() {
  const params = useParams<{ branchId: string }>();
  const router = useRouter();
  const { canAccess, currentWorkspace } = useBusinessOS();
  const {
    archiveBranch,
    branches,
    branchSummaries,
    saveBranch
  } = useFlowV3();

  if (!canAccess("view_branches")) {
    return (
      <AccessDeniedState description="Branch visibility is limited to manager, admin, and owner roles." />
    );
  }

  const branch = branches.find((record) => record.id === params.branchId);
  const summary = branchSummaries.find((record) => record.branch.id === params.branchId);
  const currency = currentWorkspace?.currency || "USD";
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: branch?.name || "",
    code: branch?.code || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
    managerName: branch?.managerName || "",
    isPrimary: branch?.isPrimary || false
  });

  if (!branch) {
    return (
      <EmptyState
        action={
          <Button href="/app/branches">Back to branches</Button>
        }
        description="The branch could not be found."
        title="Branch not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Branch detail"
        title={branch.name}
        description="Review branch details, summary performance, and archive when the location is no longer active."
        action={
          <Button
            kind="danger"
            onClick={() => {
              const result = archiveBranch(branch.id);
              setMessage(result.message);
              if (result.success) {
                router.push("/app/branches");
              }
            }}
            type="button"
          >
            Archive branch
          </Button>
        }
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="two-col">
        <Card>
          <p className="eyebrow">Edit branch</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(saveBranch(form, branch.id).message);
            }}
          >
            <div className="form-grid">
              <Input
                label="Branch name"
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                value={form.name}
              />
              <Input
                label="Code"
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                value={form.code}
              />
              <Input
                label="Phone"
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                value={form.phone}
              />
              <Input
                label="Manager"
                onChange={(event) =>
                  setForm((current) => ({ ...current, managerName: event.target.value }))
                }
                value={form.managerName}
              />
            </div>
            <Input
              label="Address"
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              value={form.address}
            />
            <label className="field">
              <span>Primary branch</span>
              <select
                className="select"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isPrimary: event.target.value === "true"
                  }))
                }
                value={String(form.isPrimary)}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
            <div className="form-actions">
              <Button type="submit">Save branch</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Branch summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={branch.status}
                  tone={branch.status === "active" ? "success" : "muted"}
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Revenue</span>
              <strong>{formatCurrency(summary?.revenue || 0, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Receivables</span>
              <strong>{formatCurrency(summary?.receivables || 0, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Payables</span>
              <strong>{formatCurrency(summary?.payables || 0, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Expenses</span>
              <strong>{formatCurrency(summary?.expenses || 0, currency)}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
