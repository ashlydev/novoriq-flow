"use client";

import Link from "next/link";
import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, MetricCard, PageHeader, StatusBadge, Textarea } from "@/components/shared/ui";

export default function NetworkConnectionsPage() {
  const { canAccess } = useBusinessOS();
  const {
    acceptedConnections,
    currentBusinessId,
    disconnectBusiness,
    getBusinessProfile,
    incomingConnectionRequests,
    outgoingConnectionRequests,
    respondToConnectionRequest,
    updateConnectionNotes
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Connections are limited to roles with business network access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Connections"
        title="Keep business relationships explicit and controlled."
        description="Review incoming requests, see what is still pending, and manage connected suppliers and buyers without turning the network into an open marketplace."
        action={<Button href="/app/network">Back to discovery</Button>}
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Connected" value={String(acceptedConnections.length)} />
        <MetricCard
          label="Incoming requests"
          tone={incomingConnectionRequests.length ? "warning" : "success"}
          value={String(incomingConnectionRequests.length)}
        />
        <MetricCard label="Outgoing requests" value={String(outgoingConnectionRequests.length)} />
        <MetricCard
          label="Preferred suppliers"
          value={String(acceptedConnections.filter((connection) => connection.relationshipType !== "buyer").length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Incoming requests</p>
          {incomingConnectionRequests.length ? (
            incomingConnectionRequests.map((connection) => {
              const requester = getBusinessProfile(connection.requesterBusinessId);
              return (
                <div className="list-row" key={connection.id}>
                  <div className="list-title">
                    <div>
                      <strong>{requester?.displayName || "Business"}</strong>
                      <p>{connection.relationshipType}</p>
                    </div>
                    <StatusBadge label="pending" tone="warning" />
                  </div>
                  <p>{connection.notes || "No request note provided."}</p>
                  {canAccess("manage_connections") ? (
                    <div className="button-row">
                      <Button
                        onClick={() => setMessage(respondToConnectionRequest(connection.id, "accepted").message)}
                        type="button"
                      >
                        Accept
                      </Button>
                      <Button
                        kind="danger"
                        onClick={() => setMessage(respondToConnectionRequest(connection.id, "rejected").message)}
                        type="button"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              description="New supplier or buyer requests will appear here."
              title="No incoming requests"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Outgoing requests</p>
          {outgoingConnectionRequests.length ? (
            outgoingConnectionRequests.map((connection) => {
              const recipient = getBusinessProfile(connection.recipientBusinessId);
              return (
                <div className="list-row" key={connection.id}>
                  <div className="list-title">
                    <div>
                      <strong>{recipient?.displayName || "Business"}</strong>
                      <p>{connection.relationshipType}</p>
                    </div>
                    <StatusBadge label="pending" tone="warning" />
                  </div>
                  <p>{connection.notes || "Waiting for response."}</p>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Requests you send will stay visible here until they are resolved."
              title="No outgoing requests"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Connected businesses</p>
        {acceptedConnections.length ? (
          acceptedConnections.map((connection) => {
            const targetBusinessId =
              connection.requesterBusinessId === currentBusinessId
                ? connection.recipientBusinessId
                : connection.requesterBusinessId;
            const business = getBusinessProfile(targetBusinessId);
            return (
              <div className="list-row" key={connection.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/network/businesses/${business?.id || targetBusinessId}`}>
                      <strong>{business?.displayName || "Business"}</strong>
                    </Link>
                    <p>{connection.relationshipType}</p>
                  </div>
                  <div className="button-row">
                    <StatusBadge label="connected" tone="success" />
                    {canAccess("manage_connections") ? (
                      <Button
                        kind="danger"
                        onClick={() => setMessage(disconnectBusiness(connection.id).message)}
                        type="button"
                      >
                        Disconnect
                      </Button>
                    ) : null}
                  </div>
                </div>
                <Textarea
                  label="Relationship notes"
                  onChange={(event) =>
                    setDraftNotes((current) => ({
                      ...current,
                      [connection.id]: event.target.value
                    }))
                  }
                  value={draftNotes[connection.id] ?? connection.notes ?? ""}
                />
                <div className="form-actions">
                  <Button
                    kind="secondary"
                    onClick={() =>
                      setMessage(
                        updateConnectionNotes(
                          connection.id,
                          draftNotes[connection.id] ?? connection.notes ?? ""
                        ).message
                      )
                    }
                    type="button"
                  >
                    Save notes
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            description="Accepted suppliers and buyers will appear here as the network grows."
            title="No connected businesses yet"
          />
        )}
      </Card>
    </div>
  );
}
