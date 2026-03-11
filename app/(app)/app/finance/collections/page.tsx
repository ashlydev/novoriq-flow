"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import {
  Button,
  Card,
  EmptyState,
  Input,
  MetricCard,
  PageHeader,
  Select,
  StatusBadge,
  Textarea
} from "@/components/shared/ui";
import { formatCurrency, formatDate, getInvoiceOutstanding, getInvoiceStatus } from "@/lib/calculations";

type StatusFilter = "all" | "draft" | "sent" | "viewed" | "paid" | "expired" | "cancelled";

export default function FinanceCollectionsPage() {
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    createPaymentRequest,
    getEffectivePaymentRequestStatus,
    paymentRequests,
    sendPaymentRequestReminder
  } = useFlowV5();
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const unpaidInvoices = workspaceData.invoices.filter(
    (invoice) => getInvoiceOutstanding(invoice, workspaceData.payments) > 0
  );
  const [form, setForm] = useState({
    invoiceId: unpaidInvoices[0]?.id || "",
    amountRequested: unpaidInvoices[0]
      ? getInvoiceOutstanding(unpaidInvoices[0], workspaceData.payments)
      : 0,
    expiresOn: "",
    message: ""
  });

  if (!canAccess("view_finance")) {
    return (
      <AccessDeniedState description="Collection tools are limited to roles with finance visibility." />
    );
  }

  const currency = currentWorkspace?.currency || "USD";
  const filteredRequests = useMemo(
    () =>
      paymentRequests.filter((request) => {
        const status = getEffectivePaymentRequestStatus(request);
        return statusFilter === "all" ? true : status === statusFilter;
      }),
    [getEffectivePaymentRequestStatus, paymentRequests, statusFilter]
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Collections"
        title="Create simple payment requests and keep collections moving."
        description="Generate shareable payment references, log reminders, and connect requests back to invoice payments."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Requests" value={String(paymentRequests.length)} />
        <MetricCard
          label="Open"
          tone={paymentRequests.filter((request) => ["draft", "sent", "viewed"].includes(getEffectivePaymentRequestStatus(request))).length ? "warning" : "success"}
          value={String(paymentRequests.filter((request) => ["draft", "sent", "viewed"].includes(getEffectivePaymentRequestStatus(request))).length)}
        />
        <MetricCard
          label="Paid"
          tone="success"
          value={String(paymentRequests.filter((request) => getEffectivePaymentRequestStatus(request) === "paid").length)}
        />
        <MetricCard
          label="Expiring / expired"
          tone="warning"
          value={String(paymentRequests.filter((request) => ["expired"].includes(getEffectivePaymentRequestStatus(request))).length)}
        />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create payment request</p>
          {canAccess("manage_payment_requests") ? (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(
                  createPaymentRequest(form.invoiceId, {
                    amountRequested: form.amountRequested,
                    expiresOn: form.expiresOn || undefined,
                    message: form.message
                  }).message
                );
              }}
            >
              <Select
                label="Invoice"
                onChange={(event) => {
                  const invoice = unpaidInvoices.find((entry) => entry.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    invoiceId: event.target.value,
                    amountRequested: invoice
                      ? getInvoiceOutstanding(invoice, workspaceData.payments)
                      : current.amountRequested
                  }));
                }}
                value={form.invoiceId}
              >
                <option value="">Select invoice</option>
                {unpaidInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.reference}
                  </option>
                ))}
              </Select>
              <Input
                label="Amount requested"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amountRequested: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(form.amountRequested)}
              />
              <Input
                label="Expiry date"
                onChange={(event) =>
                  setForm((current) => ({ ...current, expiresOn: event.target.value }))
                }
                type="date"
                value={form.expiresOn}
              />
              <Textarea
                label="Message"
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                value={form.message}
              />
              <div className="form-actions">
                <Button type="submit">Create request</Button>
              </div>
            </form>
          ) : (
            <EmptyState
              description="Only roles with collection access can create payment requests."
              title="Payment requests restricted"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Payment request history</p>
          <Select
            label="Status"
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {filteredRequests.length ? (
            filteredRequests.map((request) => {
              const invoice = workspaceData.invoices.find((entry) => entry.id === request.invoiceId);
              const customer = workspaceData.customers.find(
                (entry) => entry.id === invoice?.customerId
              );
              const status = getEffectivePaymentRequestStatus(request);

              return (
                <div className="list-row" key={request.id}>
                  <div className="list-title">
                    <div>
                      <Link href={`/app/finance/collections/${request.id}`}>
                        <strong>{request.reference}</strong>
                      </Link>
                      <p>{invoice?.reference} · {customer?.name || "Customer"}</p>
                    </div>
                    <StatusBadge
                      label={status}
                      tone={
                        status === "paid"
                          ? "success"
                          : status === "expired"
                            ? "danger"
                            : status === "viewed"
                              ? "warning"
                              : "muted"
                      }
                    />
                  </div>
                  <div className="stats-inline">
                    <div className="info-pair">
                      <span>Amount</span>
                      <strong>{formatCurrency(request.amountRequested, currency)}</strong>
                    </div>
                    <div className="info-pair">
                      <span>Created</span>
                      <strong>{formatDate(request.createdAt)}</strong>
                    </div>
                  </div>
                  {status !== "paid" && canAccess("manage_payment_requests") ? (
                    <div className="form-actions">
                      <Button
                        kind="secondary"
                        onClick={() => setMessage(sendPaymentRequestReminder(request.id).message)}
                        type="button"
                      >
                        Log reminder
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Create a request or adjust the filters to see more collection activity."
              title="No payment requests match"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Invoices ready for collection</p>
        {unpaidInvoices.length ? (
          unpaidInvoices.map((invoice) => {
            const customer = workspaceData.customers.find((entry) => entry.id === invoice.customerId);
            const status = getInvoiceStatus(invoice, workspaceData.payments);
            return (
              <div className="list-row" key={invoice.id}>
                <div className="list-title">
                  <div>
                    <Link href={`/app/invoices/${invoice.id}`}>
                      <strong>{invoice.reference}</strong>
                    </Link>
                    <p>{customer?.name || "Customer"}</p>
                  </div>
                  <StatusBadge
                    label={status}
                    tone={status === "overdue" ? "danger" : status === "partial" ? "warning" : "muted"}
                  />
                </div>
                <strong>{formatCurrency(getInvoiceOutstanding(invoice, workspaceData.payments), currency)}</strong>
              </div>
            );
          })
        ) : (
          <EmptyState
            description="Outstanding invoices will appear here when collection action is needed."
            title="No open invoices"
          />
        )}
      </Card>
    </div>
  );
}
