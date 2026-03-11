"use client";

import Link from "next/link";
import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Card, PageHeader, Select, StatusBadge, Textarea, Input, Button } from "@/components/shared/ui";
import { UserRole } from "@/lib/types";

const roleOptions: UserRole[] = ["owner", "admin", "manager", "staff"];

export default function TeamPage() {
  const { canAccess, changeMemberRole, currentUser, workspaceData } = useBusinessOS();
  const {
    inviteTeamMember,
    teamInvites,
    teamProfiles,
    updateTeamProfile,
    setTeamProfileStatus
  } = useFlowV3();
  const { getDepartmentForProfile } = useFlowV6();
  const [message, setMessage] = useState("");
  const [inviteForm, setInviteForm] = useState({
    fullName: "",
    email: "",
    role: "staff" as UserRole,
    department: "",
    notes: ""
  });

  if (!canAccess("manage_roles")) {
    return (
      <AccessDeniedState description="Only owner and admin roles can manage team access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Team access"
        title="Collaboration that stays practical."
        description="Invite teammates, assign roles, group them by department, and control who is active without turning access into an enterprise matrix."
        action={
          <div className="button-row">
            <Link className="button button-secondary" href="/app/departments">
              Departments
            </Link>
            <Link className="button button-secondary" href="/app/permissions">
              Permissions
            </Link>
          </div>
        }
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="two-col">
        <Card>
          <p className="eyebrow">Invite teammate</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = inviteTeamMember(inviteForm);
              setMessage(result.message);
              if (result.success) {
                setInviteForm({
                  fullName: "",
                  email: "",
                  role: "staff",
                  department: "",
                  notes: ""
                });
              }
            }}
          >
            <div className="form-grid">
              <Input
                label="Full name"
                onChange={(event) =>
                  setInviteForm((current) => ({ ...current, fullName: event.target.value }))
                }
                value={inviteForm.fullName}
              />
              <Input
                label="Email"
                onChange={(event) =>
                  setInviteForm((current) => ({ ...current, email: event.target.value }))
                }
                type="email"
                value={inviteForm.email}
              />
              <Select
                label="Role"
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    role: event.target.value as UserRole
                  }))
                }
                value={inviteForm.role}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
              <Input
                label="Department"
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    department: event.target.value
                  }))
                }
                value={inviteForm.department}
              />
            </div>
            <Textarea
              label="Invite notes"
              onChange={(event) =>
                setInviteForm((current) => ({ ...current, notes: event.target.value }))
              }
              value={inviteForm.notes}
            />
            <div className="form-actions">
              <Button type="submit">Create invite</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Pending invites</p>
          {teamInvites.length ? (
            teamInvites.map((invite) => (
              <div className="list-row" key={invite.id}>
                <div className="list-title">
                  <div>
                    <strong>{invite.fullName}</strong>
                    <p>{invite.email}</p>
                  </div>
                  <StatusBadge label={invite.status} tone="warning" />
                </div>
                <p>
                  {invite.role} · {invite.department || "No department"}
                </p>
              </div>
            ))
          ) : (
            <p>No pending invites.</p>
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Managed team</p>
        {teamProfiles.map((profile) => {
          const member = workspaceData.teamMembers.find(
            (entry) => entry.member.userId === profile.userId
          );
          return (
            <div className="list-row" key={profile.id}>
              <div className="list-title">
                <div>
                  <strong>{profile.fullName}</strong>
                  <p>{profile.email}</p>
                </div>
                <div className="button-row">
                  <StatusBadge
                    label={profile.status}
                    tone={profile.status === "active" ? "success" : "warning"}
                  />
                  <StatusBadge label={profile.role} tone="muted" />
                </div>
              </div>
              <div className="form-grid">
                <Select
                  disabled={profile.userId === currentUser?.id && profile.role === "owner"}
                  label="Role"
                  onChange={(event) =>
                    setMessage(
                      member
                        ? changeMemberRole(
                            member.member.id,
                            event.target.value as UserRole
                          ).message
                        : "Role can be changed after membership is created."
                    )
                  }
                  value={profile.role}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Status"
                  onChange={(event) =>
                    setMessage(
                      setTeamProfileStatus(
                        profile.id,
                        event.target.value as typeof profile.status
                      ).message
                    )
                  }
                  value={profile.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="invited">Invited</option>
                </Select>
                <Input
                  label="Department"
                  onBlur={(event) =>
                    setMessage(
                      updateTeamProfile(profile.id, {
                        department: event.target.value,
                        notes: profile.notes
                      }).message
                    )
                  }
                  defaultValue={profile.department || ""}
                />
                <Textarea
                  label="Notes"
                  onBlur={(event) =>
                    setMessage(
                      updateTeamProfile(profile.id, {
                        department: profile.department,
                        notes: event.target.value
                      }).message
                    )
                  }
                  defaultValue={profile.notes || ""}
                />
              </div>
              <p>
                Enterprise department:{" "}
                {getDepartmentForProfile(profile.id)?.name || "Not assigned in V6 department map"}
              </p>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
