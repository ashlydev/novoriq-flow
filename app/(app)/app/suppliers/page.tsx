"use client";

import Link from "next/link";
import { useState } from "react";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { Card, EmptyState, Input, PageHeader } from "@/components/shared/ui";
import { formatCurrency, getSupplierSpendTotal } from "@/lib/calculations";

export default function SuppliersPage() {
  const { currentWorkspace, saveSupplier, workspaceData } = useBusinessOS();
  const { getBusinessProfile, getSupplierLinkForSupplier } = useFlowV4();
  const [search, setSearch] = useState("");
  const currency = currentWorkspace?.currency || "USD";

  const filteredSuppliers = workspaceData.suppliers.filter((supplier) =>
    [supplier.name, supplier.email, supplier.phone, supplier.notes]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Suppliers"
        title="Suppliers and spend visibility."
        description="Track who you pay, what you buy from them, and how often they show up in expenses."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Add supplier</p>
          <SupplierForm onSubmit={(value) => saveSupplier(value)} />
        </Card>

        <Card>
          <p className="eyebrow">Search suppliers</p>
          <Input
            label="Search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, or notes"
            value={search}
          />
          {filteredSuppliers.length ? (
            filteredSuppliers.map((supplier) => {
              const linkedBusinessId = getSupplierLinkForSupplier(supplier.id)?.businessProfileId;
              const linkedBusiness = linkedBusinessId
                ? getBusinessProfile(linkedBusinessId)
                : undefined;

              return (
                <div className="list-row" key={supplier.id}>
                  <div className="list-title">
                    <div>
                      <Link href={`/app/suppliers/${supplier.id}`}>
                        <strong>{supplier.name}</strong>
                      </Link>
                      <p>{supplier.email || supplier.phone || "No contact set"}</p>
                    </div>
                    <strong>
                      {formatCurrency(
                        getSupplierSpendTotal(supplier.id, workspaceData.expenses),
                        currency
                      )}
                    </strong>
                  </div>
                  <p>{supplier.notes || "No notes yet."}</p>
                  {linkedBusiness ? (
                    <p>
                      Connected in network as{" "}
                      <Link className="text-button" href={`/app/network/businesses/${linkedBusiness.id}`}>
                        {linkedBusiness.displayName}
                      </Link>
                    </p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Use the form on the left to create your first supplier record."
              title="No suppliers match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
