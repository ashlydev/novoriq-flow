"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import { formatCurrency, getDocumentSummaryForRecord, formatDate } from "@/lib/calculations";

export default function QuotesPage() {
  const { currentWorkspace, workspaceData } = useBusinessOS();
  const [search, setSearch] = useState("");
  const currency = currentWorkspace?.currency || "USD";

  const filteredQuotes = workspaceData.quotes.filter((quote) => {
    const customer = workspaceData.customers.find((record) => record.id === quote.customerId);
    return [quote.reference, customer?.name, quote.notes, quote.status]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Quotations"
        title="Win work with clean, mobile-friendly quotes."
        description="Draft, send, track status, and convert accepted quotes into invoices without rebuilding line items."
        action={
          <Link className="button button-primary" href="/app/quotes/new">
            New quote
          </Link>
        }
      />

      <Card>
        <Input
          label="Search quotes"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by quote number, customer, notes, or status"
          value={search}
        />
        {filteredQuotes.length ? (
          filteredQuotes.map((quote) => {
            const customer = workspaceData.customers.find(
              (record) => record.id === quote.customerId
            );
            const summary = getDocumentSummaryForRecord(quote);

            return (
              <div className="list-row" key={quote.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/quotes/${quote.id}`}>
                      <strong>{quote.reference}</strong>
                    </Link>
                    <p>{customer?.name || "Unknown customer"}</p>
                  </div>
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
                </div>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Total</span>
                    <strong>{formatCurrency(summary.total, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Expires</span>
                    <strong>{formatDate(quote.expiryDate)}</strong>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            action={
              <Link className="button button-primary" href="/app/quotes/new">
                Create quote
              </Link>
            }
            description="Build your first quote to start the lead-to-invoice flow."
            title="No quotes match"
          />
        )}
      </Card>
    </div>
  );
}
