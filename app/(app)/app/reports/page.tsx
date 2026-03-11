"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, MetricCard, PageHeader, Select } from "@/components/shared/ui";
import {
  formatCurrency,
  getExpenseTotalsByCategory,
  getRevenueTrend,
  groupPaymentsByMethod
} from "@/lib/calculations";

type TrendPeriod = "daily" | "weekly" | "monthly";

export default function ReportsPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    approvalCounts,
    branchSummaries,
    cashFlowForecast,
    currentBranchId,
    lowStockItems,
    projectSummaries
  } = useFlowV3();
  const {
    networkSummary,
    purchaseOrders,
    rfqResponses,
    rfqs,
    supplierActivitySummary
  } = useFlowV4();
  const {
    eligibleInvoices,
    financialHealth,
    financeSummary,
    supplierCreditSummary
  } = useFlowV5();
  const {
    branchComparisons,
    departmentSummaries,
    executiveSummary,
    procurementSummary
  } = useFlowV6();
  const { anomalies, predictiveInsights, recommendations, summaries } = useFlowV7();
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("weekly");

  if (!canAccess("view_reports")) {
    return (
      <AccessDeniedState description="Reports are limited to manager, admin, and owner roles." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const revenueTrend = getRevenueTrend(workspaceData.payments, trendPeriod);
  const expensesByCategory = getExpenseTotalsByCategory(workspaceData.expenses);
  const paymentsByMethod = groupPaymentsByMethod(workspaceData.payments);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analytics"
        title="Readable business intelligence for growing SMEs."
        description="Track branch performance, cash-flow pressure, project profitability, stock health, approvals, and network trade activity without fake sophistication."
        action={
          <Select
            label="Trend period"
            onChange={(event) => setTrendPeriod(event.target.value as TrendPeriod)}
            value={trendPeriod}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Forecast net"
          tone={cashFlowForecast.projectedNet >= 0 ? "success" : "danger"}
          value={formatCurrency(cashFlowForecast.projectedNet, currency)}
        />
        <MetricCard
          label="Pending approvals"
          tone={approvalCounts.pending ? "warning" : "success"}
          value={String(approvalCounts.pending)}
        />
        <MetricCard
          label="Low-stock items"
          tone={lowStockItems.filter((entry) => entry.status !== "healthy").length ? "warning" : "success"}
          value={String(lowStockItems.filter((entry) => entry.status !== "healthy").length)}
        />
        <MetricCard
          label="Branch mode"
          value={currentBranchId === "all" ? "All branches" : "Focused branch"}
        />
        <MetricCard label="Connected businesses" value={String(networkSummary.connectedBusinesses)} />
        <MetricCard label="Finance readiness" value={`${financialHealth.capitalReadinessScore}/100`} />
        <MetricCard label="Executive risks" value={String(executiveSummary.riskyBranches)} />
        <MetricCard label="Anomalies open" value={String(anomalies.filter((entry) => entry.status === "open").length)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Revenue trend</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Collected</th>
                </tr>
              </thead>
              <tbody>
                {revenueTrend.map((entry) => (
                  <tr key={entry.label}>
                    <td>{entry.label}</td>
                    <td>{formatCurrency(entry.value, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Expenses by category</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(expensesByCategory).map(([category, total]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{formatCurrency(total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Branch summaries</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Revenue</th>
                  <th>Receivables</th>
                  <th>Payables</th>
                </tr>
              </thead>
              <tbody>
                {branchSummaries.map((summary) => (
                  <tr key={summary.branch.id}>
                    <td>{summary.branch.name}</td>
                    <td>{formatCurrency(summary.revenue, currency)}</td>
                    <td>{formatCurrency(summary.receivables, currency)}</td>
                    <td>{formatCurrency(summary.payables, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Project profitability</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Collected</th>
                  <th>Cost base</th>
                  <th>Est. profit</th>
                </tr>
              </thead>
              <tbody>
                {projectSummaries.map((summary) => (
                  <tr key={summary.project.id}>
                    <td>{summary.project.name}</td>
                    <td>{formatCurrency(summary.collectedRevenue, currency)}</td>
                    <td>{formatCurrency(summary.costBase, currency)}</td>
                    <td>{formatCurrency(summary.estimatedProfit, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Cash-flow forecast</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Upcoming receivables</span>
              <strong>{formatCurrency(cashFlowForecast.receivableTotal, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Upcoming payables</span>
              <strong>{formatCurrency(cashFlowForecast.payableTotal, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Projected net</span>
              <strong>{formatCurrency(cashFlowForecast.projectedNet, currency)}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Payment method mix</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(paymentsByMethod).map(([method, total]) => (
                  <tr key={method}>
                    <td>{method.replace("_", " ")}</td>
                    <td>{formatCurrency(total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Intelligent summaries</p>
          {summaries.slice(0, 4).map((summary) => (
            <div className="list-row" key={summary.id}>
              <div className="list-title">
                <div>
                  <strong>{summary.title}</strong>
                  <p>{summary.summary}</p>
                </div>
                <span>{summary.scope}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <p className="eyebrow">Predictive and anomaly watch</p>
          {[...predictiveInsights.slice(0, 3).map((entry) => ({
            id: entry.id,
            title: entry.title,
            summary: entry.summary,
            tone: entry.tone
          })), ...anomalies.slice(0, 3).map((entry) => ({
            id: entry.id,
            title: entry.title,
            summary: entry.summary,
            tone: entry.tone
          }))].slice(0, 6).map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-title">
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.summary}</p>
                </div>
                <span>{entry.tone}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <div className="list-title" style={{ marginBottom: 16 }}>
            <div>
              <p className="eyebrow">Executive comparison</p>
              <p>Branch controls and enterprise review pressure.</p>
            </div>
            <Link className="button button-secondary" href="/app/exports">
              Export center
            </Link>
          </div>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Risk</th>
                  <th>Reviews</th>
                  <th>Approvals</th>
                </tr>
              </thead>
              <tbody>
                {branchComparisons.map((entry) => (
                  <tr key={entry.branch.id}>
                    <td>{entry.branch.name}</td>
                    <td>{entry.control?.riskLevel || "stable"}</td>
                    <td>{entry.pendingReviews}</td>
                    <td>{entry.pendingApprovals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Supplier activity</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>POs</th>
                  <th>Fulfilled</th>
                  <th>RFQ responses</th>
                </tr>
              </thead>
              <tbody>
                {supplierActivitySummary.map((entry) => (
                  <tr key={entry.profile.id}>
                    <td>{entry.profile.displayName}</td>
                    <td>{entry.orderCount}</td>
                    <td>{entry.fulfilledCount}</td>
                    <td>{entry.responseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Network workflow summary</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Purchase orders</span>
              <strong>{purchaseOrders.length}</strong>
            </div>
            <div className="summary-line">
              <span>RFQs</span>
              <strong>{rfqs.length}</strong>
            </div>
            <div className="summary-line">
              <span>RFQ responses</span>
              <strong>{rfqResponses.length}</strong>
            </div>
            <div className="summary-line">
              <span>Pending supplier responses</span>
              <strong>{networkSummary.pendingSupplierResponses}</strong>
            </div>
            <div className="summary-line">
              <span>Bookmarks</span>
              <strong>{networkSummary.bookmarks}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Recommendation summary</p>
        {recommendations.slice(0, 5).map((entry) => (
          <div className="list-row" key={entry.id}>
            <div className="list-title">
              <div>
                <strong>{entry.title}</strong>
                <p>{entry.summary}</p>
              </div>
              <span>{entry.priority}</span>
            </div>
          </div>
        ))}
      </Card>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Department and procurement watch</p>
          <div className="table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Members</th>
                  <th>Pending reviews</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                {departmentSummaries.map((entry) => (
                  <tr key={entry.department.id}>
                    <td>{entry.department.name}</td>
                    <td>{entry.memberCount}</td>
                    <td>{entry.pendingReviews}</td>
                    <td>{entry.returnedReviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="money-list" style={{ marginTop: 16 }}>
            <div className="summary-line">
              <span>High-value purchases</span>
              <strong>{procurementSummary.highValuePurchases.length}</strong>
            </div>
            <div className="summary-line">
              <span>Procurement reviews</span>
              <strong>{procurementSummary.pendingReviewCount}</strong>
            </div>
            <div className="summary-line">
              <span>Supplier pressure</span>
              <strong>{procurementSummary.supplierPressureCount}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Reconciliation and collection summary</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Open payment requests</span>
              <strong>{financeSummary.openPaymentRequests}</strong>
            </div>
            <div className="summary-line">
              <span>Unreconciled payments</span>
              <strong>{financeSummary.unreconciledCount}</strong>
            </div>
            <div className="summary-line">
              <span>Mismatches</span>
              <strong>{financeSummary.mismatchCount}</strong>
            </div>
            <div className="summary-line">
              <span>Eligible invoices</span>
              <strong>{eligibleInvoices.filter((entry) => entry.status !== "not_ready").length}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Supplier credit obligations</p>
          <div className="money-list">
            <div className="summary-line">
              <span>Outstanding supplier credit</span>
              <strong>{formatCurrency(supplierCreditSummary.totalOutstanding, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Overdue supplier credit</span>
              <strong>{formatCurrency(supplierCreditSummary.totalOverdue, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Due soon supplier credit</span>
              <strong>{formatCurrency(supplierCreditSummary.totalDueSoon, currency)}</strong>
            </div>
            <div className="summary-line">
              <span>Readiness band</span>
              <strong>{financialHealth.readinessBand}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
