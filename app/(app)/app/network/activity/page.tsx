"use client";

import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Card, EmptyState, PageHeader, Select } from "@/components/shared/ui";

export default function NetworkActivityPage() {
  const { canAccess } = useBusinessOS();
  const {
    acceptedConnections,
    currentBusinessId,
    getBusinessProfile,
    getRelationshipTimelineForBusiness
  } = useFlowV4();
  const [businessId, setBusinessId] = useState("");

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Network activity is limited to roles with network access." />
    );
  }

  const timeline = useMemo(
    () => (businessId ? getRelationshipTimelineForBusiness(businessId) : []),
    [businessId, getRelationshipTimelineForBusiness]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Network activity"
        title="Track shared supplier and buyer history."
        description="Review purchase orders, RFQs, accepted/rejected actions, and relationship events with each connected business."
      />

      <Card>
        <Select
          label="Connected business"
          onChange={(event) => setBusinessId(event.target.value)}
          value={businessId}
        >
          <option value="">Select business</option>
          {acceptedConnections.map((connection) => {
            const otherId =
              connection.requesterBusinessId === currentBusinessId
                ? connection.recipientBusinessId
                : connection.requesterBusinessId;
            const profile = getBusinessProfile(otherId);
            return (
              <option key={connection.id} value={profile?.id || ""}>
                {profile?.displayName || "Business"}
              </option>
            );
          })}
        </Select>
      </Card>

      <Card>
        <p className="eyebrow">Relationship timeline</p>
        {timeline.length ? (
          timeline.map((entry) => (
            <div className="list-row" key={entry.id}>
              <div className="list-title">
                <strong>{entry.title}</strong>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <p>{entry.message}</p>
            </div>
          ))
        ) : (
          <EmptyState
            description="Choose a connected business to see the shared network history."
            title="No relationship selected"
          />
        )}
      </Card>
    </div>
  );
}
