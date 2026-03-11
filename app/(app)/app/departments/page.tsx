"use client";

import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Button, Card, MetricCard, PageHeader, Input, Select, StatusBadge, Textarea } from "@/components/shared/ui";

export default function DepartmentsPage() {
  const { canAccess } = useBusinessOS();
  const { branches, teamProfiles } = useFlowV3();
  const {
    assignProfileToDepartment,
    departmentSummaries,
    departments,
    saveDepartment
  } = useFlowV6();
  const [message, setMessage] = useState("");
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    branchId: "",
    managerUserId: "",
    description: "",
    status: "active" as const
  });
  const [assignForm, setAssignForm] = useState({
    profileId: teamProfiles[0]?.id || "",
    departmentId: departments[0]?.id || "",
    title: "",
    role: "member" as const
  });
  const availableLeads = useMemo(
    () => teamProfiles.filter((profile) => ["owner", "admin", "manager"].includes(profile.role)),
    [teamProfiles]
  );

  if (!canAccess("view_departments")) {
    return (
      <AccessDeniedState description="Department visibility is limited to roles with enterprise team access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Departments"
        title="Organize teams without turning Flow into HR software."
        description="Create operational departments, assign leads, and connect people to the right business areas and branch context."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Departments" value={String(departments.length)} />
        <MetricCard
          label="Leads assigned"
          value={String(departmentSummaries.filter((row) => row.lead).length)}
        />
        <MetricCard
          label="Members"
          value={String(departmentSummaries.reduce((total, row) => total + row.memberCount, 0))}
        />
        <MetricCard
          label="Pending reviews"
          tone={departmentSummaries.some((row) => row.pendingReviews) ? "warning" : "success"}
          value={String(departmentSummaries.reduce((total, row) => total + row.pendingReviews, 0))}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Department setup</p>
          {canAccess("manage_departments") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  saveDepartment({
                    ...departmentForm,
                    branchId: departmentForm.branchId || undefined,
                    managerUserId: departmentForm.managerUserId || undefined,
                    description: departmentForm.description || undefined
                  }).message
                );
              }}
            >
              <div className="form-grid">
                <Input
                  label="Department name"
                  onChange={(event) =>
                    setDepartmentForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={departmentForm.name}
                />
                <Input
                  label="Code"
                  onChange={(event) =>
                    setDepartmentForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                  }
                  value={departmentForm.code}
                />
                <Select
                  label="Branch"
                  onChange={(event) =>
                    setDepartmentForm((current) => ({ ...current, branchId: event.target.value }))
                  }
                  value={departmentForm.branchId}
                >
                  <option value="">All branches</option>
                  {branches
                    .filter((branch) => branch.status === "active")
                    .map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                </Select>
                <Select
                  label="Department lead"
                  onChange={(event) =>
                    setDepartmentForm((current) => ({ ...current, managerUserId: event.target.value }))
                  }
                  value={departmentForm.managerUserId}
                >
                  <option value="">Not assigned</option>
                  {availableLeads.map((profile) => (
                    <option key={profile.id} value={profile.userId}>
                      {profile.fullName}
                    </option>
                  ))}
                </Select>
              </div>
              <Textarea
                label="Description"
                onChange={(event) =>
                  setDepartmentForm((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                value={departmentForm.description}
              />
              <div className="form-actions">
                <Button type="submit">Save department</Button>
              </div>
            </form>
          ) : (
            <p>Department editing is restricted for your role.</p>
          )}
        </Card>

        <Card>
          <p className="eyebrow">Assign team members</p>
          {canAccess("manage_departments") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  assignProfileToDepartment(
                    assignForm.profileId,
                    assignForm.departmentId,
                    assignForm.title,
                    assignForm.role
                  ).message
                );
              }}
            >
              <Select
                label="Team member"
                onChange={(event) =>
                  setAssignForm((current) => ({ ...current, profileId: event.target.value }))
                }
                value={assignForm.profileId}
              >
                {teamProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.fullName}
                  </option>
                ))}
              </Select>
              <Select
                label="Department"
                onChange={(event) =>
                  setAssignForm((current) => ({ ...current, departmentId: event.target.value }))
                }
                value={assignForm.departmentId}
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              <div className="form-grid">
                <Input
                  label="Title"
                  onChange={(event) =>
                    setAssignForm((current) => ({ ...current, title: event.target.value }))
                  }
                  value={assignForm.title}
                />
                <Select
                  label="Access level"
                  onChange={(event) =>
                    setAssignForm((current) => ({
                      ...current,
                      role: event.target.value as typeof current.role
                    }))
                  }
                  value={assignForm.role}
                >
                  <option value="member">Member</option>
                  <option value="lead">Lead</option>
                </Select>
              </div>
              <div className="form-actions">
                <Button type="submit">Assign department</Button>
              </div>
            </form>
          ) : (
            <p>Department assignments are restricted for your role.</p>
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Department summaries</p>
        {departmentSummaries.map((row) => (
          <div className="list-row" key={row.department.id}>
            <div className="list-title">
              <div>
                <strong>{row.department.name}</strong>
                <p>{row.department.description || "No summary added yet."}</p>
              </div>
              <StatusBadge
                label={row.lead?.fullName || "No lead"}
                tone={row.lead ? "success" : "warning"}
              />
            </div>
            <div className="stats-inline">
              <div className="info-pair">
                <span>Members</span>
                <strong>{row.memberCount}</strong>
              </div>
              <div className="info-pair">
                <span>Pending reviews</span>
                <strong>{row.pendingReviews}</strong>
              </div>
              <div className="info-pair">
                <span>Returned</span>
                <strong>{row.returnedReviews}</strong>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
