"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, PageHeader, StatusBadge, Textarea } from "@/components/shared/ui";

export default function NetworkBusinessDetailPage() {
  const params = useParams<{ businessId: string }>();
  const { canAccess } = useBusinessOS();
  const {
    bookmarkedBusinessIds,
    currentBusinessId,
    getBusinessCatalogs,
    getBusinessProfile,
    getCatalogItems,
    getConnectionForBusiness,
    getRelationshipTimelineForBusiness,
    getTrustMetrics,
    respondToConnectionRequest,
    sendConnectionRequest,
    toggleBookmark,
    updateConnectionNotes
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const profile = getBusinessProfile(params.businessId);
  const connection = getConnectionForBusiness(params.businessId);
  const trust = getTrustMetrics(params.businessId);
  const catalogs = getBusinessCatalogs(params.businessId);
  const timeline = getRelationshipTimelineForBusiness(params.businessId);

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Business profile visibility is limited to network-enabled roles." />
    );
  }

  if (!profile) {
    return (
      <EmptyState
        action={<Button href="/app/network">Back to network</Button>}
        description="The business profile could not be found or is not visible."
        title="Business not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Business profile"
        title={profile.displayName}
        description={`${profile.businessType} in ${profile.city}, ${profile.country}.`}
        action={
          <div className="button-row">
            <Button
              kind={bookmarkedBusinessIds.includes(profile.id) ? "primary" : "secondary"}
              onClick={() => setMessage(toggleBookmark(profile.id).message)}
              type="button"
            >
              {bookmarkedBusinessIds.includes(profile.id) ? "Saved" : "Save supplier"}
            </Button>
            {!connection && canAccess("manage_connections") ? (
              <Button
                onClick={() =>
                  setMessage(
                    sendConnectionRequest(profile.id, {
                      relationshipType: "supplier",
                      notes: `Connection request sent to ${profile.displayName}.`
                    }).message
                  )
                }
                type="button"
              >
                Connect
              </Button>
            ) : null}
          </div>
        }
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="two-col">
        <Card>
          <p className="eyebrow">Profile overview</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Visibility</span>
              <strong>{profile.visibility}</strong>
            </div>
            <div className="info-pair">
              <span>Status</span>
              <strong>{profile.operatingStatus}</strong>
            </div>
            <div className="info-pair">
              <span>Contact</span>
              <strong>{profile.email || profile.phone || "Not shared"}</strong>
            </div>
            <div className="info-pair">
              <span>Catalogs</span>
              <strong>{catalogs.length}</strong>
            </div>
          </div>
          <p style={{ marginTop: 16 }}>{profile.about || "No business summary shared yet."}</p>
          <p>{profile.productsSummary || "No products summary shared yet."}</p>
        </Card>

        <Card>
          <p className="eyebrow">Trust indicators</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Completed orders</span>
              <strong>{trust.completedOrderCount}</strong>
            </div>
            <div className="info-pair">
              <span>Accepted orders</span>
              <strong>{trust.acceptedOrderCount}</strong>
            </div>
            <div className="info-pair">
              <span>Cancelled / rejected</span>
              <strong>{trust.cancelledOrderCount}</strong>
            </div>
            <div className="info-pair">
              <span>Average response</span>
              <strong>{trust.averageResponseHours || 0}h</strong>
            </div>
            <div className="info-pair">
              <span>Relationship age</span>
              <strong>{trust.relationshipAgeDays} days</strong>
            </div>
            <div className="info-pair">
              <span>Profile completeness</span>
              <strong>{trust.profileCompleteness}%</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Relationship status</p>
          {connection ? (
            <div className="form-stack">
              <div className="button-row">
                <StatusBadge
                  label={connection.status}
                  tone={
                    connection.status === "accepted"
                      ? "success"
                      : connection.status === "pending"
                        ? "warning"
                        : "muted"
                  }
                />
                <StatusBadge label={connection.relationshipType} tone="muted" />
              </div>
              {connection.status === "pending" &&
              connection.recipientBusinessId === currentBusinessId &&
              canAccess("manage_connections") ? (
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
              <Textarea
                label="Relationship notes"
                onChange={(event) => setNotes(event.target.value)}
                value={notes || connection.notes || ""}
              />
              <div className="form-actions">
                <Button
                  kind="secondary"
                  onClick={() => setMessage(updateConnectionNotes(connection.id, notes || connection.notes || "").message)}
                  type="button"
                >
                  Save notes
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              description="Send a connection request to unlock controlled network workflows with this business."
              title="No active relationship yet"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Catalog preview</p>
          {catalogs.length ? (
            catalogs.map((catalog) => (
              <div className="list-row" key={catalog.id}>
                <div className="list-title">
                  <Link href={`/app/network/catalogs/${catalog.id}`}>
                    <strong>{catalog.title}</strong>
                  </Link>
                  <StatusBadge label={catalog.visibility} tone="muted" />
                </div>
                <p>{catalog.description || "No catalog description."}</p>
                <p>{getCatalogItems(catalog.id).length} items</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="This business has not shared a visible catalog yet."
              title="No catalogs visible"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Relationship history</p>
        {timeline.length ? (
          timeline.map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-title">
                <strong>{entry.title}</strong>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
              <p>{entry.message}</p>
              {entry.href ? (
                <Link className="text-button" href={entry.href}>
                  Open
                </Link>
              ) : null}
            </div>
          ))
        ) : (
          <EmptyState
            description="Connection events, RFQs, orders, and reorder activity will appear here."
            title="No shared history yet"
          />
        )}
      </Card>
    </div>
  );
}
