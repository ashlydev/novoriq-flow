"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  Textarea
} from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    archiveProject,
    branches,
    getRecordBranchId,
    linkRecordMeta,
    projects,
    projectSummaries,
    saveProject
  } = useFlowV3();
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

  const project = projects.find((record) => record.id === params.projectId);
  const summary = projectSummaries.find((record) => record.project.id === params.projectId);
  const customer = workspaceData.customers.find((record) => record.id === project?.customerId);
  const branch = branches.find((record) => record.id === project?.branchId);

  useEffect(() => {
    if (!project) {
      return;
    }

    setForm({
      name: project.name,
      code: project.code,
      customerId: project.customerId || "",
      branchId: project.branchId || "",
      status: project.status,
      notes: project.notes || "",
      budgetAmount: project.budgetAmount || 0
    });
  }, [project]);

  if (!project || !summary) {
    return (
      <EmptyState
        action={<Button href="/app/projects">Back to projects</Button>}
        description="The project could not be found."
        title="Project not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Project detail"
        title={project.name}
        description="Link revenue and cost records to the job and watch the profitability picture improve."
        action={
          canAccess("manage_projects") ? (
            <Button
              kind="danger"
              onClick={() => setMessage(archiveProject(project.id).message)}
              type="button"
            >
              Archive project
            </Button>
          ) : null
        }
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="two-col">
        <Card>
          <p className="eyebrow">Edit project</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(saveProject(form, project.id).message);
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
            </div>
            <div className="form-grid">
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
          <p className="eyebrow">Profitability snapshot</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={project.status}
                  tone={project.status === "active" ? "success" : "muted"}
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Invoiced</span>
              <strong>{formatCurrency(summary.invoicedRevenue, currentWorkspace?.currency || "USD")}</strong>
            </div>
            <div className="info-pair">
              <span>Collected</span>
              <strong>{formatCurrency(summary.collectedRevenue, currentWorkspace?.currency || "USD")}</strong>
            </div>
            <div className="info-pair">
              <span>Cost base</span>
              <strong>{formatCurrency(summary.costBase, currentWorkspace?.currency || "USD")}</strong>
            </div>
            <div className="info-pair">
              <span>Estimated profit</span>
              <strong>{formatCurrency(summary.estimatedProfit, currentWorkspace?.currency || "USD")}</strong>
            </div>
            <div className="info-pair">
              <span>Customer</span>
              <strong>{customer?.name || "Not linked"}</strong>
            </div>
            <div className="info-pair">
              <span>Branch</span>
              <strong>{branch?.name || "Not linked"}</strong>
            </div>
            <div className="info-pair">
              <span>Budget</span>
              <strong>{formatCurrency(project.budgetAmount || 0, currentWorkspace?.currency || "USD")}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Link invoices</p>
          {workspaceData.invoices.map((invoice) => (
            <div className="list-row" key={invoice.id}>
              <div className="list-title">
                <strong>{invoice.reference}</strong>
                <span>{getRecordBranchId("invoice", invoice.id) || "No branch"}</span>
              </div>
              <div className="button-row">
                <Button
                  onClick={() =>
                    setMessage(
                      linkRecordMeta("invoice", invoice.id, {
                        branchId: getRecordBranchId("invoice", invoice.id),
                        projectId: project.id
                      }).message
                    )
                  }
                  type="button"
                >
                  Link to project
                </Button>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Link expenses & purchases</p>
          {[...workspaceData.expenses, ...workspaceData.purchases].map((record) => {
            const label = "description" in record ? record.description : record.reference;
            const entityType = "description" in record ? "expense" : "purchase";
            return (
              <div className="list-row" key={record.id}>
                <div className="list-title">
                  <strong>{label}</strong>
                  <span>{entityType}</span>
                </div>
                <Button
                  onClick={() =>
                    setMessage(
                      linkRecordMeta(entityType, record.id, {
                        branchId: getRecordBranchId(entityType, record.id),
                        projectId: project.id
                      }).message
                    )
                  }
                  type="button"
                >
                  Link to project
                </Button>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
