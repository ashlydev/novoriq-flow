"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/shared/document-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Card, EmptyState, PageHeader } from "@/components/shared/ui";

export default function NewInvoicePage() {
  const router = useRouter();
  const { currentWorkspace, saveInvoice, workspaceData } = useBusinessOS();

  if (!workspaceData.customers.length) {
    return (
      <EmptyState
        action={
          <button className="button button-primary" onClick={() => router.push("/app/customers")} type="button">
            Create customer first
          </button>
        }
        description="Invoices need a customer. Add one first, then create the invoice."
        title="No customers available"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="New invoice"
        title="Create an invoice."
        description="Line items, due date, notes, and totals stay in one trustworthy flow."
      />
      <Card>
        <DocumentForm
          currency={currentWorkspace?.currency || "USD"}
          customers={workspaceData.customers}
          items={workspaceData.items}
          mode="invoice"
          onSubmit={(value) => {
            if (!("dueDate" in value)) {
              return { success: false, message: "Invalid invoice payload." };
            }
            const result = saveInvoice(value);
            if (result.success && result.id) {
              router.push(`/app/invoices/${result.id}`);
            }
            return result;
          }}
          submitLabel="Save invoice"
        />
      </Card>
    </div>
  );
}
