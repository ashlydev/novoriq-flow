"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/shared/document-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Card, EmptyState, PageHeader } from "@/components/shared/ui";

export default function NewQuotePage() {
  const router = useRouter();
  const { currentWorkspace, saveQuote, workspaceData } = useBusinessOS();

  if (!workspaceData.customers.length) {
    return (
      <EmptyState
        action={
          <button className="button button-primary" onClick={() => router.push("/app/customers")} type="button">
            Create customer first
          </button>
        }
        description="Quotes need a customer. Add one first, then come back here."
        title="No customers available"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="New quote"
        title="Create a quote."
        description="Keep it fast on mobile: customer, line items, dates, and totals in one screen."
      />
      <Card>
        <DocumentForm
          currency={currentWorkspace?.currency || "USD"}
          customers={workspaceData.customers}
          items={workspaceData.items}
          mode="quote"
          onSubmit={(value) => {
            if (!("expiryDate" in value)) {
              return { success: false, message: "Invalid quote payload." };
            }
            const result = saveQuote(value);
            if (result.success && result.id) {
              router.push(`/app/quotes/${result.id}`);
            }
            return result;
          }}
          submitLabel="Save quote"
        />
      </Card>
    </div>
  );
}
