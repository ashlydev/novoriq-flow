"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { Card, EmptyState, PageHeader } from "@/components/shared/ui";
import { formatCurrency, formatDate } from "@/lib/calculations";

export default function ReceiptDetailPage() {
  const params = useParams<{ receiptId: string }>();
  const { currentWorkspace, logReceiptReprint, workspaceData } = useBusinessOS();
  const { templateSettings } = useFlowV3();
  const currency = currentWorkspace?.currency || "USD";

  const receipt = workspaceData.receipts.find((record) => record.id === params.receiptId);
  const payment = workspaceData.payments.find((record) => record.id === receipt?.paymentId);
  const invoice = workspaceData.invoices.find((record) => record.id === receipt?.invoiceId);
  const customer = workspaceData.customers.find(
    (record) => record.id === invoice?.customerId
  );

  if (!receipt || !payment || !invoice) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/receipts">
            Back to receipts
          </Link>
        }
        description="The receipt or linked records could not be found."
        title="Receipt not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Receipt detail"
        title={receipt.reference}
        description="Professional payment confirmation linked directly to the source invoice."
        action={
          <button
            className="button button-secondary"
            onClick={() => {
              logReceiptReprint(receipt.id);
              window.print();
            }}
            type="button"
          >
            Print receipt
          </button>
        }
      />

      <Card>
        <div className="split-line">
          <div>
            <p className="eyebrow">Issued by</p>
            <h2>{currentWorkspace?.name}</h2>
            <p>{currentWorkspace?.email}</p>
            <p>{currentWorkspace?.phone}</p>
          </div>
          <div>
            <p className="eyebrow">Receipt</p>
            <h2>{receipt.reference}</h2>
            <p>{formatDate(receipt.receiptDate)}</p>
          </div>
        </div>
        <div className="split-line" style={{ marginTop: 24 }}>
          <div>
            <p className="eyebrow">Received from</p>
            <strong>{customer?.name || "Unknown customer"}</strong>
            <p>{customer?.email || customer?.phone || "No primary contact set"}</p>
          </div>
          <div>
            <p className="eyebrow">Linked invoice</p>
            <strong>{invoice.reference}</strong>
            <p>{formatDate(invoice.issueDate)}</p>
          </div>
        </div>
        <div className="panel-stack" style={{ marginTop: 24 }}>
          <div className="summary-line">
            <span>Amount received</span>
            <strong>{formatCurrency(payment.amount, currency)}</strong>
          </div>
          <div className="summary-line">
            <span>Method</span>
            <strong>{payment.method.replace("_", " ")}</strong>
          </div>
          <div className="summary-line">
            <span>Reference</span>
            <strong>{payment.reference || "Not provided"}</strong>
          </div>
          <div className="summary-line">
            <span>Template</span>
            <strong>{templateSettings.receiptStyle}</strong>
          </div>
          {templateSettings.footerNote ? (
            <div className="summary-line">
              <span>Footer</span>
              <strong>{templateSettings.footerNote}</strong>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
