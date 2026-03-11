"use client";

import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Button, Card, MetricCard, PageHeader, Select, StatusBadge } from "@/components/shared/ui";
import { UserRole } from "@/lib/types";
import { enterpriseModules, EnterpriseModuleKey, PermissionAction } from "@/lib/v6-types";

const roleOptions: UserRole[] = ["owner", "admin", "manager", "staff"];
const actionOptions: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "manage_sensitive"
];

export default function PermissionsPage() {
  const { canAccess } = useBusinessOS();
  const { getPermissionProfile, permissionCoverage, savePermissionProfile } = useFlowV6();
  const [message, setMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("manager");
  const [selectedModule, setSelectedModule] = useState<EnterpriseModuleKey>("finance");
  const selectedProfile = getPermissionProfile(selectedRole, selectedModule);
  const [selectedActions, setSelectedActions] = useState<PermissionAction[]>(
    selectedProfile?.actions || ["view"]
  );
  const [branchScope, setBranchScope] = useState(selectedProfile?.branchScope || "assigned_only");
  const [departmentScope, setDepartmentScope] = useState(
    selectedProfile?.departmentScope || "assigned_only"
  );
  const [canViewSensitive, setCanViewSensitive] = useState(
    selectedProfile?.canViewSensitive || false
  );
  const coverageRows = useMemo(
    () => roleOptions.map((role) => ({ role, count: permissionCoverage[role] || 0 })),
    [permissionCoverage]
  );

  if (!canAccess("view_permissions_admin")) {
    return (
      <AccessDeniedState description="Permission management is limited to owner and admin roles." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Permissions"
        title="Make access more structured without creating chaos."
        description="Manage role-based module access, action permissions, and simple branch or department scope rules."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        {coverageRows.map((row) => (
          <MetricCard key={row.role} label={row.role} value={String(row.count)} />
        ))}
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Permission editor</p>
          <div className="form-grid">
            <Select
              label="Role"
              onChange={(event) => {
                const role = event.target.value as UserRole;
                const profile = getPermissionProfile(role, selectedModule);
                setSelectedRole(role);
                setSelectedActions(profile?.actions || ["view"]);
                setBranchScope(profile?.branchScope || "assigned_only");
                setDepartmentScope(profile?.departmentScope || "assigned_only");
                setCanViewSensitive(profile?.canViewSensitive || false);
              }}
              value={selectedRole}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <Select
              label="Module"
              onChange={(event) => {
                const module = event.target.value as EnterpriseModuleKey;
                const profile = getPermissionProfile(selectedRole, module);
                setSelectedModule(module);
                setSelectedActions(profile?.actions || ["view"]);
                setBranchScope(profile?.branchScope || "assigned_only");
                setDepartmentScope(profile?.departmentScope || "assigned_only");
                setCanViewSensitive(profile?.canViewSensitive || false);
              }}
              value={selectedModule}
            >
              {enterpriseModules.map((module) => (
                <option key={module.key} value={module.key}>
                  {module.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="table-wrap" style={{ marginTop: 16 }}>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {actionOptions.map((action) => (
                  <tr key={action}>
                    <td>{action.replace("_", " ")}</td>
                    <td>
                      <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <input
                          checked={selectedActions.includes(action)}
                          onChange={(event) =>
                            setSelectedActions((current) =>
                              event.target.checked
                                ? [...current, action]
                                : current.filter((entry) => entry !== action)
                            )
                          }
                          type="checkbox"
                        />
                        enabled
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-grid" style={{ marginTop: 16 }}>
            <Select
              label="Branch scope"
              onChange={(event) => setBranchScope(event.target.value as typeof branchScope)}
              value={branchScope}
            >
              <option value="all">All branches</option>
              <option value="assigned_only">Assigned only</option>
            </Select>
            <Select
              label="Department scope"
              onChange={(event) =>
                setDepartmentScope(event.target.value as typeof departmentScope)
              }
              value={departmentScope}
            >
              <option value="all">All departments</option>
              <option value="assigned_only">Assigned only</option>
            </Select>
            <Select
              label="Sensitive data"
              onChange={(event) => setCanViewSensitive(event.target.value === "yes")}
              value={canViewSensitive ? "yes" : "no"}
            >
              <option value="yes">Visible</option>
              <option value="no">Hidden</option>
            </Select>
          </div>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <Button
              onClick={() =>
                setMessage(
                  savePermissionProfile(selectedRole, selectedModule, {
                    actions: Array.from(new Set(selectedActions)),
                    branchScope,
                    departmentScope,
                    canViewSensitive
                  }).message
                )
              }
              type="button"
            >
              Save permission profile
            </Button>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Current role profiles</p>
          {roleOptions.map((role) => (
            <div className="list-row" key={role}>
              <div className="list-title">
                <strong>{role}</strong>
                <StatusBadge label={`${permissionCoverage[role] || 0} actions`} tone="muted" />
              </div>
              <p>
                {enterpriseModules
                  .map((module) => {
                    const profile = getPermissionProfile(role, module.key);
                    return `${module.label}: ${profile?.actions.length || 0}`;
                  })
                  .join(" · ")}
              </p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
