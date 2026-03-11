"use client";

import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { EnterpriseModuleKey } from "@/lib/v6-types";

type ReviewEntityOption = "purchase" | "expense" | "invoice" | "payment" | "settings";

export default function ReviewsPage() {
  const { canAccess, workspaceData } = useBusinessOS();
  const { branches } = useFlowV3();
  const { createReview, decideReview, reviews } = useFlowV6();
  const [message, setMessage] = useState("");
  const [selectedReviewId, setSelectedReviewId] = useState(reviews[0]?.id || "");
  const [decisionNote, setDecisionNote] = useState("");
  const [form, setForm] = useState({
    entityType: "purchase" as ReviewEntityOption,
    entityId: workspaceData.purchases[0]?.id || "",
    module: "purchases" as EnterpriseModuleKey,
    title: "",
    description: "",
    branchId: "",
    amount: "",
    reason: ""
  });
  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId),
    [reviews, selectedReviewId]
  );
  const sourceOptions = {
    purchase: workspaceData.purchases.map((purchase) => ({
      id: purchase.id,
      label: purchase.reference
    })),
    expense: workspaceData.expenses.map((expense) => ({
      id: expense.id,
      label: expense.description
    })),
    invoice: workspaceData.invoices.map((invoice) => ({
      id: invoice.id,
      label: invoice.reference
    })),
    payment: workspaceData.payments.map((payment) => ({
      id: payment.id,
      label: payment.reference || payment.id
    })),
    settings: [{ id: workspaceData.settings?.workspaceId || "workspace", label: "Workspace settings" }]
  };

  if (!canAccess("view_approvals")) {
    return (
      <AccessDeniedState description="Maker-checker visibility is limited to roles with approval access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Maker-checker"
        title="Dual-control workflows for higher-impact actions."
        description="Submit high-risk changes for review, process the queue, and keep the review trail visible."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard
          label="Pending"
          tone={reviews.some((review) => review.status === "pending_review") ? "warning" : "success"}
          value={String(reviews.filter((review) => review.status === "pending_review").length)}
        />
        <MetricCard
          label="Returned"
          tone={reviews.some((review) => review.status === "returned") ? "warning" : "success"}
          value={String(reviews.filter((review) => review.status === "returned").length)}
        />
        <MetricCard
          label="Approved"
          tone="success"
          value={String(reviews.filter((review) => review.status === "approved").length)}
        />
        <MetricCard
          label="Rejected"
          tone="danger"
          value={String(reviews.filter((review) => review.status === "rejected").length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Submit review</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(
                createReview({
                  entityType: form.entityType,
                  entityId: form.entityId,
                  module: form.module,
                  title: form.title,
                  description: form.description,
                  branchId: form.branchId || undefined,
                  amount: Number(form.amount) || undefined,
                  reason: form.reason
                }).message
              );
            }}
          >
            <div className="form-grid">
              <Select
                label="Entity type"
                onChange={(event) => {
                  const entityType = event.target.value as ReviewEntityOption;
                  setForm((current) => ({
                    ...current,
                    entityType,
                    module:
                      entityType === "purchase"
                        ? "purchases"
                        : entityType === "settings"
                          ? "settings"
                          : "finance",
                    entityId: sourceOptions[entityType][0]?.id || ""
                  }));
                }}
                value={form.entityType}
              >
                <option value="purchase">Purchase</option>
                <option value="expense">Expense</option>
                <option value="invoice">Invoice edit</option>
                <option value="payment">Payment edit</option>
                <option value="settings">Settings change</option>
              </Select>
              <Select
                label="Source record"
                onChange={(event) =>
                  setForm((current) => ({ ...current, entityId: event.target.value }))
                }
                value={form.entityId}
              >
                {sourceOptions[form.entityType].map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Branch"
                onChange={(event) =>
                  setForm((current) => ({ ...current, branchId: event.target.value }))
                }
                value={form.branchId}
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
              <Input
                label="Amount"
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                type="number"
                value={form.amount}
              />
            </div>
            <Input
              label="Review title"
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              value={form.title}
            />
            <Textarea
              label="Description"
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              value={form.description}
            />
            <Textarea
              label="Reason / reviewer note"
              onChange={(event) =>
                setForm((current) => ({ ...current, reason: event.target.value }))
              }
              value={form.reason}
            />
            <div className="form-actions">
              <Button type="submit">Submit review</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Review queue</p>
          {reviews.length ? (
            reviews.map((review) => (
              <div className="list-row" key={review.id}>
                <div className="list-title">
                  <div>
                    <strong>{review.title}</strong>
                    <p>{review.description}</p>
                  </div>
                  <StatusBadge
                    label={review.status.replaceAll("_", " ")}
                    tone={
                      review.status === "approved"
                        ? "success"
                        : review.status === "rejected"
                          ? "danger"
                          : review.status === "returned"
                            ? "warning"
                            : "muted"
                    }
                  />
                </div>
                <div className="button-row">
                  <Button
                    kind={selectedReviewId === review.id ? "primary" : "secondary"}
                    onClick={() => setSelectedReviewId(review.id)}
                    type="button"
                  >
                    {selectedReviewId === review.id ? "Selected" : "Open"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="Submitted maker-checker requests will appear here."
              title="No reviews yet"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Review detail</p>
        {selectedReview ? (
          <div className="form-stack">
            <div className="kpi-stack">
              <div className="info-pair">
                <span>Status</span>
                <strong>{selectedReview.status.replaceAll("_", " ")}</strong>
              </div>
              <div className="info-pair">
                <span>Module</span>
                <strong>{selectedReview.module}</strong>
              </div>
              <div className="info-pair">
                <span>Amount</span>
                <strong>{selectedReview.amount || 0}</strong>
              </div>
            </div>
            <Textarea
              label="Decision note"
              onChange={(event) => setDecisionNote(event.target.value)}
              value={decisionNote}
            />
            {canAccess("manage_approvals") && selectedReview.status === "pending_review" ? (
              <div className="button-row">
                <Button
                  onClick={() =>
                    setMessage(
                      decideReview(selectedReview.id, {
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
                  kind="secondary"
                  onClick={() =>
                    setMessage(
                      decideReview(selectedReview.id, {
                        status: "returned",
                        note: decisionNote
                      }).message
                    )
                  }
                  type="button"
                >
                  Return
                </Button>
                <Button
                  kind="danger"
                  onClick={() =>
                    setMessage(
                      decideReview(selectedReview.id, {
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
              {selectedReview.history.map((entry) => (
                <div className="list-row" key={entry.id}>
                  <div className="list-title">
                    <strong>{entry.action}</strong>
                    <span>{entry.actorRole}</span>
                  </div>
                  <p>{entry.note || "No note."}</p>
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <EmptyState description="Choose a review request to inspect its decision trail." title="No review selected" />
        )}
      </Card>
    </div>
  );
}
