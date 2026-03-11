"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import {
  Button,
  Card,
  EmptyState,
  Input,
  MetricCard,
  PageHeader,
  Select,
  StatusBadge
} from "@/components/shared/ui";

export default function NetworkDiscoveryPage() {
  const { canAccess } = useBusinessOS();
  const {
    bookmarkedBusinessIds,
    currentBusinessProfile,
    discoverableBusinesses,
    getBusinessCatalogs,
    getConnectionForBusiness,
    getTrustMetrics,
    networkSummary,
    reorderSuggestions,
    toggleBookmark
  } = useFlowV4();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [connectionFilter, setConnectionFilter] = useState("all");

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="The business network is limited to roles with network visibility." />
    );
  }

  const cities = Array.from(new Set(discoverableBusinesses.map((profile) => profile.city))).sort();
  const filteredBusinesses = useMemo(
    () =>
      discoverableBusinesses.filter((profile) => {
        const connection = getConnectionForBusiness(profile.id);
        const catalogItems = getBusinessCatalogs(profile.id)
          .flatMap((catalog) => catalog.title)
          .join(" ");
        const haystack = [
          profile.displayName,
          profile.businessType,
          profile.city,
          profile.productsSummary,
          catalogItems
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesType = typeFilter === "all" ? true : profile.businessType === typeFilter;
        const matchesCity = cityFilter === "all" ? true : profile.city === cityFilter;
        const matchesConnection =
          connectionFilter === "all"
            ? true
            : connectionFilter === "bookmarked"
              ? bookmarkedBusinessIds.includes(profile.id)
              : (connection?.status || "none") === connectionFilter;

        return matchesSearch && matchesType && matchesCity && matchesConnection;
      }),
    [
      bookmarkedBusinessIds,
      cityFilter,
      connectionFilter,
      discoverableBusinesses,
      getBusinessCatalogs,
      getConnectionForBusiness,
      search,
      typeFilter
    ]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Business network"
        title="Discover and connect with relevant suppliers and buyers."
        description="Find trusted businesses, view their catalogs, manage connection requests, and move from discovery into trade workflows without leaving Flow."
        action={
          <div className="button-row">
            <Button href="/app/network/profile">My profile</Button>
            <Button href="/app/network/connections" kind="secondary">
              Connections
            </Button>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard label="Connected businesses" value={String(networkSummary.connectedBusinesses)} />
        <MetricCard
          label="Pending requests"
          tone={networkSummary.pendingConnectionRequests ? "warning" : "success"}
          value={String(networkSummary.pendingConnectionRequests)}
        />
        <MetricCard label="Open RFQs" value={String(networkSummary.openRFQs)} />
        <MetricCard label="Reorder opportunities" value={String(reorderSuggestions.length)} />
      </div>

      <div className="list-grid">
        <Card>
          <p className="eyebrow">Your network profile</p>
          {currentBusinessProfile ? (
            <div className="kpi-stack">
              <div className="info-pair">
                <span>Visibility</span>
                <strong>{currentBusinessProfile.visibility}</strong>
              </div>
              <div className="info-pair">
                <span>Operating status</span>
                <strong>{currentBusinessProfile.operatingStatus}</strong>
              </div>
              <div className="info-pair">
                <span>Summary</span>
                <strong>{currentBusinessProfile.productsSummary || "Not set"}</strong>
              </div>
            </div>
          ) : (
            <p>No network profile yet.</p>
          )}
        </Card>

        <Card>
          <p className="eyebrow">Action panels</p>
          <div className="button-row">
            <Button href="/app/network/orders" kind="secondary">
              Purchase orders
            </Button>
            <Button href="/app/network/rfqs" kind="secondary">
              RFQs
            </Button>
            <Button href="/app/network/catalogs" kind="secondary">
              Catalogs
            </Button>
            <Button href="/app/network/reorders" kind="secondary">
              Reorders
            </Button>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Repeat opportunities</p>
          {reorderSuggestions.length ? (
            reorderSuggestions.slice(0, 3).map((suggestion) => (
              <div className="list-row" key={suggestion.id}>
                <div className="list-title">
                  <strong>{suggestion.title}</strong>
                  <span>{suggestion.businessName}</span>
                </div>
                <Link className="text-button" href={suggestion.href}>
                  Open source
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              description="Repeat order opportunities will appear as you trade with connected suppliers."
              title="No repeat opportunities yet"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Search suppliers and connected businesses</p>
        <div className="form-grid">
          <Input
            label="Search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Business name, category, city, or catalog"
            value={search}
          />
          <Select
            label="Business type"
            onChange={(event) => setTypeFilter(event.target.value)}
            value={typeFilter}
          >
            <option value="all">All types</option>
            {Array.from(new Set(discoverableBusinesses.map((profile) => profile.businessType))).map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              )
            )}
          </Select>
          <Select
            label="City"
            onChange={(event) => setCityFilter(event.target.value)}
            value={cityFilter}
          >
            <option value="all">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
          <Select
            label="Relationship"
            onChange={(event) => setConnectionFilter(event.target.value)}
            value={connectionFilter}
          >
            <option value="all">All</option>
            <option value="accepted">Connected</option>
            <option value="pending">Pending</option>
            <option value="bookmarked">Bookmarked</option>
            <option value="none">Not connected</option>
          </Select>
        </div>

        {filteredBusinesses.length ? (
          filteredBusinesses.map((profile) => {
            const connection = getConnectionForBusiness(profile.id);
            const trust = getTrustMetrics(profile.id);
            const catalogs = getBusinessCatalogs(profile.id);
            return (
              <div className="list-row" key={profile.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/network/businesses/${profile.id}`}>
                      <strong>{profile.displayName}</strong>
                    </Link>
                    <p>
                      {profile.businessType} · {profile.city}
                    </p>
                  </div>
                  <div className="button-row">
                    <StatusBadge
                      label={connection?.status || "discover"}
                      tone={
                        connection?.status === "accepted"
                          ? "success"
                          : connection?.status === "pending"
                            ? "warning"
                            : "muted"
                      }
                    />
                    <Button
                      kind={bookmarkedBusinessIds.includes(profile.id) ? "primary" : "secondary"}
                      onClick={() => toggleBookmark(profile.id)}
                      type="button"
                    >
                      {bookmarkedBusinessIds.includes(profile.id) ? "Saved" : "Save"}
                    </Button>
                  </div>
                </div>
                <p>{profile.productsSummary || profile.about || "No summary shared yet."}</p>
                <div className="stats-inline">
                  <div className="info-pair">
                    <span>Catalogs</span>
                    <strong>{catalogs.length}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Completed orders</span>
                    <strong>{trust.completedOrderCount}</strong>
                  </div>
                  <div className="info-pair">
                    <span>Avg response</span>
                    <strong>{trust.averageResponseHours || 0}h</strong>
                  </div>
                  <div className="info-pair">
                    <span>Profile</span>
                    <strong>{trust.profileCompleteness}%</strong>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ marginTop: 16 }}>
            <EmptyState
              description="Adjust the filters or search terms to widen the business list."
              title="No businesses match"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
