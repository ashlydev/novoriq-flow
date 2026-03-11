"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ItemForm } from "@/components/items/item-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import { formatCurrency } from "@/lib/calculations";

export default function ItemDetailPage() {
  const params = useParams<{ itemId: string }>();
  const router = useRouter();
  const { archiveItem, currentWorkspace, saveItem, workspaceData } = useBusinessOS();
  const { lowStockItems, saveStockProfile } = useFlowV3();
  const currency = currentWorkspace?.currency || "USD";

  const item = workspaceData.items.find((record) => record.id === params.itemId);
  const quoteUsage = workspaceData.quotes.filter((quote) =>
    quote.lineItems.some((lineItem) => lineItem.itemId === item?.id)
  );
  const invoiceUsage = workspaceData.invoices.filter((invoice) =>
    invoice.lineItems.some((lineItem) => lineItem.itemId === item?.id)
  );
  const stockEntry = lowStockItems.find((entry) => entry.item.id === item?.id);

  if (!item) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/items">
            Back to items
          </Link>
        }
        description="The item may have been archived or does not exist in this workspace."
        title="Item not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Item detail"
        title={item.name}
        description="Adjust catalog details and see how often this item is used across quotes and invoices."
        action={
          <button
            className="button button-danger"
            onClick={() => {
              archiveItem(item.id);
              router.push("/app/items");
            }}
            type="button"
          >
            Archive
          </button>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Edit item</p>
          <ItemForm
            initialValue={{
              ...item,
              isTracked: stockEntry?.profile?.isTracked ?? false,
              openingQuantity: stockEntry?.profile?.openingQuantity ?? 0,
              reorderLevel: stockEntry?.profile?.reorderLevel ?? 0
            }}
            onSubmit={(value) => {
              const result = saveItem(value, item.id);
              if (result.success) {
                saveStockProfile(item.id, {
                  isTracked: value.isTracked,
                  openingQuantity: value.openingQuantity,
                  reorderLevel: value.reorderLevel
                });
              }
              return result;
            }}
            submitLabel="Update item"
          />
        </Card>

        <Card>
          <p className="eyebrow">Item summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={item.isActive ? "active" : "inactive"}
                  tone={item.isActive ? "success" : "muted"}
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Type</span>
              <strong>{item.kind}</strong>
            </div>
            <div className="info-pair">
              <span>Selling price</span>
              <strong>{formatCurrency(item.sellingPrice, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Optional cost</span>
              <strong>{formatCurrency(item.cost || 0, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Used in quotes</span>
              <strong>{quoteUsage.length}</strong>
            </div>
            <div className="info-pair">
              <span>Used in invoices</span>
              <strong>{invoiceUsage.length}</strong>
            </div>
            <div className="info-pair">
              <span>Stock on hand</span>
              <strong>{stockEntry?.quantity ?? "Not tracked"}</strong>
            </div>
            <div className="info-pair">
              <span>Reorder level</span>
              <strong>{stockEntry?.profile?.reorderLevel ?? "Not tracked"}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
