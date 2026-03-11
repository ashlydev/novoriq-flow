"use client";

import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Button, Card, MetricCard, PageHeader, Input, Select, StatusBadge } from "@/components/shared/ui";
import { enterpriseModules, EnterpriseModuleKey } from "@/lib/v6-types";

export default function ExportsPage() {
  const { canAccess } = useBusinessOS();
  const { createExportJob, exportJobs } = useFlowV6();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    module: "reports" as EnterpriseModuleKey,
    title: "Executive KPI export",
    format: "csv" as const,
    filtersSummary: "Last 30 days · executive overview"
  });

  if (!canAccess("view_export_center")) {
    return (
      <AccessDeniedState description="Export center visibility is limited to roles with report and admin controls." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Exports"
        title="Export and integration readiness center."
        description="Prepare reports, admin summaries, and module exports without overbuilding a developer platform."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Jobs" value={String(exportJobs.length)} />
        <MetricCard label="Ready" tone="success" value={String(exportJobs.filter((job) => job.status === "ready").length)} />
        <MetricCard label="Queued" tone="warning" value={String(exportJobs.filter((job) => job.status === "queued").length)} />
        <MetricCard label="Failed" tone="danger" value={String(exportJobs.filter((job) => job.status === "failed").length)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create export job</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(createExportJob(form).message);
            }}
          >
            <Select
              label="Module"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  module: event.target.value as EnterpriseModuleKey
                }))
              }
              value={form.module}
            >
              {enterpriseModules.map((module) => (
                <option key={module.key} value={module.key}>
                  {module.label}
                </option>
              ))}
            </Select>
            <Input
              label="Title"
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              value={form.title}
            />
            <div className="form-grid">
              <Select
                label="Format"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    format: event.target.value as typeof current.format
                  }))
                }
                value={form.format}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </Select>
              <Input
                label="Filters summary"
                onChange={(event) =>
                  setForm((current) => ({ ...current, filtersSummary: event.target.value }))
                }
                value={form.filtersSummary}
              />
            </div>
            <div className="form-actions">
              <Button type="submit">Create export</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Integration readiness</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Exports support</span>
              <strong>Ready</strong>
            </div>
            <div className="info-pair">
              <span>Webhook readiness</span>
              <strong>Prepared</strong>
            </div>
            <div className="info-pair">
              <span>Partner data boundary</span>
              <strong>Internal first</strong>
            </div>
            <div className="info-pair">
              <span>Public API</span>
              <strong>Not exposed yet</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Export jobs</p>
        {exportJobs.map((job) => (
          <div className="list-row" key={job.id}>
            <div className="list-title">
              <div>
                <strong>{job.title}</strong>
                <p>{job.filtersSummary || "No filter summary"}</p>
              </div>
              <StatusBadge
                label={job.status}
                tone={
                  job.status === "ready"
                    ? "success"
                    : job.status === "failed"
                      ? "danger"
                      : "warning"
                }
              />
            </div>
            <p>
              {job.module} · {job.format.toUpperCase()} {job.downloadLabel ? `· ${job.downloadLabel}` : ""}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}
