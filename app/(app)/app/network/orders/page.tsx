"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { NetworkPurchaseOrder, PurchaseOrderLineItem } from "@/lib/v4-types";

type PurchaseOrderDraftLine = PurchaseOrderLineItem & {
  description: string;
};

function createLine(): PurchaseOrderDraftLine {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: 1,
    unit: "unit",
    unitPrice: 0
  };
}

export default function NetworkOrdersPage() {
  const { canAccess } = useBusinessOS();
  const {
    createPurchaseOrder,
    currentBusinessId,
    discoverableBusinesses,
    getBusinessCatalogs,
    getBusinessProfile,
    getCatalogItems,
    incomingPurchaseOrders,
    outgoingPurchaseOrders,
    purchaseOrders
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<NetworkPurchaseOrder["status"] | "all">("all");
  const [form, setForm] = useState<{
    supplierBusinessId: string;
    issueDate: string;
    expectedDate: string;
    notes: string;
    instructions: string;
    sourceCatalogId: string;
    lineItems: PurchaseOrderDraftLine[];
  }>({
    supplierBusinessId: discoverableBusinesses[0]?.id || "",
    issueDate: new Date().toISOString().slice(0, 10),
    expectedDate: "",
    notes: "",
    instructions: "",
    sourceCatalogId: "",
    lineItems: [createLine()]
  });

  const supplierCatalogItems = form.supplierBusinessId
    ? getBusinessCatalogs(form.supplierBusinessId).flatMap((catalog) => getCatalogItems(catalog.id))
    : [];

  const filteredOrders = useMemo(
    () =>
      purchaseOrders.filter((order) =>
        statusFilter === "all" ? true : order.status === statusFilter
      ),
    [purchaseOrders, statusFilter]
  );

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Network purchase orders are limited to roles with network access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Purchase orders"
        title="Send and receive digital purchase orders."
        description="Use controlled supplier relationships, track status transitions, and bridge accepted orders into the internal purchase workflow where needed."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Outgoing" value={String(outgoingPurchaseOrders.length)} />
        <MetricCard label="Incoming" value={String(incomingPurchaseOrders.length)} />
        <MetricCard
          label="Awaiting response"
          tone="warning"
          value={String(outgoingPurchaseOrders.filter((order) => ["sent", "viewed"].includes(order.status)).length)}
        />
        <MetricCard
          label="Accepted / fulfilled"
          tone="success"
          value={String(purchaseOrders.filter((order) => ["accepted", "fulfilled", "partially_fulfilled"].includes(order.status)).length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create purchase order</p>
          {canAccess("manage_purchase_orders") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  createPurchaseOrder({
                    ...form,
                    issueDate: new Date(form.issueDate).toISOString(),
                    expectedDate: form.expectedDate ? new Date(form.expectedDate).toISOString() : undefined
                  }).message
                );
              }}
            >
              <div className="form-grid">
                <Select
                  label="Supplier"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      supplierBusinessId: event.target.value
                    }))
                  }
                  value={form.supplierBusinessId}
                >
                  <option value="">Select supplier</option>
                  {discoverableBusinesses.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.displayName}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Issue date"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, issueDate: event.target.value }))
                  }
                  type="date"
                  value={form.issueDate}
                />
                <Input
                  label="Expected date"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, expectedDate: event.target.value }))
                  }
                  type="date"
                  value={form.expectedDate}
                />
                <Select
                  label="Source catalog"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sourceCatalogId: event.target.value }))
                  }
                  value={form.sourceCatalogId}
                >
                  <option value="">No catalog linked</option>
                  {form.supplierBusinessId
                    ? getBusinessCatalogs(form.supplierBusinessId).map((catalog) => (
                        <option key={catalog.id} value={catalog.id}>
                          {catalog.title}
                        </option>
                      ))
                    : null}
                </Select>
              </div>
              {form.lineItems.map((lineItem, index) => (
                <Card className="document-line" key={lineItem.id}>
                  <div className="split-line">
                    <strong>PO line {index + 1}</strong>
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
                    <Select
                      label="Catalog item"
                      onChange={(event) => {
                        const item = supplierCatalogItems.find((entry) => entry.id === event.target.value);
                        if (!item) {
                          return;
                        }
                        setForm((current) => ({
                          ...current,
                          lineItems: current.lineItems.map((entry) =>
                            entry.id === lineItem.id
                              ? {
                                  ...entry,
                                  catalogItemId: item.id,
                                  name: item.name,
                                  description: item.description || "",
                                  unit: item.unit,
                                  unitPrice: item.price
                                }
                              : entry
                          )
                        }));
                      }}
                      value={lineItem.catalogItemId || ""}
                    >
                      <option value="">Custom line</option>
                      {supplierCatalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
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
                      label="Unit price"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lineItems: current.lineItems.map((entry) =>
                            entry.id === lineItem.id
                              ? { ...entry, unitPrice: Number(event.target.value) }
                              : entry
                          )
                        }))
                      }
                      type="number"
                      value={String(lineItem.unitPrice)}
                    />
                  </div>
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
                      lineItems: [...current.lineItems, createLine()]
                    }))
                  }
                  type="button"
                >
                  Add line
                </Button>
              </div>
              <Textarea
                label="Notes"
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                value={form.notes}
              />
              <Textarea
                label="Instructions"
                onChange={(event) =>
                  setForm((current) => ({ ...current, instructions: event.target.value }))
                }
                value={form.instructions}
              />
              <div className="form-actions">
                <Button type="submit">Send purchase order</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="PO creation is limited to roles allowed to run supplier ordering."
              title="PO creation restricted"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Order history</p>
          <Select
            label="Status"
            onChange={(event) =>
              setStatusFilter(event.target.value as NetworkPurchaseOrder["status"] | "all")
            }
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
            <option value="partially_fulfilled">Partially fulfilled</option>
          </Select>
          {filteredOrders.length ? (
            filteredOrders.map((order) => {
              const counterparty =
                order.buyerBusinessId === currentBusinessId
                  ? getBusinessProfile(order.supplierBusinessId)
                  : getBusinessProfile(order.buyerBusinessId);
              return (
                <div className="list-row" key={order.id}>
                  <div className="list-title">
                    <div>
                      <Link href={`/app/network/orders/${order.id}`}>
                        <strong>{order.reference}</strong>
                      </Link>
                      <p>{counterparty?.displayName || "Business"}</p>
                    </div>
                    <StatusBadge
                      label={order.status.replaceAll("_", " ")}
                      tone={
                        ["accepted", "fulfilled"].includes(order.status)
                          ? "success"
                          : ["rejected", "cancelled"].includes(order.status)
                            ? "danger"
                            : ["sent", "viewed", "partially_fulfilled"].includes(order.status)
                              ? "warning"
                              : "muted"
                      }
                    />
                  </div>
                  <p>{order.lineItems.length} lines</p>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Orders will appear once you start trading through the network."
              title="No purchase orders match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
