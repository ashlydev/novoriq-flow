"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import {
  Button,
  Card,
  EmptyState,
  MetricCard,
  PageHeader,
  StatusBadge,
  Textarea
} from "@/components/shared/ui";
import { formatDateTime } from "@/lib/calculations";

export default function ApprovalsPage() {
  const { canAccess } = useBusinessOS();
  const { approvalCounts, approvals, branches, decideApproval, teamProfiles } = useFlowV3();
  const { reviews } = useFlowV6();
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>("");
  const [decisionNote, setDecisionNote] = useState("");
  const [message, setMessage] = useState("");

  if (!canAccess("view_approvals")) {
    return (
      <AccessDeniedState description="Approval visibility is limited to manager, admin, and owner roles." />
    );
  }

  const selectedApproval = approvals.find((approval) => approval.id === selectedApprovalId);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Approvals"
        title="Control sensitive actions with simple approvals."
        description="Large expenses, important purchases, and other high-impact events can be reviewed here without building a complex workflow engine."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Pending" tone="warning" value={String(approvalCounts.pending)} />
        <MetricCard label="Approved" tone="success" value={String(approvalCounts.approved)} />
        <MetricCard label="Rejected" tone="danger" value={String(approvalCounts.rejected)} />
        <MetricCard label="Total requests" value={String(approvals.length)} />
        <MetricCard
          label="Maker-checker queue"
          tone={reviews.some((review) => review.status === "pending_review") ? "warning" : "success"}
          value={String(reviews.filter((review) => review.status === "pending_review").length)}
        />
      </div>

      <Card>
        <p className="eyebrow">Enterprise review layer</p>
        <p>
          Classic approvals remain here for V3 workflows. V6 maker-checker reviews now handle
          finance-sensitive, procurement, and settings-related dual-control actions.
        </p>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <Link className="button button-secondary" href="/app/reviews">
            Open maker-checker queue
          </Link>
        </div>
      </Card>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Approval queue</p>
          {approvals.length ? (
            approvals.map((approval) => {
              const branch = branches.find((record) => record.id === approval.branchId);
              return (
                <div className="list-row" key={approval.id}>
                  <div className="list-title">
                    <div>
                      <strong>{approval.title}</strong>
                      <p>{approval.description}</p>
                    </div>
                    <StatusBadge
                      label={approval.status}
                      tone={
                        approval.status === "approved"
                          ? "success"
                          : approval.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    />
                  </div>
                  <p>
                    {approval.entityType.replace("_", " ")} · {branch?.name || "All branches"} ·{" "}
                    {formatDateTime(approval.createdAt)}
                  </p>
                  <div className="button-row">
                    <Button
                      kind={selectedApprovalId === approval.id ? "primary" : "secondary"}
                      onClick={() => setSelectedApprovalId(approval.id)}
                      type="button"
                    >
                      {selectedApprovalId === approval.id ? "Selected" : "Review"}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Approval requests will appear here when high-impact actions need review."
              title="No approvals waiting"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Approval detail</p>
          {selectedApproval ? (
            <div className="form-stack">
              <div className="kpi-stack">
                <div className="info-pair">
                  <span>Status</span>
                  <strong>{selectedApproval.status}</strong>
                </div>
                <div className="info-pair">
                  <span>Requested</span>
                  <strong>{formatDateTime(selectedApproval.createdAt)}</strong>
                </div>
                <div className="info-pair">
                  <span>Requested by</span>
                  <strong>
                    {teamProfiles.find((profile) => profile.userId === selectedApproval.requestedBy)?.fullName || "Unknown"}
                  </strong>
                </div>
              </div>
              <Textarea
                label="Decision note"
                onChange={(event) => setDecisionNote(event.target.value)}
                value={decisionNote}
              />
              {canAccess("manage_approvals") && selectedApproval.status === "pending" ? (
                <div className="button-row">
                  <Button
                    onClick={() =>
                      setMessage(
                        decideApproval(selectedApproval.id, {
                          status: "approved",
                          note: decisionNote
                        }).message
                      )
                    }
                    type="button"
                  >
                    Approve
                  </Button>
                  <Button
                    kind="danger"
                    onClick={() =>
                      setMessage(
                        decideApproval(selectedApproval.id, {
                          status: "rejected",
                          note: decisionNote
                        }).message
                      )
                    }
                    type="button"
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
              <Card>
                <p className="eyebrow">History</p>
                {selectedApproval.history.map((entry) => (
                  <div className="list-row" key={entry.id}>
                    <div className="list-title">
                      <strong>{entry.action}</strong>
                      <span>{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <p>{entry.note || "No note added."}</p>
                  </div>
                ))}
              </Card>
            </div>
          ) : (
            <EmptyState
              description="Pick an approval request on the left to review its history and decision actions."
              title="No approval selected"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
