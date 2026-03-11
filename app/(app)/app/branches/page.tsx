"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import {
  Button,
  Card,
  EmptyState,
  Input,
  MetricCard,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";

export default function BranchesPage() {
  const { canAccess } = useBusinessOS();
  const { branchSummaries, branches, currentBranchId, saveBranch, setCurrentBranchId } =
    useFlowV3();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    managerName: "",
    isPrimary: false
  });

  if (!canAccess("view_branches")) {
    return (
      <AccessDeniedState description="Branch visibility is limited to manager, admin, and owner roles." />
    );
  }

  const activeBranches = branches.filter((branch) => branch.status === "active");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Branches"
        title="Multi-branch control without franchise complexity."
        description="Create locations, switch operational focus, and understand branch-level activity without rebuilding the whole product."
      />

      <div className="metric-grid">
        <MetricCard label="Active branches" value={String(activeBranches.length)} />
        <MetricCard
          label="Current branch filter"
          value={currentBranchId === "all" ? "All branches" : branches.find((branch) => branch.id === currentBranchId)?.name || "All branches"}
        />
        <MetricCard
          label="Branch summaries"
          value={String(branchSummaries.length)}
        />
        <MetricCard
          label="Primary branch"
          value={branches.find((branch) => branch.isPrimary)?.name || "Not set"}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Add branch</p>
          {message ? <div className="notice">{message}</div> : null}
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = saveBranch(form);
              setMessage(result.message);
              if (result.success) {
                setForm({
                  name: "",
                  code: "",
                  address: "",
                  phone: "",
                  managerName: "",
                  isPrimary: false
                });
              }
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
          <p className="eyebrow">Branch list</p>
          {branches.length ? (
            branches.map((branch) => (
              <div className="list-row" key={branch.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/branches/${branch.id}`}>
                      <strong>{branch.name}</strong>
                    </Link>
                    <p>{branch.code} · {branch.address || "No address set"}</p>
                  </div>
                  <StatusBadge
                    label={branch.status}
                    tone={branch.status === "active" ? "success" : "muted"}
                  />
                </div>
                <div className="button-row">
                  <Button
                    kind={currentBranchId === branch.id ? "primary" : "secondary"}
                    onClick={() => setCurrentBranchId(branch.id)}
                    type="button"
                  >
                    {currentBranchId === branch.id ? "Selected" : "View branch"}
                  </Button>
                  {branch.isPrimary ? <StatusBadge label="primary" tone="warning" /> : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="Create the first branch to add branch-aware control to the workspace."
              title="No branches yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
