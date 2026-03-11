"use client";

import Link from "next/link";
import { useState } from "react";
import { ItemForm } from "@/components/items/item-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function ItemsPage() {
  const { currentWorkspace, saveItem, workspaceData } = useBusinessOS();
  const { lowStockItems, saveStockProfile } = useFlowV3();
  const [search, setSearch] = useState("");
  const currency = currentWorkspace?.currency || "USD";

  const filteredItems = workspaceData.items.filter((item) =>
    [item.name, item.description, item.category, item.sku]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Products & services"
        title="Items ready for quotes and invoices."
        description="Keep the item catalog clear: services, products, prices, optional costs, stock settings, and active/inactive states."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Add item</p>
          <ItemForm
            onSubmit={(value) => {
              const result = saveItem(value);
              if (result.success && result.id) {
                saveStockProfile(result.id, {
                  isTracked: value.isTracked,
                  openingQuantity: value.openingQuantity,
                  reorderLevel: value.reorderLevel
                });
              }
              return result;
            }}
          />
        </Card>

        <Card>
          <p className="eyebrow">Search items</p>
          <Input
            label="Search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by item, category, description, or SKU"
            value={search}
          />
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <div className="list-row" key={item.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/items/${item.id}`}>
                      <strong>{item.name}</strong>
                    </Link>
                    <p>{item.description || "No description"}</p>
                  </div>
                  <StatusBadge
                    label={item.isActive ? "active" : "inactive"}
                    tone={item.isActive ? "success" : "muted"}
                  />
                </div>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Price</span>
                    <strong>{formatCurrency(item.sellingPrice, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Cost</span>
                    <strong>{formatCurrency(item.cost || 0, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Stock</span>
                    <strong>
                      {lowStockItems.find((entry) => entry.item.id === item.id)?.quantity ?? "Not tracked"}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="Use the form on the left to create your first product or service."
              title="No items match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
