"use client";

import { useMemo, useState } from "react";
import { AuditLogList } from "@/components/shared/audit-log-list";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Card, Input, PageHeader, Select } from "@/components/shared/ui";
import { AuditAction, AuditEntityType } from "@/lib/types";

const entityOptions: Array<AuditEntityType | "all"> = [
  "all",
  "invoice",
  "payment",
  "receipt",
  "expense",
  "purchase",
  "purchase_payment",
  "settings",
  "customer",
  "supplier",
  "role",
  "attachment",
  "recurring_invoice",
  "business_profile",
  "business_connection",
  "supplier_catalog",
  "catalog_item",
  "purchase_order",
  "rfq",
  "rfq_response",
  "network_settings",
  "payment_request",
  "reconciliation",
  "finance_transaction",
  "financing_profile",
  "invoice_financing_candidate",
  "supplier_credit",
  "partner_package",
  "finance_settings",
  "permission_profile",
  "review_request",
  "department",
  "branch_control",
  "control_policy",
  "export_job",
  "admin_console",
  "enterprise_notification",
  "assistant_session",
  "automation_rule",
  "automation_run",
  "anomaly_event",
  "recommendation",
  "action_task",
  "predictive_insight",
  "intelligent_summary",
  "assistant_draft",
  "intelligence_settings",
  "intelligence_notification"
];

const actionOptions: Array<AuditAction | "all"> = [
  "all",
  "created",
  "edited",
  "archived",
  "deleted",
  "recorded",
  "reprinted",
  "confirmed",
  "role_changed",
  "generated",
  "uploaded",
  "sent",
  "accepted",
  "rejected",
  "fulfilled",
  "responded",
  "connected",
  "disconnected",
  "bookmarked",
  "reconciled",
  "flagged",
  "reminded",
  "matched",
  "exported",
  "assigned",
  "returned",
  "queued",
  "downloaded",
  "triggered",
  "dismissed",
  "snoozed",
  "resolved",
  "generated_draft",
  "asked"
];

export default function AuditLogPage() {
  const { canAccess, workspaceData } = useBusinessOS();
  const { enterpriseAuditLogs } = useFlowV6();
  const { intelligenceAuditLogs } = useFlowV7();
  const [entityFilter, setEntityFilter] = useState<AuditEntityType | "all">("all");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [search, setSearch] = useState("");

  if (!canAccess("view_audit_log")) {
    return (
      <AccessDeniedState description="Only manager, admin, and owner roles can open the audit trail." />
    );
  }

  const actorLabelById = Object.fromEntries(
    workspaceData.teamMembers.map((entry) => [
      entry.member.userId,
      entry.user?.fullName || entry.member.role
    ])
  );
  const filteredLogs = useMemo(
    () =>
      intelligenceAuditLogs.filter((log) => {
        const matchesEntity = entityFilter === "all" ? true : log.entityType === entityFilter;
        const matchesAction = actionFilter === "all" ? true : log.action === actionFilter;
        const matchesSearch = [log.title, log.summary, log.entityId]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesEntity && matchesAction && matchesSearch;
      }),
    [actionFilter, intelligenceAuditLogs, enterpriseAuditLogs, entityFilter, search]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Audit log"
        title="Important actions stay traceable."
        description="Track who changed what, when they did it, and which records need review."
      />

      <Card>
        <div className="form-grid">
          <Input
            label="Search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title, summary, entity id"
            value={search}
          />
          <Select
            label="Entity"
            onChange={(event) => setEntityFilter(event.target.value as AuditEntityType | "all")}
            value={entityFilter}
          >
            {entityOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            label="Action"
            onChange={(event) => setActionFilter(event.target.value as AuditAction | "all")}
            value={actionFilter}
          >
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <AuditLogList actorLabelById={actorLabelById} logs={filteredLogs} />
    </div>
  );
}
