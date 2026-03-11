"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { NetworkRFQ } from "@/lib/v4-types";

function createRFQLine() {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: 1,
    unit: "unit"
  };
}

export default function NetworkRFQsPage() {
  const { canAccess } = useBusinessOS();
  const {
    createRFQ,
    discoverableBusinesses,
    getBusinessProfile,
    incomingRFQRecipients,
    outgoingRFQs,
    rfqs
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<NetworkRFQ["status"] | "all">("all");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    dueDate: "",
    notes: "",
    lineItems: [createRFQLine()]
  });

  const filteredRFQs = useMemo(
    () => rfqs.filter((rfq) => (statusFilter === "all" ? true : rfq.status === statusFilter)),
    [rfqs, statusFilter]
  );

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="RFQs are limited to roles with network access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="RFQs"
        title="Request quotes from connected suppliers."
        description="Create multi-supplier quote requests, compare responses, and turn the accepted option into the next purchasing step."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Outgoing RFQs" value={String(outgoingRFQs.length)} />
        <MetricCard label="Incoming RFQs" value={String(incomingRFQRecipients.length)} />
        <MetricCard
          label="Waiting on suppliers"
          tone="warning"
          value={String(outgoingRFQs.filter((rfq) => ["sent"].includes(rfq.status)).length)}
        />
        <MetricCard
          label="Responded"
          tone="success"
          value={String(outgoingRFQs.filter((rfq) => ["responded", "accepted"].includes(rfq.status)).length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create RFQ</p>
          {canAccess("manage_rfqs") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  createRFQ({
                    title: form.title,
                    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
                    notes: form.notes,
                    supplierBusinessIds: selectedSuppliers,
                    lineItems: form.lineItems
                  }).message
                );
              }}
            >
              <Input
                label="RFQ title"
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                value={form.title}
              />
              <Input
                label="Due date"
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueDate: event.target.value }))
                }
                type="date"
                value={form.dueDate}
              />
              <Textarea
                label="Notes"
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                value={form.notes}
              />
              <div className="panel-stack">
                <strong>Select suppliers</strong>
                {discoverableBusinesses.map((profile) => (
                  <label key={profile.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      checked={selectedSuppliers.includes(profile.id)}
                      onChange={(event) =>
                        setSelectedSuppliers((current) =>
                          event.target.checked
                            ? [...current, profile.id]
                            : current.filter((value) => value !== profile.id)
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      {profile.displayName} · {profile.city}
                    </span>
                  </label>
                ))}
              </div>
              {form.lineItems.map((lineItem, index) => (
                <Card className="document-line" key={lineItem.id}>
                  <div className="split-line">
                    <strong>RFQ line {index + 1}</strong>
                    <Button
                      kind="ghost"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          lineItems:
                            current.lineItems.length === 1
                              ? current.lineItems
                              : current.lineItems.filter((entry) => entry.id !== lineItem.id)
                        }))
                      }
                      type="button"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="line-grid">
                    <Input
                      label="Name"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lineItems: current.lineItems.map((entry) =>
                            entry.id === lineItem.id ? { ...entry, name: event.target.value } : entry
                          )
                        }))
                      }
                      value={lineItem.name}
                    />
                    <Input
                      label="Quantity"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lineItems: current.lineItems.map((entry) =>
                            entry.id === lineItem.id
                              ? { ...entry, quantity: Number(event.target.value) }
                              : entry
                          )
                        }))
                      }
                      type="number"
                      value={String(lineItem.quantity)}
                    />
                    <Input
                      label="Unit"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lineItems: current.lineItems.map((entry) =>
                            entry.id === lineItem.id ? { ...entry, unit: event.target.value } : entry
                          )
                        }))
                      }
                      value={lineItem.unit}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lineItems: current.lineItems.map((entry) =>
                          entry.id === lineItem.id
                            ? { ...entry, description: event.target.value }
                            : entry
                        )
                      }))
                    }
                    value={lineItem.description}
                  />
                </Card>
              ))}
              <div className="form-actions">
                <Button
                  kind="secondary"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      lineItems: [...current.lineItems, createRFQLine()]
                    }))
                  }
                  type="button"
                >
                  Add line
                </Button>
                <Button type="submit">Send RFQ</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="RFQ creation is limited to roles that can manage supplier sourcing."
              title="RFQ creation restricted"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">RFQ history</p>
          <Select
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value as NetworkRFQ["status"] | "all")}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="responded">Responded</option>
            <option value="accepted">Accepted</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {filteredRFQs.length ? (
            filteredRFQs.map((rfq) => (
              <div className="list-row" key={rfq.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/network/rfqs/${rfq.id}`}>
                      <strong>{rfq.reference}</strong>
                    </Link>
                    <p>{rfq.title}</p>
                  </div>
                  <StatusBadge
                    label={rfq.status}
                    tone={
                      rfq.status === "accepted"
                        ? "success"
                        : rfq.status === "responded"
                          ? "warning"
                          : rfq.status === "cancelled"
                            ? "danger"
                            : "muted"
                    }
                  />
                </div>
                <p>
                  {rfq.recipientIds.length} recipients
                  {rfq.requesterBusinessId !== undefined
                    ? ` · ${getBusinessProfile(rfq.requesterBusinessId)?.displayName || "Business"}`
                    : ""}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              description="RFQs will appear as soon as you start requesting supplier quotes."
              title="No RFQs match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
