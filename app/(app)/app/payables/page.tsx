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
  getPurchaseOutstanding,
  getPurchasePaidAmount,
  getPurchaseStatus,
  getSupplierStatementEntries,
  isPurchaseDueSoon
} from "@/lib/calculations";

type Period = "30" | "90" | "all";
type StatusFilter = "all" | "confirmed" | "partial" | "overdue" | "due-soon" | "paid";

function withinPeriod(date: string, period: Period) {
  if (period === "all") {
    return true;
  }

  const boundary = new Date();
  boundary.setDate(boundary.getDate() - Number(period));
  return new Date(date) >= boundary;
}

export default function PayablesPage() {
  const { canAccess, currentWorkspace, payablesAging, supplierPayables, workspaceData } =
    useBusinessOS();
  const { supplierCreditSummary } = useFlowV5();
  const [period, setPeriod] = useState<Period>("90");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  if (!canAccess("view_payables")) {
    return (
      <AccessDeniedState description="Payables visibility is limited to manager, admin, and owner roles." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const dueSoonDays = workspaceData.settings?.dueSoonDays || 7;

  const payableRows = useMemo(
    () =>
      workspaceData.purchases
        .filter((purchase) => withinPeriod(purchase.purchaseDate, period))
        .map((purchase) => {
          const supplier = workspaceData.suppliers.find(
            (record) => record.id === purchase.supplierId
          );
          const status = getPurchaseStatus(purchase, workspaceData.purchasePayments);
          const outstanding = getPurchaseOutstanding(purchase, workspaceData.purchasePayments);
          const paidAmount = getPurchasePaidAmount(
            workspaceData.purchasePayments,
            purchase.id
          );
          const dueSoon = isPurchaseDueSoon(
            purchase,
            workspaceData.purchasePayments,
            dueSoonDays
          );

          return {
            purchase,
            supplier,
            status,
            outstanding,
            paidAmount,
            dueSoon
          };
        })
        .filter((row) => (supplierFilter === "all" ? true : row.purchase.supplierId === supplierFilter))
        .filter((row) => {
          if (statusFilter === "all") {
            return true;
          }
          if (statusFilter === "due-soon") {
            return row.dueSoon;
          }
          return row.status === statusFilter;
        }),
    [dueSoonDays, period, statusFilter, supplierFilter, workspaceData.purchasePayments, workspaceData.purchases, workspaceData.suppliers]
  );

  const totalOutstanding = payableRows.reduce((total, row) => total + row.outstanding, 0);
  const overdueOutstanding = payableRows
    .filter((row) => row.status === "overdue")
    .reduce((total, row) => total + row.outstanding, 0);
  const partialOutstanding = payableRows
    .filter((row) => row.status === "partial")
    .reduce((total, row) => total + row.outstanding, 0);
  const dueSoonOutstanding = payableRows
    .filter((row) => row.dueSoon)
    .reduce((total, row) => total + row.outstanding, 0);

  const statementSupplierId =
    supplierFilter !== "all"
      ? supplierFilter
      : supplierPayables[0]?.supplier.id || workspaceData.suppliers[0]?.id;
  const statementSupplier = workspaceData.suppliers.find(
    (record) => record.id === statementSupplierId
  );
  const statementEntries = statementSupplierId
    ? getSupplierStatementEntries(
        statementSupplierId,
        workspaceData.purchases,
        workspaceData.purchasePayments
      )
    : [];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Payables"
        title="Control supplier obligations before they become pressure."
        description="Track open purchases, due supplier balances, aging, and supplier statements without turning the app into a full ERP."
      />

      <div className="metric-grid">
        <MetricCard
          hint={`${payableRows.length} purchases in scope`}
          label="Outstanding payables"
          tone="warning"
          value={formatCurrency(totalOutstanding, currency)}
        />
        <MetricCard
          hint="Past due supplier exposure"
          label="Overdue value"
          tone="danger"
          value={formatCurrency(overdueOutstanding, currency)}
        />
        <MetricCard
          hint="Partially settled purchases"
          label="Partial balances"
          value={formatCurrency(partialOutstanding, currency)}
        />
        <MetricCard
          hint={`Due in the next ${dueSoonDays} days`}
          label="Due soon"
          value={formatCurrency(dueSoonOutstanding, currency)}
        />
        <MetricCard
          hint="Supplier-credit pressure view"
          label="Credit watch"
          value={String(supplierCreditSummary.pressureCount)}
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
            <option value="confirmed">Confirmed</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="due-soon">Due soon</option>
            <option value="paid">Paid</option>
          </Select>
          <Select
            label="Supplier"
            onChange={(event) => setSupplierFilter(event.target.value)}
            value={supplierFilter}
          >
            <option value="all">All suppliers</option>
            {workspaceData.suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Payables list</p>
          {payableRows.length ? (
            payableRows.map((row) => (
              <div className="list-row" key={row.purchase.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/purchases/${row.purchase.id}`}>
                      <strong>{row.purchase.reference}</strong>
                    </Link>
                    <p>{row.supplier?.name || "Unknown supplier"}</p>
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
                    <span>Paid</span>
                    <strong>{formatCurrency(row.paidAmount, currency)}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Due</span>
                    <strong>{formatDate(row.purchase.dueDate)}</strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              action={
                <Link className="button button-primary" href="/app/purchases">
                  Record purchase
                </Link>
              }
              description="Adjust the filters or add more purchase entries to populate payables."
              title="No payables match"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Payable aging</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Current</span>
              <strong>{formatCurrency(payablesAging.current, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>1-30 days</span>
              <strong>{formatCurrency(payablesAging.days1to30, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>31-60 days</span>
              <strong>{formatCurrency(payablesAging.days31to60, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>61-90 days</span>
              <strong>{formatCurrency(payablesAging.days61to90, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>90+ days</span>
              <strong>{formatCurrency(payablesAging.days90Plus, currency)}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/purchases">
              Open purchases
            </Link>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Supplier balances</p>
          {supplierPayables.length ? (
            supplierPayables.map(({ supplier, amount }) => (
              <div className="list-row" key={supplier.id}>
                <div className="list-title">
                  <Link href={`/app/suppliers/${supplier.id}`}>
                    <strong>{supplier.name}</strong>
                  </Link>
                  <strong>{formatCurrency(amount, currency)}</strong>
                </div>
                <p>{supplier.phone || supplier.email || "No primary contact set"}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Supplier balances appear when confirmed purchases are still outstanding."
              title="No supplier balances"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">
            {statementSupplier ? `${statementSupplier.name} statement` : "Supplier statement"}
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
              description="Choose a supplier with purchase activity to review the statement."
              title="No statement history yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
