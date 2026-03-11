"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DocumentForm } from "@/components/shared/document-form";
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
  getDocumentSummaryForRecord
} from "@/lib/calculations";

export default function QuoteDetailPage() {
  const params = useParams<{ quoteId: string }>();
  const router = useRouter();
  const { convertQuoteToInvoice, currentWorkspace, saveQuote, workspaceData } =
    useBusinessOS();
  const { branches, getRecordBranchId, getRecordProjectId, projects, templateSettings } =
    useFlowV3();

  const quote = workspaceData.quotes.find((record) => record.id === params.quoteId);
  const customer = workspaceData.customers.find(
    (record) => record.id === quote?.customerId
  );
  const branch = branches.find((record) => record.id === getRecordBranchId("quote", params.quoteId));
  const project = projects.find((record) => record.id === getRecordProjectId("quote", params.quoteId));
  const currency = currentWorkspace?.currency || "USD";

  if (!quote) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/quotes">
            Back to quotes
          </Link>
        }
        description="The quote does not exist in this workspace."
        title="Quote not found"
      />
    );
  }

  const summary = getDocumentSummaryForRecord(quote);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Quote detail"
        title={quote.reference}
        description={`Prepared for ${customer?.name || "Unknown customer"}.`}
        action={
          <div className="button-row">
            <button className="button button-secondary" onClick={() => window.print()} type="button">
              Print
            </button>
            {quote.status !== "converted" ? (
              <button
                className="button button-primary"
                onClick={() => {
                  const result = convertQuoteToInvoice(quote.id);
                  if (result.success && result.id) {
                    router.push(`/app/invoices/${result.id}`);
                  }
                }}
                type="button"
              >
                Convert to invoice
              </button>
            ) : null}
          </div>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Quote summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={quote.status}
                  tone={
                    quote.status === "accepted" || quote.status === "converted"
                      ? "success"
                      : quote.status === "rejected" || quote.status === "expired"
                        ? "danger"
                        : quote.status === "sent"
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
              <span>Issue date</span>
              <strong>{formatDate(quote.issueDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Expiry date</span>
              <strong>{formatDate(quote.expiryDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Template</span>
              <strong>{templateSettings.quoteStyle}</strong>
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
          <p className="eyebrow">Line items</p>
          {quote.lineItems.map((lineItem) => (
            <div className="list-row" key={lineItem.id}>
              <div className="list-title">
                <strong>{lineItem.name}</strong>
                <strong>
                  {formatCurrency(lineItem.quantity * lineItem.unitPrice, currency)}
                </strong>
              </div>
              <p>
                {lineItem.quantity} × {formatCurrency(lineItem.unitPrice, currency)}
              </p>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Edit quote</p>
        <DocumentForm
          currency={currency}
          customers={workspaceData.customers}
          initialValue={{
            customerId: quote.customerId,
            issueDate: quote.issueDate,
            secondaryDate: quote.expiryDate,
            status: quote.status,
            lineItems: quote.lineItems,
            discountAmount: quote.discountAmount,
            taxRate: quote.taxRate,
            notes: quote.notes
          }}
          items={workspaceData.items}
          mode="quote"
          onSubmit={(value) => {
            if (!("expiryDate" in value)) {
              return { success: false, message: "Invalid quote payload." };
            }
            return saveQuote(value, quote.id);
          }}
          submitLabel="Update quote"
        />
      </Card>
    </div>
  );
}
