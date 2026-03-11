"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RecurringInvoiceForm } from "@/components/recurring/recurring-invoice-form";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import {
  Card,
  EmptyState,
  MetricCard,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import {
  calculateDocumentSummary,
  formatCurrency,
  formatDate,
  getRecurringTemplatesDue
} from "@/lib/calculations";

export default function RecurringInvoicesPage() {
  const {
    canAccess,
    currentWorkspace,
    runRecurringInvoice,
    saveRecurringInvoice,
    toggleRecurringInvoice,
    workspaceData
  } = useBusinessOS();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [message, setMessage] = useState("");

  if (!canAccess("manage_recurring")) {
    return (
      <AccessDeniedState description="Recurring invoice setup is available only to manager, admin, and owner roles." />
    );
  }

  if (!workspaceData.customers.length) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/customers">
            Create customer first
          </Link>
        }
        description="Recurring invoices need a customer. Add one first, then set the template."
        title="No customers available"
      />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const selectedTemplate = workspaceData.recurringInvoices.find(
    (record) => record.id === selectedTemplateId
  );
  const dueTemplates = getRecurringTemplatesDue(
    workspaceData.recurringInvoices,
    workspaceData.settings?.dueSoonDays || 7
  );
  const totalActive = workspaceData.recurringInvoices.filter((record) => record.isActive).length;
  const totalGenerated = workspaceData.recurringInvoices.reduce(
    (total, template) => total + template.generatedInvoiceIds.length,
    0
  );
  const activeValue = useMemo(
    () =>
      workspaceData.recurringInvoices
        .filter((record) => record.isActive)
        .reduce(
          (total, template) =>
            total +
            calculateDocumentSummary(
              template.lineItems,
              template.discountAmount,
              template.taxRate
            ).total,
          0
        ),
    [workspaceData.recurringInvoices]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Recurring invoices"
        title="Repeat billing without a subscription engine."
        description="Set up predictable invoice templates, see what runs next, and generate invoices when repeat work is due."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Active templates" value={String(totalActive)} />
        <MetricCard
          hint="Value per scheduled cycle"
          label="Active recurring value"
          value={formatCurrency(activeValue, currency)}
        />
        <MetricCard
          hint="Templates due soon"
          label="Due to run"
          tone="warning"
          value={String(dueTemplates.length)}
        />
        <MetricCard label="Generated invoices" value={String(totalGenerated)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">{selectedTemplate ? "Edit recurring template" : "New recurring template"}</p>
          <RecurringInvoiceForm
            currency={currency}
            customers={workspaceData.customers}
            initialValue={
              selectedTemplate
                ? {
                    customerId: selectedTemplate.customerId,
                    label: selectedTemplate.label,
                    frequency: selectedTemplate.frequency,
                    startDate: selectedTemplate.startDate,
                    nextRunDate: selectedTemplate.nextRunDate,
                    dueInDays: selectedTemplate.dueInDays,
                    isActive: selectedTemplate.isActive,
                    lineItems: selectedTemplate.lineItems,
                    discountAmount: selectedTemplate.discountAmount,
                    taxRate: selectedTemplate.taxRate,
                    notes: selectedTemplate.notes
                  }
                : undefined
            }
            items={workspaceData.items}
            onSubmit={(value) => {
              const result = saveRecurringInvoice(value, selectedTemplate?.id);
              setMessage(result.message);
              if (result.success && !selectedTemplate) {
                setSelectedTemplateId(undefined);
              }
              return result;
            }}
            submitLabel={selectedTemplate ? "Update recurring invoice" : "Save recurring invoice"}
          />
        </Card>

        <Card>
          <p className="eyebrow">Recurring schedule</p>
          {workspaceData.recurringInvoices.length ? (
            workspaceData.recurringInvoices.map((template) => {
              const customer = workspaceData.customers.find(
                (record) => record.id === template.customerId
              );
              const templateTotal = calculateDocumentSummary(
                template.lineItems,
                template.discountAmount,
                template.taxRate
              ).total;

              return (
                <div className="list-row" key={template.id}>
                  <div className="list-title">
                    <div>
                      <strong>{template.label}</strong>
                      <p>{customer?.name || "Unknown customer"}</p>
                    </div>
                    <StatusBadge
                      label={template.isActive ? "active" : "paused"}
                      tone={template.isActive ? "success" : "muted"}
                    />
                  </div>
                  <div className="stats-inline">
                    <div className="info-pair">
                      <span>Frequency</span>
                      <strong>{template.frequency}</strong>
                    </div>
                    <div className="info-pair">
                      <span>Next run</span>
                      <strong>{formatDate(template.nextRunDate)}</strong>
                    </div>
                    <div className="info-pair">
                      <span>Value</span>
                      <strong>{formatCurrency(templateTotal, currency)}</strong>
                    </div>
                  </div>
                  <div className="button-row">
                    <button
                      className="button button-secondary"
                      onClick={() => setSelectedTemplateId(template.id)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => setMessage(runRecurringInvoice(template.id).message)}
                      type="button"
                    >
                      Run now
                    </button>
                    <button
                      className="button button-ghost"
                      onClick={() =>
                        setMessage(
                          toggleRecurringInvoice(template.id, !template.isActive).message
                        )
                      }
                      type="button"
                    >
                      {template.isActive ? "Pause" : "Activate"}
                    </button>
                  </div>
                  <p>{template.generatedInvoiceIds.length} invoices generated so far.</p>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Create the first repeat-billing template to make recurring invoicing reliable."
              title="No recurring templates yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
