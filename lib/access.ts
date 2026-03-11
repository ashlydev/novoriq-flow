import { UserRole } from "@/lib/types";

export type Permission =
  | "view_assistant"
  | "view_action_center"
  | "view_recommendations"
  | "view_anomalies"
  | "view_predictive_insights"
  | "view_executive_dashboard"
  | "view_control_center"
  | "view_branch_comparison"
  | "view_departments"
  | "view_permissions_admin"
  | "view_procurement_controls"
  | "view_admin_console"
  | "view_export_center"
  | "view_finance"
  | "view_financing_readiness"
  | "view_network"
  | "view_owner_away"
  | "view_receivables"
  | "view_payables"
  | "view_reports"
  | "view_advanced_analytics"
  | "view_audit_log"
  | "view_branches"
  | "view_approvals"
  | "view_stock"
  | "view_projects"
  | "view_documents"
  | "manage_settings"
  | "manage_templates"
  | "manage_roles"
  | "manage_team"
  | "manage_branches"
  | "manage_approvals"
  | "manage_network_profile"
  | "manage_connections"
  | "manage_catalogs"
  | "manage_purchase_orders"
  | "manage_rfqs"
  | "manage_payment_requests"
  | "manage_reconciliation"
  | "manage_supplier_credit"
  | "manage_partner_exports"
  | "manage_automations"
  | "manage_intelligence_settings"
  | "manage_permissions"
  | "manage_departments"
  | "manage_procurement_controls"
  | "manage_export_jobs"
  | "generate_ai_drafts"
  | "view_relationship_history"
  | "manage_purchases"
  | "record_supplier_payments"
  | "attach_files"
  | "manage_recurring"
  | "manage_stock"
  | "manage_projects"
  | "manage_documents"
  | "view_sensitive_dashboard";

const permissionMap: Record<UserRole, Permission[]> = {
  owner: [
    "view_assistant",
    "view_action_center",
    "view_recommendations",
    "view_anomalies",
    "view_predictive_insights",
    "view_executive_dashboard",
    "view_control_center",
    "view_branch_comparison",
    "view_departments",
    "view_permissions_admin",
    "view_procurement_controls",
    "view_admin_console",
    "view_export_center",
    "view_finance",
    "view_financing_readiness",
    "view_network",
    "view_owner_away",
    "view_receivables",
    "view_payables",
    "view_reports",
    "view_advanced_analytics",
    "view_audit_log",
    "view_branches",
    "view_approvals",
    "view_stock",
    "view_projects",
    "view_documents",
    "manage_settings",
    "manage_templates",
    "manage_roles",
    "manage_team",
    "manage_branches",
    "manage_approvals",
    "manage_network_profile",
    "manage_connections",
    "manage_catalogs",
    "manage_purchase_orders",
    "manage_rfqs",
    "manage_payment_requests",
    "manage_reconciliation",
    "manage_supplier_credit",
    "manage_partner_exports",
    "manage_automations",
    "manage_intelligence_settings",
    "manage_permissions",
    "manage_departments",
    "manage_procurement_controls",
    "manage_export_jobs",
    "generate_ai_drafts",
    "view_relationship_history",
    "manage_purchases",
    "record_supplier_payments",
    "attach_files",
    "manage_recurring",
    "manage_stock",
    "manage_projects",
    "manage_documents",
    "view_sensitive_dashboard"
  ],
  admin: [
    "view_assistant",
    "view_action_center",
    "view_recommendations",
    "view_anomalies",
    "view_predictive_insights",
    "view_executive_dashboard",
    "view_control_center",
    "view_branch_comparison",
    "view_departments",
    "view_permissions_admin",
    "view_procurement_controls",
    "view_admin_console",
    "view_export_center",
    "view_finance",
    "view_financing_readiness",
    "view_network",
    "view_owner_away",
    "view_receivables",
    "view_payables",
    "view_reports",
    "view_advanced_analytics",
    "view_audit_log",
    "view_branches",
    "view_approvals",
    "view_stock",
    "view_projects",
    "view_documents",
    "manage_settings",
    "manage_templates",
    "manage_roles",
    "manage_team",
    "manage_branches",
    "manage_approvals",
    "manage_network_profile",
    "manage_connections",
    "manage_catalogs",
    "manage_purchase_orders",
    "manage_rfqs",
    "manage_payment_requests",
    "manage_reconciliation",
    "manage_supplier_credit",
    "manage_partner_exports",
    "manage_automations",
    "manage_intelligence_settings",
    "manage_permissions",
    "manage_departments",
    "manage_procurement_controls",
    "manage_export_jobs",
    "generate_ai_drafts",
    "view_relationship_history",
    "manage_purchases",
    "record_supplier_payments",
    "attach_files",
    "manage_recurring",
    "manage_stock",
    "manage_projects",
    "manage_documents",
    "view_sensitive_dashboard"
  ],
  manager: [
    "view_assistant",
    "view_action_center",
    "view_recommendations",
    "view_anomalies",
    "view_predictive_insights",
    "view_executive_dashboard",
    "view_control_center",
    "view_branch_comparison",
    "view_departments",
    "view_procurement_controls",
    "view_admin_console",
    "view_export_center",
    "view_finance",
    "view_financing_readiness",
    "view_network",
    "view_owner_away",
    "view_receivables",
    "view_payables",
    "view_reports",
    "view_advanced_analytics",
    "view_branches",
    "view_approvals",
    "view_stock",
    "view_projects",
    "view_documents",
    "view_relationship_history",
    "manage_branches",
    "manage_approvals",
    "manage_catalogs",
    "manage_purchase_orders",
    "manage_rfqs",
    "manage_payment_requests",
    "manage_reconciliation",
    "manage_supplier_credit",
    "manage_automations",
    "manage_departments",
    "manage_procurement_controls",
    "manage_export_jobs",
    "generate_ai_drafts",
    "manage_purchases",
    "record_supplier_payments",
    "attach_files",
    "manage_recurring",
    "manage_stock",
    "manage_projects",
    "manage_documents",
    "view_sensitive_dashboard"
  ],
  staff: [
    "view_assistant",
    "view_action_center",
    "view_control_center",
    "view_departments",
    "view_export_center",
    "view_network",
    "view_finance",
    "generate_ai_drafts",
    "manage_payment_requests",
    "manage_purchases",
    "manage_purchase_orders",
    "manage_rfqs",
    "attach_files",
    "view_stock",
    "view_projects",
    "view_documents"
  ]
};

export function hasPermission(role: UserRole | undefined, permission: Permission) {
  if (!role) {
    return false;
  }

  return permissionMap[role].includes(permission);
}

export function hasAnyRole(role: UserRole | undefined, roles: UserRole[]) {
  return role ? roles.includes(role) : false;
}
