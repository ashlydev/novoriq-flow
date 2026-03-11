"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Permission } from "@/lib/access";
import { cn } from "@/lib/utils";

const desktopNav: Array<{
  href: string;
  label: string;
  permission?: Permission;
}> = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/assistant", label: "Assistant", permission: "view_assistant" },
  { href: "/app/actions", label: "Action Center", permission: "view_action_center" },
  { href: "/app/automations", label: "Automations", permission: "manage_automations" },
  { href: "/app/anomalies", label: "Anomalies", permission: "view_anomalies" },
  { href: "/app/recommendations", label: "Recommendations", permission: "view_recommendations" },
  { href: "/app/predictive", label: "Predictive", permission: "view_predictive_insights" },
  { href: "/app/executive", label: "Executive", permission: "view_executive_dashboard" },
  { href: "/app/control-center", label: "Control Center", permission: "view_control_center" },
  { href: "/app/branch-comparison", label: "Branch Compare", permission: "view_branch_comparison" },
  { href: "/app/departments", label: "Departments", permission: "view_departments" },
  { href: "/app/permissions", label: "Permissions", permission: "view_permissions_admin" },
  { href: "/app/reviews", label: "Maker Checker", permission: "view_approvals" },
  { href: "/app/procurement", label: "Procurement", permission: "view_procurement_controls" },
  { href: "/app/admin", label: "Admin Console", permission: "view_admin_console" },
  { href: "/app/exports", label: "Exports", permission: "view_export_center" },
  { href: "/app/finance", label: "Finance", permission: "view_finance" },
  { href: "/app/finance/collections", label: "Collections", permission: "view_finance" },
  { href: "/app/finance/reconciliation", label: "Reconciliation", permission: "view_finance" },
  { href: "/app/finance/readiness", label: "Readiness", permission: "view_financing_readiness" },
  { href: "/app/finance/eligible-invoices", label: "Eligible Invoices", permission: "view_financing_readiness" },
  { href: "/app/finance/supplier-credit", label: "Supplier Credit", permission: "view_finance" },
  { href: "/app/network", label: "Network", permission: "view_network" },
  { href: "/app/network/connections", label: "Connections", permission: "view_network" },
  { href: "/app/network/catalogs", label: "Catalogs", permission: "view_network" },
  { href: "/app/network/orders", label: "Orders", permission: "view_network" },
  { href: "/app/network/rfqs", label: "RFQs", permission: "view_network" },
  { href: "/app/owner-away", label: "Owner Away", permission: "view_owner_away" },
  { href: "/app/branches", label: "Branches", permission: "view_branches" },
  { href: "/app/approvals", label: "Approvals", permission: "view_approvals" },
  { href: "/app/receivables", label: "Receivables", permission: "view_receivables" },
  { href: "/app/payables", label: "Payables", permission: "view_payables" },
  { href: "/app/customers", label: "Customers" },
  { href: "/app/suppliers", label: "Suppliers" },
  { href: "/app/items", label: "Items" },
  { href: "/app/stock", label: "Stock", permission: "view_stock" },
  { href: "/app/projects", label: "Projects", permission: "view_projects" },
  { href: "/app/documents", label: "Documents", permission: "view_documents" },
  { href: "/app/quotes", label: "Quotes" },
  { href: "/app/invoices", label: "Invoices" },
  { href: "/app/recurring", label: "Recurring", permission: "manage_recurring" },
  { href: "/app/purchases", label: "Purchases", permission: "manage_purchases" },
  { href: "/app/receipts", label: "Receipts" },
  { href: "/app/expenses", label: "Expenses" },
  { href: "/app/cash-flow", label: "Cash In / Out" },
  { href: "/app/unpaid", label: "Unpaid Money" },
  { href: "/app/reports", label: "Reports", permission: "view_reports" },
  { href: "/app/network/activity", label: "Network Activity", permission: "view_network" },
  { href: "/app/team", label: "Team", permission: "manage_roles" },
  { href: "/app/audit-log", label: "Audit Log", permission: "view_audit_log" },
  { href: "/app/settings", label: "Settings", permission: "manage_settings" }
];

const mobileNav: Array<{
  href: string;
  label: string;
  permission?: Permission;
}> = [
  { href: "/app/dashboard", label: "Home" },
  { href: "/app/assistant", label: "Assist", permission: "view_assistant" },
  { href: "/app/actions", label: "Actions", permission: "view_action_center" },
  { href: "/app/control-center", label: "Control", permission: "view_control_center" },
  { href: "/app/finance", label: "Finance", permission: "view_finance" },
  { href: "/app/network", label: "Network", permission: "view_network" },
  { href: "/app/reviews", label: "Reviews", permission: "view_approvals" },
  { href: "/app/finance/collections", label: "Collect", permission: "view_finance" },
  { href: "/app/invoices", label: "Invoices" },
  { href: "/app/admin", label: "Admin", permission: "view_admin_console" },
  { href: "/app/notifications", label: "Alerts" }
];

