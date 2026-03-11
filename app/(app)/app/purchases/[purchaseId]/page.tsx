"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PaymentForm } from "@/components/invoices/payment-form";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { AuditLogList } from "@/components/shared/audit-log-list";
import { AttachmentPanel } from "@/components/shared/attachment-panel";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getPurchaseOutstanding,
  getPurchasePayments,
  getPurchaseStatus,
  getPurchaseSummaryForRecord
} from "@/lib/calculations";

export default function PurchaseDetailPage() {
  const params = useParams<{ purchaseId: string }>();
  const {
    addAttachment,
    canAccess,
    currentWorkspace,
    deleteAttachment,
    recordPurchasePayment,
    savePurchase,
    workspaceData
  } = useBusinessOS();
  const { branches, getRecordBranchId, getRecordProjectId, projects } = useFlowV3();

  if (!canAccess("manage_purchases")) {
    return (
      <AccessDeniedState description="Purchase detail is available only to roles with supplier workflow access." />
    );
  }

  const purchase = workspaceData.purchases.find((record) => record.id === params.purchaseId);
  const supplier = workspaceData.suppliers.find(
    (record) => record.id === purchase?.supplierId
  );
  const branch = branches.find((record) => record.id === getRecordBranchId("purchase", params.purchaseId));
  const project = projects.find((record) => record.id === getRecordProjectId("purchase", params.purchaseId));
  const currency = currentWorkspace?.currency || "USD";

  if (!purchase) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/purchases">
            Back to purchases
          </Link>
        }
        description="The purchase does not exist in this workspace."
        title="Purchase not found"
      />
    );
  }

  const status = getPurchaseStatus(purchase, workspaceData.purchasePayments);
  const summary = getPurchaseSummaryForRecord(purchase);
  const outstanding = getPurchaseOutstanding(purchase, workspaceData.purchasePayments);
  const payments = getPurchasePayments(workspaceData.purchasePayments, purchase.id);
  const attachments = workspaceData.attachments.filter(
    (attachment) => attachment.entityType === "purchase" && attachment.entityId === purchase.id
  );
  const actorLabelById = Object.fromEntries(
    workspaceData.teamMembers.map((entry) => [
      entry.member.userId,
      entry.user?.fullName || entry.member.role
    ])
  );
  const auditLogs = workspaceData.auditLogs.filter(
    (log) =>
      (log.entityType === "purchase" && log.entityId === purchase.id) ||
      (log.entityType === "purchase_payment" &&
        payments.some((payment) => payment.id === log.entityId))
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Purchase detail"
        title={purchase.reference}
        description={`Supplier-side cost record for ${supplier?.name || "Unknown supplier"}.`}
        action={
          <Link className="button button-secondary" href="/app/payables">
            Open payables
          </Link>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Purchase summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={status}
                  tone={
                    status === "paid"
                      ? "success"
                      : status === "overdue"
                        ? "danger"
                        : status === "partial"
                          ? "warning"
                          : "muted"
                  }
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Total</span>
              <strong>{formatCurrency(summary.total, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Outstanding</span>
              <strong>{formatCurrency(outstanding, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Purchase date</span>
              <strong>{formatDate(purchase.purchaseDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Due date</span>
              <strong>{formatDate(purchase.dueDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Supplier</span>
              <strong>{supplier?.name || "Unknown supplier"}</strong>
            </div>
            <div className="info-pair">
              <span>Branch</span>
              <strong>{branch?.name || "Main branch"}</strong>
            </div>
            <div className="info-pair">
              <span>Project</span>
              <strong>{project?.name || "Not linked"}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Supplier payment history</p>
          {payments.length ? (
            payments.map((payment) => (
              <div className="list-row" key={payment.id}>
                <div className="list-title">
                  <strong>{formatCurrency(payment.amount, currency)}</strong>
                  <span>{formatDate(payment.paymentDate)}</span>
                </div>
                <p>
                  {payment.method.replace("_", " ")}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Supplier settlements recorded against this purchase will appear here."
              title="No supplier payments yet"
            />
          )}
        </Card>
      </div>

      {outstanding > 0 && canAccess("record_supplier_payments") ? (
        <Card>
          <p className="eyebrow">Record supplier payment</p>
          <PaymentForm
            amountLabel="Amount paid"
            maxAmount={outstanding}
            onSubmit={(value) => recordPurchasePayment(purchase.id, value)}
            submitLabel="Save supplier payment"
          />
        </Card>
      ) : null}

      <Card>
        <p className="eyebrow">Edit purchase</p>
        <PurchaseForm
          currency={currency}
          initialValue={{
            supplierId: purchase.supplierId,
            purchaseDate: purchase.purchaseDate,
            dueDate: purchase.dueDate,
            status: purchase.status,
            lineItems: purchase.lineItems,
            notes: purchase.notes
          }}
          items={workspaceData.items}
          onSubmit={(value) => savePurchase(value, purchase.id)}
          submitLabel="Update purchase"
          suppliers={workspaceData.suppliers}
        />
      </Card>

      <div className="two-col">
        <AttachmentPanel
          attachments={attachments}
          canUpload={canAccess("attach_files")}
          entityId={purchase.id}
          entityType="purchase"
          onAdd={addAttachment}
          onDelete={deleteAttachment}
        />
        <AuditLogList actorLabelById={actorLabelById} logs={auditLogs} />
      </div>
    </div>
  );
}
