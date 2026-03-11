"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge } from "@/components/shared/ui";

export default function NetworkCatalogDetailPage() {
  const params = useParams<{ catalogId: string }>();
  const { canAccess } = useBusinessOS();
  const {
    createPurchaseOrder,
    createRFQ,
    currentBusinessId,
    getBusinessProfile,
    getCatalogItems,
    visibleCatalogs
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [requestMode, setRequestMode] = useState<"po" | "rfq">("po");

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Catalog detail is limited to roles with network access." />
    );
  }

  const catalog = visibleCatalogs.find((entry) => entry.id === params.catalogId);
  if (!catalog) {
    return (
      <EmptyState
        action={<Button href="/app/network/catalogs">Back to catalogs</Button>}
        description="The catalog does not exist or is not visible to your business."
        title="Catalog not found"
      />
    );
  }

  const owner = getBusinessProfile(catalog.businessProfileId);
  const items = getCatalogItems(catalog.id);
  const selectedLineItems = items
    .filter((item) => (quantities[item.id] || 0) > 0)
    .map((item) => ({
      id: `line-${item.id}`,
      catalogItemId: item.id,
      name: item.name,
      description: item.description,
      quantity: quantities[item.id] || 0,
      unit: item.unit,
      unitPrice: item.price
    }));

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Catalog detail"
        title={catalog.title}
        description={`${owner?.displayName || "Business"} · ${catalog.visibility}`}
        action={owner ? <Button href={`/app/network/businesses/${owner.id}`}>Open business</Button> : null}
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Items" value={String(items.length)} />
        <MetricCard label="Visibility" value={catalog.visibility} />
        <MetricCard label="Status" value={catalog.status} />
        <MetricCard
          label="Selected lines"
          value={String(selectedLineItems.length)}
          tone={selectedLineItems.length ? "success" : "default"}
        />
      </div>

      <Card>
        <p className="eyebrow">Catalog items</p>
        {items.length ? (
          items.map((item) => (
            <div className="list-row" key={item.id}>
              <div className="list-title">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description || item.category || item.unit}</p>
                </div>
                <div className="button-row">
                  <StatusBadge label={item.availability.replaceAll("_", " ")} tone={item.availability === "available" ? "success" : item.availability === "limited" ? "warning" : "danger"} />
                  <strong>{item.price.toFixed(2)} / {item.unit}</strong>
                </div>
              </div>
              {catalog.businessProfileId !== currentBusinessId ? (
                <Input
                  label="Quantity for request"
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      [item.id]: Number(event.target.value)
                    }))
                  }
                  type="number"
                  value={String(quantities[item.id] || 0)}
                />
              ) : null}
            </div>
          ))
        ) : (
          <EmptyState
            description="This catalog does not have any items yet."
            title="No catalog items"
          />
        )}
      </Card>

      {catalog.businessProfileId !== currentBusinessId ? (
        <Card>
          <p className="eyebrow">Order or request from this catalog</p>
          <div className="form-grid">
            <Select
              label="Action"
              onChange={(event) => setRequestMode(event.target.value as "po" | "rfq")}
              value={requestMode}
            >
              <option value="po">Purchase order</option>
              <option value="rfq">Request quote</option>
            </Select>
          </div>
          <div className="form-actions">
            <Button
              onClick={() => {
                if (!selectedLineItems.length) {
                  setMessage("Select at least one catalog item quantity.");
                  return;
                }
                if (requestMode === "po") {
                  setMessage(
                    createPurchaseOrder({
                      supplierBusinessId: catalog.businessProfileId,
                      issueDate: new Date().toISOString(),
                      sourceCatalogId: catalog.id,
                      notes: `Order created from ${catalog.title}.`,
                      lineItems: selectedLineItems
                    }).message
                  );
                  return;
                }

                setMessage(
                  createRFQ({
                    title: `RFQ from ${catalog.title}`,
                    notes: `Quote request based on ${catalog.title}.`,
                    supplierBusinessIds: [catalog.businessProfileId],
                    lineItems: selectedLineItems.map((lineItem) => ({
                      id: lineItem.id,
                      name: lineItem.name,
                      description: lineItem.description,
                      quantity: lineItem.quantity,
                      unit: lineItem.unit
                    }))
                  }).message
                );
              }}
              type="button"
            >
              {requestMode === "po" ? "Create purchase order" : "Create RFQ"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
