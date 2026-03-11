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
import {
  formatCurrency,
  formatDate,
  getDocumentSummaryForRecord,
  getInvoiceOutstanding,
  getInvoiceStatus
} from "@/lib/calculations";

export default function InvoicesPage() {
  const { currentWorkspace, workspaceData } = useBusinessOS();
  const [search, setSearch] = useState("");
  const currency = currentWorkspace?.currency || "USD";

  const filteredInvoices = workspaceData.invoices.filter((invoice) => {
    const customer = workspaceData.customers.find((record) => record.id === invoice.customerId);
    return [invoice.reference, customer?.name, invoice.notes]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Invoices"
        title="Invoice faster, trust the numbers."
        description="Create invoices quickly, monitor due dates, and keep outstanding balances clear."
        action={
          <Link className="button button-primary" href="/app/invoices/new">
            New invoice
          </Link>
        }
      />

      <Card>
        <Input
          label="Search invoices"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by invoice number, customer, or notes"
          value={search}
        />
        {filteredInvoices.length ? (
          filteredInvoices.map((invoice) => {
            const customer = workspaceData.customers.find(
              (record) => record.id === invoice.customerId
            );
            const summary = getDocumentSummaryForRecord(invoice);
            const status = getInvoiceStatus(invoice, workspaceData.payments);

            return (
              <div className="list-row" key={invoice.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/invoices/${invoice.id}`}>
                      <strong>{invoice.reference}</strong>
                    </Link>
                    <p>{customer?.name || "Unknown customer"}</p>
                  </div>
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
                </div>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Total</span>
                    <strong>{formatCurrency(summary.total, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Outstanding</span>
                    <strong>
                      {formatCurrency(
                        getInvoiceOutstanding(invoice, workspaceData.payments),
                        currency
                      )}
                    </strong>
                  </div>
                  <div className="info-pair">
                    <span>Due</span>
                    <strong>{formatDate(invoice.dueDate)}</strong>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            action={
              <Link className="button button-primary" href="/app/invoices/new">
                Create invoice
              </Link>
            }
            description="Create your first invoice to start tracking money in and unpaid balances."
            title="No invoices match"
          />
        )}
      </Card>
    </div>
  );
}
