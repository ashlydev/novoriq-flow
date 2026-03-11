"use client";

import Link from "next/link";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import {
  Card,
  EmptyState,
  MetricCard,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getCashPressureIndicator,
  getInvoiceOutstanding,
  getInvoiceStatus,
  getPurchaseOutstanding,
  getPurchaseStatus,
  getRecurringTemplatesDue
} from "@/lib/calculations";

export default function OwnerAwayPage() {
  const {
    canAccess,
    currentWorkspace,
    dashboardMetrics,
    ownerAwayAttentionCount,
    outstandingByCustomer,
    supplierPayables,
    workspaceData
  } = useBusinessOS();
  const {
    approvalCounts,
    cashFlowForecast,
    currentBranch,
    currentBranchId,
    lowStockItems,
    operationalAlerts,
    projectSummaries
  } = useFlowV3();
  const {
    incomingConnectionRequests,
    incomingPurchaseOrders,
    networkNotifications,
    networkSummary,
    outgoingPurchaseOrders,
    outgoingRFQs,
    reorderSuggestions
  } = useFlowV4();
  const { financeSummary, financialHealth } = useFlowV5();
  const { executiveSummary } = useFlowV6();
  const { actionCenterSummary, anomalies, summaries } = useFlowV7();

  if (!canAccess("view_owner_away")) {
    return (
      <AccessDeniedState description="The owner-away dashboard is reserved for manager, admin, and owner roles." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const dueSoonDays = workspaceData.settings?.dueSoonDays || 7;
  const actorLabelById = Object.fromEntries(
    workspaceData.teamMembers.map((entry) => [
      entry.member.userId,
      entry.user?.fullName || entry.member.role
    ])
  );
  const cashPressure = getCashPressureIndicator({
    payments: workspaceData.payments,
    expenses: workspaceData.expenses,
    purchasePayments: workspaceData.purchasePayments
  });
  const overdueInvoices = workspaceData.invoices
    .filter((invoice) => getInvoiceStatus(invoice, workspaceData.payments) === "overdue")
    .slice(0, 4);
  const overduePurchases = workspaceData.purchases
    .filter(
      (purchase) => getPurchaseStatus(purchase, workspaceData.purchasePayments) === "overdue"
    )
    .slice(0, 4);
  const recurringDue = getRecurringTemplatesDue(workspaceData.recurringInvoices, dueSoonDays).slice(
    0,
    4
  );
  const recentStaffActivity = workspaceData.activities
    .filter((activity) => {
      const member = workspaceData.teamMembers.find(
        (entry) => entry.member.userId === activity.actorUserId
      );
      return member ? member.member.role !== "owner" : false;
    })
    .slice(0, 6);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Owner away"
        title="A control view for when you are not on the floor."
        description="See what came in, what went out, who owes you, who you owe, and what your team touched recently."
      />

      <div className="metric-grid">
        <MetricCard
          hint="Collected today"
          label="Money in today"
          tone="success"
          value={formatCurrency(dashboardMetrics.todayCollections, currency)}
        />
        <MetricCard
          hint="Expenses plus supplier payments today"
          label="Money out today"
          tone="warning"
          value={formatCurrency(
            dashboardMetrics.todayExpenses + dashboardMetrics.todayOutgoingPayments,
            currency
          )}
        />
        <MetricCard
          hint={`${dashboardMetrics.overdueCount} overdue invoices`}
          label="Receivables at risk"
          tone="danger"
          value={formatCurrency(dashboardMetrics.totalUnpaid, currency)}
        />
        <MetricCard
          hint={`${dashboardMetrics.overduePayablesCount} overdue payables`}
          label="Supplier obligations"
          tone="warning"
          value={formatCurrency(dashboardMetrics.totalPayables, currency)}
        />
      </div>

      <div className="list-grid">
        <Card>
          <p className="eyebrow">Attention panel</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Open attention items</span>
              <strong>{ownerAwayAttentionCount}</strong>
            </div>
            <div className="info-pair">
              <span>Cash pressure</span>
              <strong className={cashPressure.tone === "danger" ? "danger-text" : "success-text"}>
                {cashPressure.label}
              </strong>
            </div>
            <div className="info-pair">
              <span>Net collected vs outflow</span>
              <strong>{formatCurrency(cashPressure.value, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Branch scope</span>
              <strong>{currentBranchId === "all" ? "All branches" : currentBranch?.name || "Focused"}</strong>
            </div>
            <div className="info-pair">
              <span>Pending approvals</span>
              <strong>{approvalCounts.pending}</strong>
            </div>
            <div className="info-pair">
              <span>Low-stock pressure</span>
              <strong>{lowStockItems.filter((entry) => entry.status !== "healthy").length}</strong>
            </div>
            <div className="info-pair">
              <span>30-day forecast net</span>
              <strong>{formatCurrency(cashFlowForecast.projectedNet, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Finance readiness</span>
              <strong>{financialHealth.capitalReadinessScore}/100</strong>
            </div>
            <div className="info-pair">
              <span>Risky branches</span>
              <strong>{executiveSummary.riskyBranches}</strong>
            </div>
            <div className="info-pair">
              <span>Pending reviews</span>
              <strong>{executiveSummary.pendingReviews}</strong>
            </div>
            <div className="info-pair">
              <span>Open action tasks</span>
              <strong>{actionCenterSummary.open}</strong>
            </div>
            <div className="info-pair">
              <span>Open anomalies</span>
              <strong>{anomalies.filter((entry) => entry.status === "open").length}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Smart owner summary</p>
          {summaries.slice(0, 2).map((summary) => (
            <div className="list-row" key={summary.id}>
              <div className="list-title">
                <div>
                  <strong>{summary.title}</strong>
                  <p>{summary.summary}</p>
                </div>
                <StatusBadge label={summary.scope} tone="muted" />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Who owes us most</p>
          {outstandingByCustomer.length ? (
            outstandingByCustomer.slice(0, 4).map(({ customer, amount }) => (
              <div className="list-row" key={customer.id}>
                <div className="list-title">
                  <Link href={`/app/customers/${customer.id}`}>
                    <strong>{customer.name}</strong>
                  </Link>
                  <strong>{formatCurrency(amount, currency)}</strong>
                </div>
                <p>{customer.phone || customer.email || "No primary contact"}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Outstanding customer balances will appear here."
              title="No debtor pressure"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Who we owe most</p>
          {supplierPayables.length ? (
            supplierPayables.slice(0, 4).map(({ supplier, amount }) => (
              <div className="list-row" key={supplier.id}>
                <div className="list-title">
                  <Link href={`/app/suppliers/${supplier.id}`}>
                    <strong>{supplier.name}</strong>
                  </Link>
                  <strong>{formatCurrency(amount, currency)}</strong>
                </div>
                <p>{supplier.phone || supplier.email || "No primary contact"}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Outstanding supplier balances will appear here."
              title="No supplier pressure"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Operational warnings</p>
          {operationalAlerts.length ? (
            operationalAlerts.slice(0, 4).map((alert) => (
              <div className="list-row" key={alert.id}>
                <div className="list-title">
                  <strong>{alert.title}</strong>
                  <StatusBadge label={alert.type.replaceAll("_", " ")} tone="warning" />
                </div>
                <p>{alert.message}</p>
                {alert.href ? (
                  <Link className="text-button" href={alert.href}>
                    Open item
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState
              description="Approvals, stock, cash-flow, and project alerts will surface here."
              title="No operational warnings"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Network watch</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Connected businesses</span>
              <strong>{networkSummary.connectedBusinesses}</strong>
            </div>
            <div className="info-pair">
              <span>Incoming requests</span>
              <strong>{incomingConnectionRequests.length}</strong>
            </div>
            <div className="info-pair">
              <span>Outgoing POs</span>
              <strong>{outgoingPurchaseOrders.length}</strong>
            </div>
            <div className="info-pair">
              <span>Incoming POs</span>
              <strong>{incomingPurchaseOrders.length}</strong>
            </div>
            <div className="info-pair">
              <span>Open RFQs</span>
              <strong>{outgoingRFQs.length}</strong>
            </div>
            <div className="info-pair">
              <span>Unread network alerts</span>
              <strong>{networkNotifications.filter((notification) => !notification.isRead).length}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/network">
              Open network
            </Link>
            <Link className="button button-secondary" href="/app/network/reorders">
              {reorderSuggestions.length ? `Reorders (${reorderSuggestions.length})` : "Reorders"}
            </Link>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Finance watch</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Open requests</span>
              <strong>{financeSummary.openPaymentRequests}</strong>
            </div>
            <div className="info-pair">
              <span>Unreconciled</span>
              <strong>{financeSummary.unreconciledCount}</strong>
            </div>
            <div className="info-pair">
              <span>Mismatches</span>
              <strong>{financeSummary.mismatchCount}</strong>
            </div>
            <div className="info-pair">
              <span>Eligible invoices</span>
              <strong>{financeSummary.eligibleInvoiceCount}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/finance">
              Open finance
            </Link>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Recent major transactions</p>
          <div className="panel-stack">
            {workspaceData.payments.slice(0, 4).map((payment) => {
              const invoice = workspaceData.invoices.find(
                (record) => record.id === payment.invoiceId
              );
              return (
                <div className="list-row" key={payment.id}>
                  <div className="list-title">
                    <strong>{formatCurrency(payment.amount, currency)}</strong>
                    <StatusBadge label="collection" tone="success" />
                  </div>
                  <p>
                    {invoice?.reference || "Invoice"} · {formatDate(payment.paymentDate)}
                  </p>
                </div>
              );
            })}
            {workspaceData.expenses.slice(0, 3).map((expense) => (
              <div className="list-row" key={expense.id}>
                <div className="list-title">
                  <strong>{formatCurrency(expense.amount, currency)}</strong>
                  <StatusBadge label="expense" tone="warning" />
                </div>
                <p>
                  {expense.description} · {formatDate(expense.expenseDate)}
                </p>
              </div>
            ))}
            {workspaceData.purchases.slice(0, 3).map((purchase) => (
              <div className="list-row" key={purchase.id}>
                <div className="list-title">
                  <strong>{purchase.reference}</strong>
                  <StatusBadge
                    label={getPurchaseStatus(purchase, workspaceData.purchasePayments)}
                    tone="muted"
                  />
                </div>
                <p>{formatDate(purchase.purchaseDate)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Recent staff activity</p>
          {recentStaffActivity.length ? (
            recentStaffActivity.map((activity) => (
              <div className="list-row" key={activity.id}>
                <div className="list-title">
                  <strong>{activity.title}</strong>
                  <span>{formatDate(activity.createdAt)}</span>
                </div>
                <p>{activity.description}</p>
                <p>
                  By {activity.actorUserId ? actorLabelById[activity.actorUserId] || "Team" : "System"}
                </p>
                {activity.href ? (
                  <Link className="text-button" href={activity.href}>
                    Open record
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState
              description="Recent non-owner activity will appear here as the team uses the workspace."
              title="No staff activity yet"
            />
          )}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">What is overdue now</p>
          {overdueInvoices.length || overduePurchases.length ? (
            <div className="panel-stack">
              {overdueInvoices.map((invoice) => (
                <div className="list-row" key={invoice.id}>
                  <div className="list-title">
                    <Link href={`/app/invoices/${invoice.id}`}>
                      <strong>{invoice.reference}</strong>
                    </Link>
                    <strong>
                      {formatCurrency(
                        getInvoiceOutstanding(invoice, workspaceData.payments),
                        currency
                      )}
                    </strong>
                  </div>
                  <p>Customer overdue since {formatDate(invoice.dueDate)}</p>
                </div>
              ))}
              {overduePurchases.map((purchase) => (
                <div className="list-row" key={purchase.id}>
                  <div className="list-title">
                    <Link href={`/app/purchases/${purchase.id}`}>
                      <strong>{purchase.reference}</strong>
                    </Link>
                    <strong>
                      {formatCurrency(
                        getPurchaseOutstanding(purchase, workspaceData.purchasePayments),
                        currency
                      )}
                    </strong>
                  </div>
                  <p>Supplier payable overdue since {formatDate(purchase.dueDate)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="This panel stays clear when both receivables and payables are under control."
              title="Nothing overdue right now"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Recurring and follow-up watch</p>
          {recurringDue.length || projectSummaries.length ? (
            <div className="panel-stack">
              {recurringDue.map((template) => (
                <div className="list-row" key={template.id}>
                  <div className="list-title">
                    <strong>{template.label}</strong>
                    <StatusBadge label={template.frequency} tone="warning" />
                  </div>
                  <p>Next run {formatDate(template.nextRunDate)}</p>
                </div>
              ))}
              {projectSummaries
                .filter((summary) => summary.estimatedProfit < 0)
                .slice(0, 3)
                .map((summary) => (
                  <div className="list-row" key={summary.project.id}>
                    <div className="list-title">
                      <strong>{summary.project.name}</strong>
                      <StatusBadge label="margin watch" tone="danger" />
                    </div>
                    <p>
                      Estimated profit {formatCurrency(summary.estimatedProfit, currency)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              description="Recurring invoice schedules and project margin pressure will appear here."
              title="No follow-up alerts"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
