"use client";

import { useEffect, useState } from "react";
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
  Select,
  StatusBadge,
  Textarea
} from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function StockPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    branches,
    currentBranchId,
    lowStockItems,
    recordStockAdjustment,
    saveStockProfile,
    stockProfiles
  } = useFlowV3();
  const [selectedItemId, setSelectedItemId] = useState(workspaceData.items[0]?.id || "");
  const [message, setMessage] = useState("");
  const [stockForm, setStockForm] = useState({
    isTracked: false,
    openingQuantity: 0,
    reorderLevel: 0
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    branchId: currentBranchId === "all" ? "" : currentBranchId,
    direction: "decrease" as "increase" | "decrease",
    quantity: 1,
    reason: "",
    notes: ""
  });

  if (!canAccess("view_stock")) {
    return (
      <AccessDeniedState description="Stock visibility is limited to roles with operational access." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const trackedCount = stockProfiles.filter((profile) => profile.isTracked).length;
  const outOfStock = lowStockItems.filter((entry) => entry.status === "out_of_stock");
  const lowStock = lowStockItems.filter((entry) => entry.status === "low_stock");
  const selectedItem = workspaceData.items.find((item) => item.id === selectedItemId);
  const selectedProfile = stockProfiles.find((profile) => profile.itemId === selectedItemId);

  useEffect(() => {
    if (selectedProfile) {
      setStockForm({
        isTracked: selectedProfile.isTracked,
        openingQuantity: selectedProfile.openingQuantity,
        reorderLevel: selectedProfile.reorderLevel
      });
    }
  }, [selectedProfile]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Inventory-lite"
        title="Simple stock visibility for businesses that need it."
        description="Turn stock tracking on only where it matters, record adjustments, and catch low-stock issues before they disrupt operations."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Tracked items" value={String(trackedCount)} />
        <MetricCard label="Low stock" tone="warning" value={String(lowStock.length)} />
        <MetricCard label="Out of stock" tone="danger" value={String(outOfStock.length)} />
        <MetricCard
          label="Branch filter"
          value={currentBranchId === "all" ? "All branches" : branches.find((branch) => branch.id === currentBranchId)?.name || "All branches"}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Configure item stock</p>
          {workspaceData.items.length ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedItemId) {
                  return;
                }
                setMessage(saveStockProfile(selectedItemId, stockForm).message);
              }}
            >
              <Select
                label="Item"
                onChange={(event) => setSelectedItemId(event.target.value)}
                value={selectedItemId}
              >
                {workspaceData.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              <label className="field">
                <span>Stock tracking</span>
                <select
                  className="select"
                  onChange={(event) =>
                    setStockForm((current) => ({
                      ...current,
                      isTracked: event.target.value === "true"
                    }))
                  }
                  value={String(stockForm.isTracked)}
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </label>
              <div className="form-grid">
                <Input
                  label="Opening quantity"
                  onChange={(event) =>
                    setStockForm((current) => ({
                      ...current,
                      openingQuantity: Number(event.target.value)
                    }))
                  }
                  type="number"
                  value={String(stockForm.openingQuantity)}
                />
                <Input
                  label="Reorder level"
                  onChange={(event) =>
                    setStockForm((current) => ({
                      ...current,
                      reorderLevel: Number(event.target.value)
                    }))
                  }
                  type="number"
                  value={String(stockForm.reorderLevel)}
                />
              </div>
              <div className="form-actions">
                <Button type="submit">Save stock settings</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="Create items first, then enable stock tracking for the ones that need quantity control."
              title="No items yet"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Record stock adjustment</p>
          {selectedItem ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(recordStockAdjustment(selectedItem.id, adjustmentForm).message);
              }}
            >
              <div className="form-grid">
                <Select
                  label="Branch"
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      branchId: event.target.value
                    }))
                  }
                  value={adjustmentForm.branchId}
                >
                  <option value="">All / default branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Direction"
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      direction: event.target.value as "increase" | "decrease"
                    }))
                  }
                  value={adjustmentForm.direction}
                >
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </Select>
                <Input
                  label="Quantity"
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      quantity: Number(event.target.value)
                    }))
                  }
                  type="number"
                  value={String(adjustmentForm.quantity)}
                />
                <Input
                  label="Reason"
                  onChange={(event) =>
                    setAdjustmentForm((current) => ({
                      ...current,
                      reason: event.target.value
                    }))
                  }
                  value={adjustmentForm.reason}
                />
              </div>
              <Textarea
                label="Notes"
                onChange={(event) =>
                  setAdjustmentForm((current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
                value={adjustmentForm.notes}
              />
              <div className="form-actions">
                <Button type="submit">Save adjustment</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="Select an item in the stock settings panel to record a controlled stock adjustment."
              title="No item selected"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Stock watchlist</p>
        {lowStockItems.length ? (
          lowStockItems.map((entry) => (
            <div className="list-row" key={entry.item.id}>
              <div className="list-title">
                <div>
                  <strong>{entry.item.name}</strong>
                  <p>{entry.item.category || entry.item.kind}</p>
                </div>
                <StatusBadge
                  label={entry.status.replace("_", " ")}
                  tone={
                    entry.status === "out_of_stock"
                      ? "danger"
                      : entry.status === "low_stock"
                        ? "warning"
                        : "success"
                  }
                />
              </div>
              <div className="stats-inline">
                <div className="info-pair">
                  <span>On hand</span>
                  <strong>{entry.quantity}</strong>
                </div>
                <div className="info-pair">
                  <span>Reorder level</span>
                  <strong>{entry.profile?.reorderLevel || 0}</strong>
                </div>
                <div className="info-pair">
                  <span>Sell price</span>
                  <strong>{formatCurrency(entry.item.sellingPrice, currency)}</strong>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            description="Tracked items and alerts will appear here once stock is enabled."
            title="No stock alerts"
          />
        )}
      </Card>
    </div>
  );
}
