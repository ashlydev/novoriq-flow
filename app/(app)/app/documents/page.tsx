"use client";

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
  Select
} from "@/components/shared/ui";
import { formatDateTime } from "@/lib/calculations";

export default function DocumentsPage() {
  const { canAccess, workspaceData } = useBusinessOS();
  const {
    branches,
    documents,
    projects,
    saveDocument,
    deleteDocument
  } = useFlowV3();
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "operations" as const,
    linkedEntityType: "" as "" | "invoice" | "expense" | "purchase" | "customer" | "supplier" | "quote" | "payment" | "receipt",
    linkedEntityId: "",
    branchId: "",
    projectId: ""
  });

  if (!canAccess("view_documents")) {
    return (
      <AccessDeniedState description="Document visibility is limited to roles with operational access." />
    );
  }

  const filteredDocuments = documents.filter((document) =>
    [document.title, document.fileName, document.category]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const entityOptions = [
    ...workspaceData.invoices.map((record) => ({ entityType: "invoice" as const, id: record.id, label: record.reference })),
    ...workspaceData.quotes.map((record) => ({ entityType: "quote" as const, id: record.id, label: record.reference })),
    ...workspaceData.payments.map((record) => ({ entityType: "payment" as const, id: record.id, label: record.reference || record.id })),
    ...workspaceData.receipts.map((record) => ({ entityType: "receipt" as const, id: record.id, label: record.reference })),
    ...workspaceData.expenses.map((record) => ({ entityType: "expense" as const, id: record.id, label: record.description })),
    ...workspaceData.purchases.map((record) => ({ entityType: "purchase" as const, id: record.id, label: record.reference })),
    ...workspaceData.customers.map((record) => ({ entityType: "customer" as const, id: record.id, label: record.name })),
    ...workspaceData.suppliers.map((record) => ({ entityType: "supplier" as const, id: record.id, label: record.name }))
  ];

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canAccess("manage_documents")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = saveDocument({
        title: form.title || file.name,
        category: form.category,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataUrl: String(reader.result || ""),
        linkedEntityType: form.linkedEntityType || undefined,
        linkedEntityId: form.linkedEntityId || undefined,
        branchId: form.branchId || undefined,
        projectId: form.projectId || undefined
      });
      setMessage(result.message);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Documents vault"
        title="Keep important business files in one place."
        description="Upload contracts, project briefs, supplier documents, and finance files without building a heavy document management product."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Documents" value={String(documents.length)} />
        <MetricCard label="Projects linked" value={String(documents.filter((document) => document.projectId).length)} />
        <MetricCard label="Entity linked" value={String(documents.filter((document) => document.linkedEntityId).length)} />
        <MetricCard label="Branches covered" value={String(new Set(documents.map((document) => document.branchId).filter(Boolean)).size)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Upload document</p>
          {canAccess("manage_documents") ? (
            <div className="form-stack">
              <div className="form-grid">
                <Input
                  label="Title"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  value={form.title}
                />
                <Select
                  label="Category"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as typeof form.category
                    }))
                  }
                  value={form.category}
                >
                  <option value="operations">Operations</option>
                  <option value="contract">Contract</option>
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="project">Project</option>
                  <option value="finance">Finance</option>
                  <option value="compliance">Compliance</option>
                  <option value="identity">Identity</option>
                  <option value="other">Other</option>
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
                  label="Project"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, projectId: event.target.value }))
                  }
                  value={form.projectId}
                >
                  <option value="">No project linked</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Select
                label="Linked record"
                onChange={(event) => {
                  const selected = entityOptions.find((option) => option.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    linkedEntityId: event.target.value,
                    linkedEntityType: selected?.entityType || ""
                  }));
                }}
                value={form.linkedEntityId}
              >
                <option value="">No linked record</option>
                {entityOptions.map((option) => (
                  <option key={`${option.entityType}-${option.id}`} value={option.id}>
                    {option.entityType}: {option.label}
                  </option>
                ))}
              </Select>
              <label className="button button-secondary" style={{ cursor: "pointer" }}>
                Upload file
                <input hidden onChange={handleFileChange} type="file" />
              </label>
            </div>
          ) : (
            <EmptyState
              description="Your role can view documents, but upload access is restricted."
              title="Upload access restricted"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Search documents</p>
          <Input
            label="Search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title, file name, or category"
            value={search}
          />
          {filteredDocuments.length ? (
            filteredDocuments.map((document) => (
              <div className="list-row" key={document.id}>
                <div className="list-title">
                  <div>
                    <strong>{document.title}</strong>
                    <p>{document.fileName}</p>
                  </div>
                  <span>{document.category}</span>
                </div>
                <p>{formatDateTime(document.createdAt)}</p>
                <p>
                  {document.branchId
                    ? `Branch: ${branches.find((branch) => branch.id === document.branchId)?.name || "Linked"}`
                    : "No branch linked"}
                  {document.projectId
                    ? ` · Project: ${projects.find((project) => project.id === document.projectId)?.name || "Linked"}`
                    : ""}
                </p>
                <div className="button-row">
                  <a
                    className="button button-secondary"
                    download={document.fileName}
                    href={document.dataUrl}
                  >
                    Open
                  </a>
                  {canAccess("manage_documents") ? (
                    <Button
                      kind="danger"
                      onClick={() => setMessage(deleteDocument(document.id).message)}
                      type="button"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="Upload documents or widen the search to see more records."
              title="No documents match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
