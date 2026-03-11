"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, Input, PageHeader, StatusBadge, Textarea } from "@/components/shared/ui";
import { RFQResponseLineItem } from "@/lib/v4-types";

export default function NetworkRFQDetailPage() {
  const params = useParams<{ rfqId: string }>();
  const { canAccess } = useBusinessOS();
  const {
    acceptRFQResponse,
    currentBusinessId,
    getBusinessProfile,
    incomingRFQRecipients,
    respondToRFQ,
    rfqResponses,
    rfqRecipients,
    rfqs
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const rfq = rfqs.find((entry) => entry.id === params.rfqId);
  const recipients = rfqRecipients.filter((entry) => entry.rfqId === params.rfqId);
  const responses = rfqResponses.filter((entry) => entry.rfqId === params.rfqId);
  const recipientForCurrentBusiness = incomingRFQRecipients.find((entry) => entry.rfqId === params.rfqId);
  const existingResponse = responses.find((entry) => entry.recipientId === recipientForCurrentBusiness?.id);
  const [responseForm, setResponseForm] = useState<{
    notes: string;
    leadTimeDays: number;
    lineItems: RFQResponseLineItem[];
  }>({
    notes: existingResponse?.notes || "",
    leadTimeDays: existingResponse?.leadTimeDays || 3,
    lineItems:
      existingResponse?.lineItems ||
      rfq?.lineItems.map((lineItem) => ({
        id: crypto.randomUUID(),
        name: lineItem.name,
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit: lineItem.unit,
        unitPrice: 0
      })) ||
      []
  });

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="RFQ detail is limited to roles with network access." />
    );
  }

  if (!rfq) {
    return (
      <EmptyState
        action={<Button href="/app/network/rfqs">Back to RFQs</Button>}
        description="The RFQ could not be found."
        title="RFQ not found"
      />
    );
  }

  const isRequester = rfq.requesterBusinessId === currentBusinessId;

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="RFQ detail"
        title={rfq.reference}
        description={rfq.title}
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="two-col">
        <Card>
          <p className="eyebrow">Request summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={rfq.status}
                  tone={
                    rfq.status === "accepted"
                      ? "success"
                      : rfq.status === "responded"
                        ? "warning"
                        : rfq.status === "cancelled"
                          ? "danger"
                          : "muted"
                  }
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Requester</span>
              <strong>{getBusinessProfile(rfq.requesterBusinessId)?.displayName || "Business"}</strong>
            </div>
            <div className="info-pair">
              <span>Due date</span>
              <strong>{rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : "Not set"}</strong>
            </div>
            <div className="info-pair">
              <span>Recipients</span>
              <strong>{rfq.recipientIds.length}</strong>
            </div>
          </div>
          <p style={{ marginTop: 16 }}>{rfq.notes || "No request notes."}</p>
        </Card>

        <Card>
          <p className="eyebrow">Recipients</p>
          {recipients.map((recipient) => (
            <div className="list-row" key={recipient.id}>
              <div className="list-title">
                <strong>{getBusinessProfile(recipient.supplierBusinessId)?.displayName || "Supplier"}</strong>
                <StatusBadge
                  label={recipient.status}
                  tone={recipient.status === "responded" ? "success" : recipient.status === "viewed" ? "warning" : "muted"}
                />
              </div>
              <p>{recipient.note || "No supplier note yet."}</p>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Requested items</p>
        {rfq.lineItems.map((lineItem) => (
          <div className="list-row" key={lineItem.id}>
            <div className="list-title">
              <strong>{lineItem.name}</strong>
              <strong>{lineItem.quantity} {lineItem.unit}</strong>
            </div>
            <p>{lineItem.description || "No line description."}</p>
          </div>
        ))}
      </Card>

      {recipientForCurrentBusiness && canAccess("manage_rfqs") ? (
        <Card>
          <p className="eyebrow">Supplier response</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(
                respondToRFQ(rfq.id, recipientForCurrentBusiness.id, responseForm).message
              );
            }}
          >
            <Input
              label="Lead time (days)"
              onChange={(event) =>
                setResponseForm((current) => ({
                  ...current,
                  leadTimeDays: Number(event.target.value)
                }))
              }
              type="number"
              value={String(responseForm.leadTimeDays)}
            />
            <Textarea
              label="Notes"
              onChange={(event) =>
                setResponseForm((current) => ({ ...current, notes: event.target.value }))
              }
              value={responseForm.notes}
            />
            {responseForm.lineItems.map((lineItem, index) => (
              <Card className="document-line" key={lineItem.id}>
                <div className="split-line">
                  <strong>Response line {index + 1}</strong>
                </div>
                <div className="line-grid">
                  <Input
                    label="Name"
                    onChange={(event) =>
                      setResponseForm((current) => ({
                        ...current,
                        lineItems: current.lineItems.map((entry) =>
                          entry.id === lineItem.id ? { ...entry, name: event.target.value } : entry
                        )
                      }))
                    }
                    value={lineItem.name}
                  />
                  <Input
                    label="Unit price"
                    onChange={(event) =>
                      setResponseForm((current) => ({
                        ...current,
                        lineItems: current.lineItems.map((entry) =>
                          entry.id === lineItem.id
                            ? { ...entry, unitPrice: Number(event.target.value) }
                            : entry
                        )
                      }))
                    }
                    type="number"
                    value={String(lineItem.unitPrice)}
                  />
                </div>
                <Textarea
                  label="Description"
                  onChange={(event) =>
                    setResponseForm((current) => ({
                      ...current,
                      lineItems: current.lineItems.map((entry) =>
                        entry.id === lineItem.id
                          ? { ...entry, description: event.target.value }
                          : entry
                      )
                    }))
                  }
                  value={lineItem.description}
                />
              </Card>
            ))}
            <div className="form-actions">
              <Button type="submit">Submit response</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        <p className="eyebrow">Supplier quote comparison</p>
        {responses.length ? (
          responses.map((response) => (
            <div className="list-row" key={response.id}>
              <div className="list-title">
                <div>
                  <strong>{getBusinessProfile(response.supplierBusinessId)?.displayName || "Supplier"}</strong>
                  <p>{response.notes || "No response note."}</p>
                </div>
                <div className="button-row">
                  <StatusBadge
                    label={response.status}
                    tone={response.status === "accepted" ? "success" : response.status === "submitted" ? "warning" : "muted"}
                  />
                  {isRequester && canAccess("manage_rfqs") && response.status !== "accepted" ? (
                    <Button onClick={() => setMessage(acceptRFQResponse(response.id).message)} type="button">
                      Accept response
                    </Button>
                  ) : null}
                </div>
              </div>
              {response.lineItems.map((lineItem) => (
                <p key={lineItem.id}>
                  {lineItem.name}: {lineItem.quantity} × {lineItem.unitPrice.toFixed(2)} / {lineItem.unit}
                </p>
              ))}
            </div>
          ))
        ) : (
          <EmptyState
            description="Supplier responses will appear here once quotes come back."
            title="No responses yet"
          />
        )}
      </Card>
    </div>
  );
}
