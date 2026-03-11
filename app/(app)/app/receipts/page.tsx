"use client";

import Link from "next/link";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Card, EmptyState, PageHeader } from "@/components/shared/ui";
import { formatCurrency, formatDate } from "@/lib/calculations";

export default function ReceiptsPage() {
  const { currentWorkspace, workspaceData } = useBusinessOS();
  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Receipts"
        title="Receipt history and reprints."
        description="Every recorded payment generates a clean receipt linked back to the source invoice."
      />

      <Card>
        {workspaceData.receipts.length ? (
          workspaceData.receipts.map((receipt) => {
            const payment = workspaceData.payments.find(
              (record) => record.id === receipt.paymentId
            );
            const invoice = workspaceData.invoices.find(
              (record) => record.id === receipt.invoiceId
            );

            return (
              <div className="list-row" key={receipt.id}>
                <div className="list-title">
                  <Link href={`/app/receipts/${receipt.id}`}>
                    <strong>{receipt.reference}</strong>
                  </Link>
                  <strong>{formatCurrency(payment?.amount || 0, currency)}</strong>
                </div>
                <p>
                  {invoice?.reference || "Unknown invoice"} · {formatDate(receipt.receiptDate)}
                </p>
              </div>
            );
          })
        ) : (
          <EmptyState
            description="Receipts will start appearing as soon as payments are recorded against invoices."
            title="No receipts yet"
          />
        )}
      </Card>
    </div>
  );
}
