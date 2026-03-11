"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import {
  Card,
  EmptyState,
  Input,
  MetricCard,
  PageHeader,
  Select,
  StatusBadge
} from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getPurchaseOutstanding,
  getPurchaseStatus
} from "@/lib/calculations";

type StatusFilter = "all" | "draft" | "confirmed" | "partial" | "overdue" | "paid";

export default function PurchasesPage() {
  const { canAccess, currentWorkspace, dashboardMetrics, savePurchase, workspaceData } =
    useBusinessOS();
  const { outgoingPurchaseOrders, reorderSuggestions } = useFlowV4();
  const { supplierCreditSummary } = useFlowV5();
  const { procurementSummary } = useFlowV6();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  if (!canAccess("manage_purchases")) {
    return (
      <AccessDeniedState description="Purchase entry is available only to roles with supplier workflow access." />
    );
  }

  if (!workspaceData.suppliers.length) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/suppliers">
            Create supplier first
          </Link>
        }
        description="Purchases need a supplier. Add one first, then record the payable."
        title="No suppliers available"
      />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const purchases = useMemo(
    () =>
      workspaceData.purchases.filter((purchase) => {
        const supplier = workspaceData.suppliers.find(
          (record) => record.id === purchase.supplierId
        );
        const matchesSearch = [purchase.reference, purchase.notes, supplier?.name]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const status = getPurchaseStatus(purchase, workspaceData.purchasePayments);
        const matchesStatus = statusFilter === "all" ? true : status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter, workspaceData.purchasePayments, workspaceData.purchases, workspaceData.suppliers]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Purchases"
        title="Record supplier purchases without procurement bloat."
        description="Capture purchase entries, confirm supplier obligations, and keep payable balances tied to real records."
      />

      <div className="metric-grid">
        <MetricCard
          hint="Confirmed purchase value"
          label="Purchases"
          value={formatCurrency(dashboardMetrics.totalPurchases, currency)}
        />
        <MetricCard
          hint="Still owed to suppliers"
          label="Outstanding payables"
          tone="warning"
          value={formatCurrency(dashboardMetrics.totalPayables, currency)}
        />
        <MetricCard
          hint="Immediate follow-up needed"
          label="Overdue payables"
          tone="danger"
          value={String(dashboardMetrics.overduePayablesCount)}
        />
        <MetricCard
          hint="Coming up next"
          label="Due soon"
          value={String(dashboardMetrics.dueSoonPayablesCount)}
        />
        <MetricCard
          hint="Digital supplier ordering"
          label="Network POs"
          value={String(outgoingPurchaseOrders.length)}
        />
        <MetricCard
          hint="Supplier-credit pressure"
          label="Credit watch"
          value={String(supplierCreditSummary.pressureCount)}
        />
        <MetricCard
          hint="Waiting for maker-checker"
          label="Procurement reviews"
          tone={procurementSummary.pendingReviewCount ? "warning" : "success"}
          value={String(procurementSummary.pendingReviewCount)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">New purchase entry</p>
          <PurchaseForm
            currency={currency}
            items={workspaceData.items}
            onSubmit={(value) => savePurchase(value)}
            suppliers={workspaceData.suppliers}
          />
        </Card>

        <Card>
          <p className="eyebrow">Purchase history</p>
          <div className="button-row" style={{ marginBottom: 16 }}>
            <Link className="button button-secondary" href="/app/finance/supplier-credit">
              Supplier credit
            </Link>
            <Link className="button button-secondary" href="/app/procurement">
              Procurement controls
            </Link>
            <Link className="button button-secondary" href="/app/network/orders">
              Open network orders
            </Link>
            <Link className="button button-secondary" href="/app/network/reorders">
              Reorder center ({reorderSuggestions.length})
            </Link>
          </div>
          <div className="form-grid">
            <Input
              label="Search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Reference, supplier, notes"
              value={search}
            />
            <Select
              label="Status"
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </Select>
          </div>
          {purchases.length ? (
            purchases.map((purchase) => {
              const supplier = workspaceData.suppliers.find(
                (record) => record.id === purchase.supplierId
              );
              const status = getPurchaseStatus(purchase, workspaceData.purchasePayments);
              const outstanding = getPurchaseOutstanding(
                purchase,
                workspaceData.purchasePayments
              );

              return (
                <div className="list-row" key={purchase.id}>
                  <div className="list-title">
                    <div>
                      <Link href={`/app/purchases/${purchase.id}`}>
                        <strong>{purchase.reference}</strong>
                      </Link>
                      <p>{supplier?.name || "Unknown supplier"}</p>
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
                      <span>Outstanding</span>
                      <strong>{formatCurrency(outstanding, currency)}</strong>
                    </div>
                    <div className="info-pair">
                      <span>Due</span>
                      <strong>{formatDate(purchase.dueDate)}</strong>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Add the first purchase or widen the filters to see more payable records."
              title="No purchases match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