const quickRail: Array<{
  href: string;
  label: string;
  permission?: Permission;
}> = [
  { href: "/app/quotes/new", label: "New Quote" },
  { href: "/app/invoices/new", label: "New Invoice" },
  { href: "/app/assistant", label: "Ask Flow", permission: "view_assistant" },
  { href: "/app/actions", label: "Action Center", permission: "view_action_center" },
  { href: "/app/automations", label: "Automations", permission: "manage_automations" },
  { href: "/app/recommendations", label: "Recommendations", permission: "view_recommendations" },
  { href: "/app/predictive", label: "Predictive", permission: "view_predictive_insights" },
  { href: "/app/finance/collections", label: "Collect", permission: "view_finance" },
  { href: "/app/finance/reconciliation", label: "Reconcile", permission: "view_finance" },
  { href: "/app/finance/readiness", label: "Readiness", permission: "view_financing_readiness" },
  { href: "/app/executive", label: "Executive", permission: "view_executive_dashboard" },
  { href: "/app/control-center", label: "Control", permission: "view_control_center" },
  { href: "/app/reviews", label: "Maker Checker", permission: "view_approvals" },
  { href: "/app/procurement", label: "Procurement", permission: "view_procurement_controls" },
  { href: "/app/exports", label: "Exports", permission: "view_export_center" },
  { href: "/app/network", label: "Discover", permission: "view_network" },
  { href: "/app/network/orders", label: "New PO", permission: "view_network" },
  { href: "/app/network/rfqs", label: "New RFQ", permission: "view_network" },
  { href: "/app/network/reorders", label: "Reorders", permission: "view_network" },
  { href: "/app/unpaid", label: "Unpaid" },
  { href: "/app/approvals", label: "Approvals", permission: "view_approvals" },
  { href: "/app/purchases", label: "Purchases", permission: "manage_purchases" },
  { href: "/app/notifications", label: "Alerts" },
  { href: "/app/owner-away", label: "Owner View", permission: "view_owner_away" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canAccess, currentRole, currentUser, currentWorkspace, unreadNotificationsCount, signOut } =
    useBusinessOS();
  const {
    branches,
    currentBranchId,
    setCurrentBranchId,
    unreadOperationalCount
  } = useFlowV3();
  const { currentBusinessProfile, unreadNetworkCount } = useFlowV4();
  const { unreadFinanceCount } = useFlowV5();
  const { unreadEnterpriseCount } = useFlowV6();
  const { unreadIntelligenceCount } = useFlowV7();
  const visibleDesktopNav = desktopNav.filter(
    (item) => !item.permission || canAccess(item.permission)
  );
  const visibleMobileNav = mobileNav.filter(
    (item) => !item.permission || canAccess(item.permission)
  );
  const visibleQuickRail = quickRail.filter(
    (item) => !item.permission || canAccess(item.permission)
  );
  const totalUnreadAlerts =
    unreadNotificationsCount +
    unreadOperationalCount +
    unreadNetworkCount +
    unreadFinanceCount +
    unreadEnterpriseCount +
    unreadIntelligenceCount;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <Link className="brand-mark" href="/app/dashboard">
            <span>Novoriq</span>
            <strong>Flow</strong>
          </Link>
          <p className="brand-caption">Run operations, connect the business, improve finance readiness, enforce stronger enterprise controls, and turn activity into automation-ready intelligence.</p>
        </div>

        <nav className="side-nav">
          {visibleDesktopNav.map((item) => (
            <Link
              key={item.href}
              className={cn(
                "nav-link",
                pathname.startsWith(item.href) && "nav-link-active"
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className={cn(
              "nav-link",
              pathname.startsWith("/app/notifications") && "nav-link-active"
            )}
            href="/app/notifications"
          >
            Notifications
            {totalUnreadAlerts ? (
              <span className="nav-pill">{totalUnreadAlerts}</span>
            ) : null}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <p>{currentWorkspace?.name || "No workspace"}</p>
          <button className="text-button" onClick={signOut} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div>
            <p className="eyebrow">Business, enterprise, and intelligence system</p>
            <strong>{currentWorkspace?.name || "Workspace setup"}</strong>
            {currentBusinessProfile ? (
              <p className="brand-caption" style={{ marginTop: 6 }}>
                {currentBusinessProfile.visibility} profile · {currentBusinessProfile.operatingStatus}
              </p>
            ) : null}
          </div>
          <div className="topbar-actions">
            {branches.length ? (
              <label className="field" style={{ minWidth: 180 }}>
                <span>Branch</span>
                <select
                  className="select"
                  onChange={(event) => setCurrentBranchId(event.target.value)}
                  value={currentBranchId}
                >
                  <option value="all">All branches</option>
                  {branches
                    .filter((branch) => branch.status === "active")
                    .map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            <Link className="notification-link" href="/app/notifications">
              Bell
              {totalUnreadAlerts ? (
                <span className="notification-count">{totalUnreadAlerts}</span>
              ) : null}
            </Link>
            <div className="user-chip">
              <span>{currentUser?.fullName || "Guest"}</span>
              <small>{currentRole || currentUser?.role || "owner"}</small>
            </div>
          </div>
        </header>

        <div className="quick-rail">
          {visibleQuickRail.map((item) => (
            <Link key={item.href} className="quick-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <main className="page-content">{children}</main>

        <nav className="bottom-nav">
          {visibleMobileNav.map((item) => (
            <Link
              key={item.href}
              className={cn(
                "bottom-link",
                pathname.startsWith(item.href) && "bottom-link-active"
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
