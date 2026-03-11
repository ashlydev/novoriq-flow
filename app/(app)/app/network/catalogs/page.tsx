"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { SupplierCatalog, SupplierCatalogItem } from "@/lib/v4-types";

export default function NetworkCatalogsPage() {
  const { canAccess, workspaceData } = useBusinessOS();
  const {
    catalogs,
    catalogItems,
    currentBusinessId,
    getBusinessProfile,
    saveCatalog,
    saveCatalogItem,
    visibleCatalogs
  } = useFlowV4();
  const [message, setMessage] = useState("");
  const ownCatalogs = catalogs.filter((catalog) => catalog.businessProfileId === currentBusinessId);
  const [catalogForm, setCatalogForm] = useState({
    title: "",
    description: "",
    visibility: "connections" as SupplierCatalog["visibility"],
    status: "active" as SupplierCatalog["status"]
  });
  const [itemForm, setItemForm] = useState({
    catalogId: ownCatalogs[0]?.id || "",
    sourceItemId: "",
    name: "",
    description: "",
    price: 0,
    unit: "unit",
    category: "",
    availability: "available" as SupplierCatalogItem["availability"]
  });
  const [search, setSearch] = useState("");

  const filteredCatalogs = useMemo(
    () =>
      visibleCatalogs.filter((catalog) => {
        const owner = getBusinessProfile(catalog.businessProfileId);
        return [catalog.title, catalog.description, owner?.displayName]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [getBusinessProfile, search, visibleCatalogs]
  );

  if (!canAccess("view_network")) {
    return (
      <AccessDeniedState description="Catalogs are limited to roles with business network access." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Supplier catalogs"
        title="Publish your catalog and browse what connected suppliers share."
        description="Keep catalogs practical: reusable items, controlled visibility, and simple mobile-first maintenance."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Visible catalogs" value={String(visibleCatalogs.length)} />
        <MetricCard label="Own catalogs" value={String(ownCatalogs.length)} />
        <MetricCard
          label="Visible suppliers"
          value={String(new Set(visibleCatalogs.map((catalog) => catalog.businessProfileId)).size)}
        />
        <MetricCard
          label="Catalog items"
          value={String(catalogItems.filter((item) => visibleCatalogs.some((catalog) => catalog.id === item.catalogId)).length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create or update your catalog</p>
          {canAccess("manage_catalogs") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                const result = saveCatalog(catalogForm);
                setMessage(result.message);
                if (result.success && result.id) {
                  setItemForm((current) => ({ ...current, catalogId: result.id || current.catalogId }));
                }
              }}
            >
              <Input
                label="Catalog title"
                onChange={(event) =>
                  setCatalogForm((current) => ({ ...current, title: event.target.value }))
                }
                value={catalogForm.title}
              />
              <Textarea
                label="Description"
                onChange={(event) =>
                  setCatalogForm((current) => ({ ...current, description: event.target.value }))
                }
                value={catalogForm.description}
              />
              <div className="form-grid">
                <Select
                  label="Visibility"
                  onChange={(event) =>
                    setCatalogForm((current) => ({
                      ...current,
                      visibility: event.target.value as SupplierCatalog["visibility"]
                    }))
                  }
                  value={catalogForm.visibility}
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections only</option>
                  <option value="private">Private</option>
                </Select>
                <Select
                  label="Status"
                  onChange={(event) =>
                    setCatalogForm((current) => ({
                      ...current,
                      status: event.target.value as SupplierCatalog["status"]
                    }))
                  }
                  value={catalogForm.status}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
              <div className="form-actions">
                <Button type="submit">Save catalog</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="Catalog publishing is limited to roles allowed to manage outbound network sales information."
              title="Catalog editing restricted"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Add item to your catalog</p>
          {canAccess("manage_catalogs") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(saveCatalogItem(itemForm.catalogId, itemForm).message);
              }}
            >
              <div className="form-grid">
                <Select
                  label="Catalog"
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, catalogId: event.target.value }))
                  }
                  value={itemForm.catalogId}
                >
                  <option value="">Select catalog</option>
                  {ownCatalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.title}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Existing item"
                  onChange={(event) => {
                    const item = workspaceData.items.find((record) => record.id === event.target.value);
                    setItemForm((current) => ({
                      ...current,
                      sourceItemId: event.target.value,
                      name: item?.name || current.name,
                      description: item?.description || current.description,
                      price: item?.sellingPrice || current.price,
                      category: item?.category || current.category,
                      unit: item?.kind === "service" ? "service" : "unit"
                    }));
                  }}
                  value={itemForm.sourceItemId}
                >
                  <option value="">Custom item</option>
                  {workspaceData.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Name"
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={itemForm.name}
                />
                <Input
                  label="Price"
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                  type="number"
                  value={String(itemForm.price)}
                />
                <Input
                  label="Unit"
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, unit: event.target.value }))
                  }
                  value={itemForm.unit}
                />
                <Input
                  label="Category"
                  onChange={(event) =>
                    setItemForm((current) => ({ ...current, category: event.target.value }))
                  }
                  value={itemForm.category}
                />
              </div>
              <Textarea
                label="Description"
                onChange={(event) =>
                  setItemForm((current) => ({ ...current, description: event.target.value }))
                }
                value={itemForm.description}
              />
              <Select
                label="Availability"
                onChange={(event) =>
                  setItemForm((current) => ({
                    ...current,
                    availability: event.target.value as SupplierCatalogItem["availability"]
                  }))
                }
                value={itemForm.availability}
              >
                <option value="available">Available</option>
                <option value="limited">Limited</option>
                <option value="out_of_stock">Out of stock</option>
              </Select>
              <div className="form-actions">
                <Button type="submit">Add catalog item</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="Roles without catalog control can still browse supplier catalogs."
              title="Catalog item editing restricted"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Browse catalogs</p>
        <Input
          label="Search catalogs"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Supplier, catalog title, or description"
          value={search}
        />
        {filteredCatalogs.length ? (
          filteredCatalogs.map((catalog) => {
            const owner = getBusinessProfile(catalog.businessProfileId);
            return (
              <div className="list-row" key={catalog.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/network/catalogs/${catalog.id}`}>
                      <strong>{catalog.title}</strong>
                    </Link>
                    <p>{owner?.displayName || "Business"}</p>
                  </div>
                  <div className="button-row">
                    <StatusBadge label={catalog.visibility} tone="muted" />
                    {owner?.id !== currentBusinessId ? (
                      <Button href={`/app/network/businesses/${owner?.id}`} kind="secondary">
                        Open profile
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p>{catalog.description || "No catalog description."}</p>
              </div>
            );
          })
        ) : (
          <div style={{ marginTop: 16 }}>
            <EmptyState
              description="Try a broader search or publish your first catalog."
              title="No catalogs match"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
