"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function ProjectsPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const { branches, projectSummaries, saveProject } = useFlowV3();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    code: "",
    customerId: "",
    branchId: "",
    status: "active" as "active" | "completed" | "archived",
    notes: "",
    budgetAmount: 0
  });

  if (!canAccess("view_projects")) {
    return (
      <AccessDeniedState description="Project visibility is limited to roles with operational access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Projects & jobs"
        title="Track work profitability without full project management."
        description="Create jobs, link revenue and costs to them, and see whether each piece of work is pulling its weight."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Projects" value={String(projectSummaries.length)} />
        <MetricCard
          label="Active"
          value={String(projectSummaries.filter((summary) => summary.project.status === "active").length)}
        />
        <MetricCard
          label="Margin-negative"
          tone="danger"
          value={String(projectSummaries.filter((summary) => summary.estimatedProfit < 0).length)}
        />
        <MetricCard
          label="Collected revenue"
          tone="success"
          value={formatCurrency(
            projectSummaries.reduce((sum, summary) => sum + summary.collectedRevenue, 0),
            currentWorkspace?.currency || "USD"
          )}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create project</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(saveProject(form).message);
            }}
          >
            <div className="form-grid">
              <Input
                label="Project name"
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
              <Select
                label="Customer"
                onChange={(event) =>
                  setForm((current) => ({ ...current, customerId: event.target.value }))
                }
                value={form.customerId}
              >
                <option value="">No customer linked</option>
                {workspaceData.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Branch"
                onChange={(event) =>
                  setForm((current) => ({ ...current, branchId: event.target.value }))
                }
                value={form.branchId}
              >
                <option value="">No branch linked</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Status"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as "active" | "completed" | "archived"
                  }))
                }
                value={form.status}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </Select>
              <Input
                label="Budget"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    budgetAmount: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(form.budgetAmount)}
              />
            </div>
            <Textarea
              label="Notes"
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              value={form.notes}
            />
            <div className="form-actions">
              <Button type="submit">Save project</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Project profitability</p>
          {projectSummaries.length ? (
            projectSummaries.map((summary) => (
              <div className="list-row" key={summary.project.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/projects/${summary.project.id}`}>
                      <strong>{summary.project.name}</strong>
                    </Link>
                    <p>{summary.project.code}</p>
                  </div>
                  <StatusBadge
                    label={summary.project.status}
                    tone={summary.project.status === "active" ? "success" : "muted"}
                  />
                </div>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Collected</span>
                    <strong>{formatCurrency(summary.collectedRevenue, currentWorkspace?.currency || "USD")}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Cost base</span>
                    <strong>{formatCurrency(summary.costBase, currentWorkspace?.currency || "USD")}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Est. profit</span>
                    <strong>{formatCurrency(summary.estimatedProfit, currentWorkspace?.currency || "USD")}</strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="Create the first project to start linking revenue and costs."
              title="No projects yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
