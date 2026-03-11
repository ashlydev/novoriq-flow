"use client";

import { useParams } from "next/navigation";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/shared/ui";

export default function NetworkOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const { canAccess } = useBusinessOS();
  const {
    convertPurchaseOrderToPurchase,
    currentBusinessId,
    getBusinessProfile,
    purchaseOrders,
    reorderFromPurchaseOrder,
    updatePurchaseOrderStatus
  } = useFlowV4();
  const order = purchaseOrders.find((entry) => entry.id === params.orderId);

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Order detail is limited to roles with network access." />
    );
  }

  if (!order) {
    return (
      <EmptyState
        action={<Button href="/app/network/orders">Back to orders</Button>}
        description="The purchase order could not be found."
        title="Order not found"
      />
    );
  }

  const isBuyer = order.buyerBusinessId === currentBusinessId;
  const buyer = getBusinessProfile(order.buyerBusinessId);
  const supplier = getBusinessProfile(order.supplierBusinessId);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Purchase order detail"
        title={order.reference}
        description={`${buyer?.displayName || "Buyer"} to ${supplier?.displayName || "Supplier"}.`}
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Order summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
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
              </strong>
            </div>
            <div className="info-pair">
              <span>Buyer</span>
              <strong>{buyer?.displayName || "Unknown"}</strong>
            </div>
            <div className="info-pair">
              <span>Supplier</span>
              <strong>{supplier?.displayName || "Unknown"}</strong>
            </div>
            <div className="info-pair">
              <span>Issue date</span>
              <strong>{new Date(order.issueDate).toLocaleDateString()}</strong>
            </div>
            <div className="info-pair">
              <span>Expected</span>
              <strong>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : "Not set"}</strong>
            </div>
          </div>
          <p style={{ marginTop: 16 }}>{order.notes || "No order notes."}</p>
          <p>{order.instructions || "No instructions."}</p>
        </Card>

        <Card>
          <p className="eyebrow">Actions</p>
          <div className="button-row">
            {!isBuyer && canAccess("manage_purchase_orders") ? (
              <>
                <Button onClick={() => updatePurchaseOrderStatus(order.id, "viewed")} type="button">
                  Mark viewed
                </Button>
                <Button onClick={() => updatePurchaseOrderStatus(order.id, "accepted")} type="button">
                  Accept
                </Button>
                <Button kind="danger" onClick={() => updatePurchaseOrderStatus(order.id, "rejected")} type="button">
                  Reject
                </Button>
                <Button kind="secondary" onClick={() => updatePurchaseOrderStatus(order.id, "fulfilled")} type="button">
                  Fulfill
                </Button>
              </>
            ) : null}
            {isBuyer && canAccess("manage_purchase_orders") ? (
              <>
                <Button kind="danger" onClick={() => updatePurchaseOrderStatus(order.id, "cancelled")} type="button">
                  Cancel
                </Button>
                <Button kind="secondary" onClick={() => reorderFromPurchaseOrder(order.id)} type="button">
                  Repeat order
                </Button>
              </>
            ) : null}
            {isBuyer && canAccess("manage_purchases") && !order.linkedPurchaseId ? (
              <Button onClick={() => convertPurchaseOrderToPurchase(order.id)} type="button">
                Convert to purchase
              </Button>
            ) : null}
            {order.linkedPurchaseId ? (
              <Button href={`/app/purchases/${order.linkedPurchaseId}`} kind="secondary">
                Open purchase
              </Button>
            ) : null}
          </div>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Line items</p>
        {order.lineItems.map((lineItem) => (
          <div className="list-row" key={lineItem.id}>
            <div className="list-title">
              <strong>{lineItem.name}</strong>
              <strong>{(lineItem.quantity * lineItem.unitPrice).toFixed(2)}</strong>
            </div>
            <p>
              {lineItem.quantity} × {lineItem.unitPrice.toFixed(2)} / {lineItem.unit}
            </p>
            <p>{lineItem.description || "No line description."}</p>
          </div>
        ))}
      </Card>

      <Card>
        <p className="eyebrow">Order history</p>
        {order.history.map((entry) => (
          <div className="list-row" key={entry.id}>
            <div className="list-title">
              <strong>{entry.status.replaceAll("_", " ")}</strong>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p>{entry.note || "No note added."}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
