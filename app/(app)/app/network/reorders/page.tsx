"use client";

import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useState } from "react";
import { Button, Card, EmptyState, MetricCard, PageHeader } from "@/components/shared/ui";

export default function NetworkReordersPage() {
  const { canAccess } = useBusinessOS();
  const { reorderFromPurchaseOrder, reorderFromPurchaseRecord, reorderSuggestions } = useFlowV4();
  const [message, setMessage] = useState("");

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Reorder recommendations are limited to roles with network access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Reorders"
        title="Repeat supplier orders with less friction."
        description="Use prior orders and purchase history to send repeat requests faster."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Reorder suggestions" value={String(reorderSuggestions.length)} />
        <MetricCard
          label="From purchase orders"
          value={String(reorderSuggestions.filter((entry) => entry.source === "purchase_order").length)}
        />
        <MetricCard
          label="From purchases"
          value={String(reorderSuggestions.filter((entry) => entry.source === "purchase").length)}
        />
        <MetricCard label="Fast repeat sources" value={String(new Set(reorderSuggestions.map((entry) => entry.businessId)).size)} />
      </div>

      <Card>
        <p className="eyebrow">Recommended reorders</p>
        {reorderSuggestions.length ? (
          reorderSuggestions.map((suggestion) => (
            <div className="list-row" key={suggestion.id}>
              <div className="list-title">
                <div>
                  <strong>{suggestion.title}</strong>
                  <p>{suggestion.businessName}</p>
                </div>
                <Button
                  onClick={() => {
                    const result =
                      suggestion.source === "purchase_order"
                        ? reorderFromPurchaseOrder(suggestion.id.replace("order-", ""))
                        : reorderFromPurchaseRecord(suggestion.id.replace("purchase-", ""));
                    setMessage(result.message);
                  }}
                  type="button"
                >
                  Repeat order
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            description="Repeat opportunities will appear once you start sending network orders or linking purchases to supplier businesses."
            title="No reorder suggestions yet"
          />
        )}
      </Card>
    </div>
  );
}
