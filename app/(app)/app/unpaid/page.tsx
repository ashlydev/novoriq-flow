"use client";

import Link from "next/link";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Card, EmptyState, MetricCard, PageHeader, StatusBadge } from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getInvoiceOutstanding,
  getInvoiceStatus,
  isInvoiceDueSoon
} from "@/lib/calculations";

export default function UnpaidPage() {
  const { currentWorkspace, dashboardMetrics, outstandingByCustomer, workspaceData } =
    useBusinessOS();
  const currency = currentWorkspace?.currency || "USD";
  const overdueInvoices = workspaceData.invoices.filter(
    (invoice) => getInvoiceStatus(invoice, workspaceData.payments) === "overdue"
  );
  const dueSoonInvoices = workspaceData.invoices.filter((invoice) =>
    isInvoiceDueSoon(invoice, workspaceData.payments, workspaceData.settings?.dueSoonDays || 7)
  );
  const unpaidInvoices = workspaceData.invoices.filter(
    (invoice) => getInvoiceOutstanding(invoice, workspaceData.payments) > 0
  );
  const partialInvoices = workspaceData.invoices.filter(
    (invoice) => getInvoiceStatus(invoice, workspaceData.payments) === "partial"
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Unpaid tracker"
        title="See who owes you and what needs follow-up."
        description="This is one of Flow's strongest control views: overdue, due soon, partially paid, and customer balance exposure in one place."
      />

      <div className="metric-grid">
        <MetricCard
          label="Overdue invoices"
          tone="danger"
          value={String(overdueInvoices.length)}
        />
        <MetricCard
          label="Due soon"
          tone="warning"
          value={String(dueSoonInvoices.length)}
        />
        <MetricCard
          label="Partially paid"
          tone="warning"
          value={String(partialInvoices.length)}
        />
        <MetricCard
          label="Total unpaid"
          tone="warning"
          value={formatCurrency(dashboardMetrics.totalUnpaid, currency)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Customer balances</p>
          {outstandingByCustomer.length ? (
            outstandingByCustomer.map(({ customer, amount }) => (
              <div className="list-row" key={customer.id}>
                <div className="list-title">
                  <Link href={`/app/customers/${customer.id}`}>
                    <strong>{customer.name}</strong>
                  </Link>
                  <strong>{formatCurrency(amount, currency)}</strong>
                </div>
                <p>{customer.phone || customer.email || "No primary contact set"}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Outstanding balances by customer will show here as invoices remain unpaid."
              title="No customer balances"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Follow-up recommendation</p>
          <p>
            Start with overdue invoices first, then review due soon, then partials. Flow
            keeps the signal simple so an owner or manager can act quickly from a phone.
          </p>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Overdue invoices</p>
          {overdueInvoices.length ? (
            overdueInvoices.map((invoice) => (
              <div className="list-row" key={invoice.id}>
                <div className="list-title">
                  <Link href={`/app/invoices/${invoice.id}`}>
                    <strong>{invoice.reference}</strong>
                  </Link>
                  <StatusBadge label="overdue" tone="danger" />
                </div>
                <p>
                  Due {formatDate(invoice.dueDate)} ·{" "}
                  {formatCurrency(getInvoiceOutstanding(invoice, workspaceData.payments), currency)}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              description="No invoices are overdue right now."
              title="Clear overdue list"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Due soon</p>
          {dueSoonInvoices.length ? (
            dueSoonInvoices.map((invoice) => (
              <div className="list-row" key={invoice.id}>
                <div className="list-title">
                  <Link href={`/app/invoices/${invoice.id}`}>
                    <strong>{invoice.reference}</strong>
                  </Link>
                  <StatusBadge label="due soon" tone="warning" />
                </div>
                <p>
                  Due {formatDate(invoice.dueDate)} ·{" "}
                  {formatCurrency(getInvoiceOutstanding(invoice, workspaceData.payments), currency)}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              description="No invoices are due soon inside the current reminder window."
              title="Nothing urgent"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">All unpaid invoices</p>
        {unpaidInvoices.length ? (
          unpaidInvoices.map((invoice) => (
            <div className="list-row" key={invoice.id}>
              <div className="list-title">
                <Link href={`/app/invoices/${invoice.id}`}>
                  <strong>{invoice.reference}</strong>
                </Link>
                <StatusBadge
                  label={getInvoiceStatus(invoice, workspaceData.payments)}
                  tone={
                    getInvoiceStatus(invoice, workspaceData.payments) === "overdue"
                      ? "danger"
                      : "warning"
                  }
                />
              </div>
              <p>{formatCurrency(getInvoiceOutstanding(invoice, workspaceData.payments), currency)}</p>
            </div>
          ))
        ) : (
          <EmptyState
            description="All invoices are fully paid right now."
            title="No unpaid invoices"
          />
        )}
      </Card>
    </div>
  );
}
