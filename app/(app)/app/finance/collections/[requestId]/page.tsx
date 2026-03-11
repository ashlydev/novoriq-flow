"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/calculations";

export default function CollectionRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const { canAccess, currentWorkspace, workspaceData } = useBusinessOS();
  const {
    getEffectivePaymentRequestStatus,
    getPaymentRequest,
    linkPaymentRequestToPayment,
    markPaymentRequestViewed,
    sendPaymentRequestReminder
  } = useFlowV5();
  const request = getPaymentRequest(params.requestId);

  if (!canAccess("view_finance")) {
    return (
      <AccessDeniedState description="Collection request detail is limited to roles with finance visibility." />
    );
  }

  if (!request) {
    return (
      <EmptyState
        action={<Link className="button button-primary" href="/app/finance/collections">Back to collections</Link>}
        description="The payment request could not be found."
        title="Payment request not found"
      />
    );
  }

  const invoice = workspaceData.invoices.find((entry) => entry.id === request.invoiceId);
  const customer = workspaceData.customers.find((entry) => entry.id === invoice?.customerId);
  const payments = workspaceData.payments.filter((entry) => entry.invoiceId === request.invoiceId);
  const currency = currentWorkspace?.currency || "USD";
  const status = getEffectivePaymentRequestStatus(request);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Collection request"
        title={request.reference}
        description={`Share-ready request for ${invoice?.reference || "invoice"}${customer ? ` · ${customer.name}` : ""}.`}
        action={
          <div className="button-row">
            <Button
              kind="secondary"
              onClick={() => markPaymentRequestViewed(request.id)}
              type="button"
            >
              Mark viewed
            </Button>
            <Button
              kind="secondary"
              onClick={() => sendPaymentRequestReminder(request.id)}
              type="button"
            >
              Log reminder
            </Button>
          </div>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Request summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
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
              </strong>
            </div>
            <div className="info-pair">
              <span>Amount</span>
              <strong>{formatCurrency(request.amountRequested, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Share code</span>
              <strong>{request.shareCode}</strong>
            </div>
            <div className="info-pair">
              <span>Share path</span>
              <strong>{request.shareUrl}</strong>
            </div>
            <div className="info-pair">
              <span>Expires</span>
              <strong>{request.expiresOn ? formatDate(request.expiresOn) : "No expiry"}</strong>
            </div>
          </div>
          <p style={{ marginTop: 16 }}>{request.message || "No collection message was added."}</p>
        </Card>

        <Card>
          <p className="eyebrow">Invoice context</p>
          {invoice ? (
            <div className="kpi-stack">
              <div className="info-pair">
                <span>Invoice</span>
                <strong>{invoice.reference}</strong>
              </div>
              <div className="info-pair">
                <span>Customer</span>
                <strong>{customer?.name || "Unknown customer"}</strong>
              </div>
              <div className="info-pair">
                <span>Due date</span>
                <strong>{formatDate(invoice.dueDate)}</strong>
              </div>
            </div>
          ) : (
            <EmptyState description="Source invoice missing." title="Invoice unavailable" />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Recorded payments</p>
        {payments.length ? (
          payments.map((payment) => (
            <div className="list-row" key={payment.id}>
              <div className="list-title">
                <div>
                  <strong>{formatCurrency(payment.amount, currency)}</strong>
                  <p>{payment.reference || payment.method}</p>
                </div>
                {request.linkedPaymentId === payment.id ? (
                  <StatusBadge label="linked" tone="success" />
                ) : (
                  <Button
                    kind="secondary"
                    onClick={() => linkPaymentRequestToPayment(request.id, payment.id)}
                    type="button"
                  >
                    Link payment
                  </Button>
                )}
              </div>
              <p>{formatDate(payment.paymentDate)}</p>
            </div>
          ))
        ) : (
          <EmptyState
            description="Once a payment is recorded on the invoice, link it back here to complete the collection trail."
            title="No payments recorded yet"
          />
        )}
      </Card>

      <Card>
        <p className="eyebrow">Request history</p>
        {request.history.map((entry) => (
          <div className="list-row" key={entry.id}>
            <div className="list-title">
              <strong>{entry.action.replace("_", " ")}</strong>
              <span>{formatDateTime(entry.createdAt)}</span>
            </div>
            <p>{entry.note || "No extra note."}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
