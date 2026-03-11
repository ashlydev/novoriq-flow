"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import {
  Card,
  EmptyState,
  MetricCard,
  PageHeader,
  Select,
  StatusBadge
} from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getCustomerStatementEntries,
  getInvoiceOutstanding,
  getInvoiceStatus,
  getPaidAmount,
  isInvoiceDueSoon
} from "@/lib/calculations";

type Period = "30" | "90" | "all";
type StatusFilter = "all" | "unpaid" | "partial" | "overdue" | "due-soon" | "paid";

function withinPeriod(date: string, period: Period) {
  if (period === "all") {
    return true;
  }

  const boundary = new Date();
  boundary.setDate(boundary.getDate() - Number(period));
  return new Date(date) >= boundary;
}

export default function ReceivablesPage() {
  const {
    canAccess,
    currentWorkspace,
    outstandingByCustomer,
    receivablesAging,
    workspaceData
  } = useBusinessOS();
  const { financeSummary, getInvoiceReconciliationStatus } = useFlowV5();
  const [period, setPeriod] = useState<Period>("90");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customerFilter, setCustomerFilter] = useState("all");

  if (!canAccess("view_receivables")) {
    return (
      <AccessDeniedState description="Receivables visibility is limited to manager, admin, and owner roles." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const dueSoonDays = workspaceData.settings?.dueSoonDays || 7;

  const receivableRows = useMemo(
    () =>
      workspaceData.invoices
        .filter((invoice) => withinPeriod(invoice.issueDate, period))
        .map((invoice) => {
          const customer = workspaceData.customers.find(
            (record) => record.id === invoice.customerId
          );
          const status = getInvoiceStatus(invoice, workspaceData.payments);
          const outstanding = getInvoiceOutstanding(invoice, workspaceData.payments);
          const paidAmount = getPaidAmount(workspaceData.payments, invoice.id);
          const dueSoon = isInvoiceDueSoon(invoice, workspaceData.payments, dueSoonDays);

          return {
            invoice,
            customer,
            status,
            outstanding,
            paidAmount,
            dueSoon
          };
        })
        .filter((row) => (customerFilter === "all" ? true : row.invoice.customerId === customerFilter))
        .filter((row) => {
          if (statusFilter === "all") {
            return true;
          }
          if (statusFilter === "due-soon") {
            return row.dueSoon;
          }
          if (statusFilter === "unpaid") {
            return row.outstanding > 0 && row.status !== "partial" && row.status !== "overdue";
          }
          return row.status === statusFilter;
        }),
    [customerFilter, dueSoonDays, period, statusFilter, workspaceData.customers, workspaceData.invoices, workspaceData.payments]
  );

  const totalOutstanding = receivableRows.reduce((total, row) => total + row.outstanding, 0);
  const overdueOutstanding = receivableRows
    .filter((row) => row.status === "overdue")
    .reduce((total, row) => total + row.outstanding, 0);
  const partialOutstanding = receivableRows
    .filter((row) => row.status === "partial")
    .reduce((total, row) => total + row.outstanding, 0);
  const dueSoonOutstanding = receivableRows
    .filter((row) => row.dueSoon)
    .reduce((total, row) => total + row.outstanding, 0);

  const statementCustomerId =
    customerFilter !== "all"
      ? customerFilter
      : outstandingByCustomer[0]?.customer.id || workspaceData.customers[0]?.id;
  const statementCustomer = workspaceData.customers.find(
    (record) => record.id === statementCustomerId
  );
  const statementEntries = statementCustomerId
    ? getCustomerStatementEntries(
        statementCustomerId,
        workspaceData.invoices,
        workspaceData.payments
      )
    : [];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Receivables"
        title="Know exactly who owes you."
        description="Monitor unpaid invoices, aging, customer statements, and payment progress from one mobile-first control view."
      />

      <div className="metric-grid">
        <MetricCard
          hint={`${receivableRows.length} invoices in scope`}
          label="Outstanding receivables"
          tone="warning"
          value={formatCurrency(totalOutstanding, currency)}
        />
        <MetricCard
          hint="Past due exposure"
          label="Overdue value"
          tone="danger"
          value={formatCurrency(overdueOutstanding, currency)}
        />
        <MetricCard
          hint="Needs follow-up to close"
          label="Partial balances"
          value={formatCurrency(partialOutstanding, currency)}
        />
        <MetricCard
          hint={`Due in the next ${dueSoonDays} days`}
          label="Due soon"
          value={formatCurrency(dueSoonOutstanding, currency)}
        />
        <MetricCard
          hint="Collection requests still open"
          label="Open requests"
          value={String(financeSummary.openPaymentRequests)}
        />
      </div>

      <Card>
        <div className="form-grid">
          <Select
            label="Period"
            onChange={(event) => setPeriod(event.target.value as Period)}
            value={period}
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </Select>
          <Select
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="due-soon">Due soon</option>
            <option value="paid">Paid</option>
          </Select>
          <Select
            label="Customer"
            onChange={(event) => setCustomerFilter(event.target.value)}
            value={customerFilter}
          >
            <option value="all">All customers</option>
            {workspaceData.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Receivables list</p>
          {receivableRows.length ? (
            receivableRows.map((row) => (
              <div className="list-row" key={row.invoice.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/invoices/${row.invoice.id}`}>
                      <strong>{row.invoice.reference}</strong>
                    </Link>
                    <p>{row.customer?.name || "Unknown customer"}</p>
                  </div>
                  <StatusBadge
                    label={row.status}
                    tone={
                      row.status === "paid"
                        ? "success"
                        : row.status === "overdue"
                          ? "danger"
                          : row.status === "partial" || row.dueSoon
                            ? "warning"
                            : "muted"
                    }
                  />
                </div>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Outstanding</span>
                    <strong>{formatCurrency(row.outstanding, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Collected</span>
                    <strong>{formatCurrency(row.paidAmount, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Due</span>
                    <strong>{formatDate(row.invoice.dueDate)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Reconciliation</span>
                    <strong>{getInvoiceReconciliationStatus(row.invoice.id).replace("_", " ")}</strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              action={
                <Link className="button button-primary" href="/app/invoices/new">
                  Create invoice
                </Link>
              }
              description="Adjust the filters or create more invoices to populate receivables."
              title="No receivables match"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Invoice aging</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Current</span>
              <strong>{formatCurrency(receivablesAging.current, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>1-30 days</span>
              <strong>{formatCurrency(receivablesAging.days1to30, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>31-60 days</span>
              <strong>{formatCurrency(receivablesAging.days31to60, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>61-90 days</span>
              <strong>{formatCurrency(receivablesAging.days61to90, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>90+ days</span>
              <strong>{formatCurrency(receivablesAging.days90Plus, currency)}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/unpaid">
              Open unpaid tracker
            </Link>
          </div>
        </Card>
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
              description="Customer balances appear as soon as invoices become outstanding."
              title="No customer balances"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">
            {statementCustomer ? `${statementCustomer.name} statement` : "Customer statement"}
          </p>
          {statementEntries.length ? (
            <div className="table-wrap">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statementEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.date)}</td>
                      <td>{entry.reference}</td>
                      <td>{formatCurrency(entry.debit, currency)}</td>
                      <td>{formatCurrency(entry.credit, currency)}</td>
                      <td>{formatCurrency(entry.balance, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              description="Choose a customer with invoice activity to review the full statement."
              title="No statement history yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
