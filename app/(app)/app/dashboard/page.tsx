"use client";

import Link from "next/link";
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
  getDocumentSummaryForRecord,
  getInvoiceOutstanding,
  getInvoiceStatus
} from "@/lib/calculations";

export default function DashboardPage() {
  const {
    canAccess,
    currentWorkspace,
    dashboardMetrics,
    workspaceData,
    outstandingByCustomer
  } = useBusinessOS();
  const {
    approvalCounts,
    branches,
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
    outgoingRFQs,
    reorderSuggestions
  } = useFlowV4();
  const { financeSummary, financialHealth, unreadFinanceCount } = useFlowV5();
  const { executiveSummary, unreadEnterpriseCount } = useFlowV6();
  const {
    actionCenterSummary,
    anomalies,
    predictiveInsights,
    recommendations,
    summaries,
    unreadIntelligenceCount
  } = useFlowV7();

  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard"
        title="Run daily operations with more control."
        description="Flow now brings together receivables, payables, branches, approvals, stock, projects, cash-flow visibility, and connected business workflows without bloating the workspace."
        action={
          <div className="button-row">
            <Link className="button button-primary" href="/app/invoices/new">
              New invoice
            </Link>
            <Link className="button button-secondary" href="/app/network/orders">
              New PO
            </Link>
            <Link className="button button-secondary" href="/app/network/rfqs">
              New RFQ
            </Link>
            <Link className="button button-secondary" href="/app/purchases">
              New purchase
            </Link>
            <Link className="button button-secondary" href="/app/finance/collections">
              Collect
            </Link>
            <Link className="button button-secondary" href="/app/control-center">
              Control
            </Link>
            <Link className="button button-secondary" href="/app/assistant">
              Ask Flow
            </Link>
            <Link className="button button-secondary" href="/app/actions">
              Actions
            </Link>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Collected"
          tone="success"
          value={formatCurrency(dashboardMetrics.totalPaid, currency)}
          hint={`${dashboardMetrics.totalInvoices} invoices in play`}
        />
        <MetricCard
          label="Receivables"
          tone="warning"
          value={formatCurrency(dashboardMetrics.totalUnpaid, currency)}
          hint={`${dashboardMetrics.overdueCount} overdue`}
        />
        <MetricCard
          label="Forecast net"
          tone={cashFlowForecast.projectedNet >= 0 ? "success" : "danger"}
          value={formatCurrency(cashFlowForecast.projectedNet, currency)}
          hint="Upcoming receivables less payables"
        />
        <MetricCard
          label="Pending approvals"
          tone={approvalCounts.pending ? "warning" : "success"}
          value={String(approvalCounts.pending)}
          hint={currentBranch ? currentBranch.name : "All branches"}
        />
        <MetricCard
          label="Readiness"
          tone={
            financialHealth.capitalReadinessScore >= 70
              ? "success"
              : financialHealth.capitalReadinessScore >= 45
                ? "warning"
                : "danger"
          }
          value={`${financialHealth.capitalReadinessScore}/100`}
          hint={financialHealth.readinessBand}
        />
        <MetricCard
          label="Enterprise risks"
          tone={executiveSummary.riskyBranches ? "danger" : "success"}
          value={String(executiveSummary.riskyBranches)}
          hint={`${unreadEnterpriseCount} enterprise alerts`}
        />
        <MetricCard
          label="Open actions"
          tone={actionCenterSummary.highPriority ? "warning" : "success"}
          value={String(actionCenterSummary.open)}
          hint={`${actionCenterSummary.highPriority} high priority`}
        />
        <MetricCard
          label="Smart alerts"
          tone={anomalies.filter((entry) => entry.status === "open").length ? "warning" : "success"}
          value={String(anomalies.filter((entry) => entry.status === "open").length)}
          hint={`${unreadIntelligenceCount} intelligence alerts`}
        />
      </div>

      <div className="list-grid">
        <Card>
          <p className="eyebrow">Operational pulse</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Branch focus</span>
              <strong>{currentBranchId === "all" ? "All branches" : currentBranch?.name}</strong>
            </div>
            <div className="info-pair">
              <span>Low-stock items</span>
              <strong>{lowStockItems.filter((entry) => entry.status !== "healthy").length}</strong>
            </div>
            <div className="info-pair">
              <span>Projects under watch</span>
              <strong>{projectSummaries.filter((summary) => summary.estimatedProfit < 0).length}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Upcoming cash flow</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Receivable forecast</span>
              <strong>{formatCurrency(cashFlowForecast.receivableTotal, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Payable forecast</span>
              <strong>{formatCurrency(cashFlowForecast.payableTotal, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Projected net</span>
              <strong>{formatCurrency(cashFlowForecast.projectedNet, currency)}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Intelligence pulse</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Recommendations</span>
              <strong>{recommendations.length}</strong>
            </div>
            <div className="info-pair">
              <span>Predictive warnings</span>
              <strong>{predictiveInsights.filter((entry) => entry.tone !== "success").length}</strong>
            </div>
            <div className="info-pair">
              <span>Action queue</span>
              <strong>{actionCenterSummary.open}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Quick access</p>
          <div className="button-row">
            <Link className="button button-secondary" href="/app/assistant">
              Assistant
            </Link>
            <Link className="button button-secondary" href="/app/actions">
              Action center
            </Link>
            <Link className="button button-secondary" href="/app/automations">
              Automations
            </Link>
            <Link className="button button-secondary" href="/app/recommendations">
              Recommendations
            </Link>
            <Link className="button button-secondary" href="/app/predictive">
              Predictive
            </Link>
            <Link className="button button-secondary" href="/app/finance">
              Finance
            </Link>
            <Link className="button button-secondary" href="/app/finance/reconciliation">
              Reconcile
            </Link>
            <Link className="button button-secondary" href="/app/network">
              Discover suppliers
            </Link>
            <Link className="button button-secondary" href="/app/network/connections">
              Connections
            </Link>
            <Link className="button button-secondary" href="/app/network/catalogs">
              Catalogs
            </Link>
            <Link className="button button-secondary" href="/app/approvals">
              Approvals
            </Link>
            <Link className="button button-secondary" href="/app/reviews">
              Maker-checker
            </Link>
            <Link className="button button-secondary" href="/app/executive">
              Executive
            </Link>
            <Link className="button button-secondary" href="/app/stock">
              Stock alerts
            </Link>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Network pulse</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Connected businesses</span>
              <strong>{networkSummary.connectedBusinesses}</strong>
            </div>
            <div className="info-pair">
              <span>Incoming POs</span>
              <strong>{incomingPurchaseOrders.length}</strong>
            </div>
            <div className="info-pair">
              <span>Pending connection requests</span>
              <strong>{incomingConnectionRequests.length}</strong>
            </div>
            <div className="info-pair">
              <span>Open RFQs</span>
              <strong>{outgoingRFQs.length}</strong>
            </div>
            <div className="info-pair">
              <span>Reorder opportunities</span>
              <strong>{reorderSuggestions.length}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Finance pulse</p>
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
              <span>Eligible invoices</span>
              <strong>{financeSummary.eligibleInvoiceCount}</strong>
            </div>
            <div className="info-pair">
              <span>Unread finance alerts</span>
              <strong>{unreadFinanceCount}</strong>
            </div>
            <div className="info-pair">
              <span>Enterprise risks</span>
              <strong>{executiveSummary.riskyBranches}</strong>
            </div>
            <div className="info-pair">
              <span>Pending reviews</span>
              <strong>{executiveSummary.pendingReviews}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Daily intelligent summary</p>
          {summaries.length ? (
            <>
              <p>{summaries[0].summary}</p>
              <div className="kpi-stack" style={{ marginTop: 16 }}>
                {summaries[0].highlights.map((highlight) => (
                  <div className="info-pair" key={highlight}>
                    <span>Highlight</span>
                    <strong>{highlight}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No summary yet"
              description="Summaries appear once intelligent signals are available for this role."
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Attention next</p>
          {recommendations.slice(0, 4).map((recommendation) => (
            <div className="list-row" key={recommendation.id}>
              <div className="list-title">
                <div>
                  <strong>{recommendation.title}</strong>
                  <p>{recommendation.summary}</p>
                </div>
                <StatusBadge
                  label={recommendation.priority}
                  tone={
                    recommendation.priority === "high"
                      ? "danger"
                      : recommendation.priority === "medium"
                        ? "warning"
                        : "muted"
                  }
                />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Recent invoices</p>
          {workspaceData.invoices.length ? (
            workspaceData.invoices.slice(0, 5).map((invoice) => {
              const customer = workspaceData.customers.find(
                (record) => record.id === invoice.customerId
              );
              const status = getInvoiceStatus(invoice, workspaceData.payments);
              const summary = getDocumentSummaryForRecord(invoice);
              const outstanding = getInvoiceOutstanding(invoice, workspaceData.payments);

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
                      <strong>{formatCurrency(outstanding, currency)}</strong>
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
              action={<Link className="button button-primary" href="/app/invoices/new">Create invoice</Link>}
              description="Create your first invoice to start tracking receivables."
              title="No invoices yet"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Actionable alerts</p>
          {operationalAlerts.length ? (
            operationalAlerts.slice(0, 6).map((alert) => (
              <div className="list-row" key={alert.id}>
                <div className="list-title">
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                  <StatusBadge label={alert.type.replace("_", " ")} tone="warning" />
                </div>
                {alert.href ? (
                  <Link className="text-button" href={alert.href}>
                    Open
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState
              description="Operational alerts for approvals, stock, and projects will appear here."
              title="No alerts right now"
            />
          )}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Who owes you most</p>
          {outstandingByCustomer.length ? (
            outstandingByCustomer.slice(0, 5).map(({ customer, amount }) => (
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
              description="Customer balances appear here as soon as invoices go unpaid."
              title="No customer balances"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Network activity</p>
          {networkNotifications.length ? (
            networkNotifications.slice(0, 5).map((notification) => (
              <div className="list-row" key={notification.id}>
                <div className="list-title">
                  <Link href={notification.href || "/app/network"}>
                    <strong>{notification.title}</strong>
                  </Link>
                  <StatusBadge label="network" tone="success" />
                </div>
                <p>{notification.message}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Connections, POs, RFQs, and catalog alerts will appear here."
              title="No network activity yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
