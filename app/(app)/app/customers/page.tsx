"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerForm } from "@/components/customers/customer-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Card, EmptyState, Input, PageHeader } from "@/components/shared/ui";
import { formatCurrency, getCustomerOutstandingTotal } from "@/lib/calculations";

export default function CustomersPage() {
  const { currentWorkspace, saveCustomer, workspaceData } = useBusinessOS();
  const [search, setSearch] = useState("");
  const currency = currentWorkspace?.currency || "USD";

  const filteredCustomers = workspaceData.customers.filter((customer) =>
    [customer.name, customer.email, customer.phone, customer.notes]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Customers"
        title="Customers, balances, and history."
        description="Keep contact details, notes, invoice history, and payment balances in one place."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Add customer</p>
          <CustomerForm onSubmit={(value) => saveCustomer(value)} />
        </Card>

        <Card>
          <p className="eyebrow">Search customers</p>
          <Input
            label="Search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, or notes"
            value={search}
          />
          {filteredCustomers.length ? (
            filteredCustomers.map((customer) => (
              <div className="list-row" key={customer.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/customers/${customer.id}`}>
                      <strong>{customer.name}</strong>
                    </Link>
                    <p>{customer.email || customer.phone || "No contact set"}</p>
                  </div>
                  <strong>
                    {formatCurrency(
                      getCustomerOutstandingTotal(
                        customer.id,
                        workspaceData.invoices,
                        workspaceData.payments
                      ),
                      currency
                    )}
                  </strong>
                </div>
                <p>{customer.notes || "No notes yet."}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Use the form on the left to create your first customer record."
              title="No customers match"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
