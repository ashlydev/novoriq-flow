"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentForm } from "@/components/invoices/payment-form";
import { DocumentForm } from "@/components/shared/document-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  StatusBadge,
  Textarea
} from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getDocumentSummaryForRecord,
  getInvoiceOutstanding,
  getInvoicePayments,
  getInvoiceStatus,
  getPaidAmount
} from "@/lib/calculations";

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const [financeMessage, setFinanceMessage] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [requestForm, setRequestForm] = useState({
    amountRequested: 0,
    expiresOn: "",
    message: ""
  });
  const {
    currentWorkspace,
    recordPayment,
    saveInvoice,
    workspaceData
  } = useBusinessOS();
  const { branches, getRecordBranchId, getRecordProjectId, projects, templateSettings } =
    useFlowV3();
  const {
    createPaymentRequest,
    getInvoiceReconciliationStatus,
    getPaymentRequestsForInvoice,
    getReconciliationForPayment,
    eligibleInvoices,
    getEffectivePaymentRequestStatus
  } = useFlowV5();
  const { generateDraft, getDraftsForEntity } = useFlowV7();

  const invoice = workspaceData.invoices.find((record) => record.id === params.invoiceId);
  const customer = workspaceData.customers.find(
    (record) => record.id === invoice?.customerId
  );
  const branch = branches.find((record) => record.id === getRecordBranchId("invoice", params.invoiceId));
  const project = projects.find((record) => record.id === getRecordProjectId("invoice", params.invoiceId));
  const currency = currentWorkspace?.currency || "USD";

  if (!invoice) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/invoices">
            Back to invoices
          </Link>
        }
        description="The invoice does not exist in this workspace."
        title="Invoice not found"
      />
    );
  }

  const summary = getDocumentSummaryForRecord(invoice);
  const paidAmount = getPaidAmount(workspaceData.payments, invoice.id);
  const outstanding = getInvoiceOutstanding(invoice, workspaceData.payments);
  const status = getInvoiceStatus(invoice, workspaceData.payments);
  const payments = getInvoicePayments(workspaceData.payments, invoice.id);
  const receipts = workspaceData.receipts.filter((receipt) => receipt.invoiceId === invoice.id);
  const paymentRequests = getPaymentRequestsForInvoice(invoice.id);
  const reconciliationStatus = getInvoiceReconciliationStatus(invoice.id);
  const candidate = eligibleInvoices.find((entry) => entry.invoiceId === invoice.id);
  const drafts = getDraftsForEntity("invoice", invoice.id);

  useEffect(() => {
    if (outstanding > 0) {
      setRequestForm((current) =>
        current.amountRequested
          ? current
          : { ...current, amountRequested: outstanding }
      );
    }
  }, [outstanding]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Invoice detail"
        title={invoice.reference}
        description={`Issued to ${customer?.name || "Unknown customer"}.`}
        action={
          <button className="button button-secondary" onClick={() => window.print()} type="button">
            Print invoice
          </button>
        }
      />

      {financeMessage ? <div className="notice">{financeMessage}</div> : null}
      {draftMessage ? <div className="notice">{draftMessage}</div> : null}

      <div className="two-col">
        <Card>
          <p className="eyebrow">Invoice summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={status}
                  tone={
                    status === "paid"
                      ? "success"
                      : status === "overdue"
                        ? "danger"
                        : status === "partial"
                          ? "warning"
                          : "muted"
                  }
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Total</span>
              <strong>{formatCurrency(summary.total, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Paid</span>
              <strong>{formatCurrency(paidAmount, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Outstanding</span>
              <strong>{formatCurrency(outstanding, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Issue date</span>
              <strong>{formatDate(invoice.issueDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Due date</span>
              <strong>{formatDate(invoice.dueDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Reconciliation</span>
              <strong>
                <StatusBadge
                  label={reconciliationStatus.replace("_", " ")}
                  tone={
                    reconciliationStatus === "reconciled"
                      ? "success"
                      : reconciliationStatus === "mismatch"
                        ? "danger"
                        : reconciliationStatus === "partial"
                          ? "warning"
                          : "muted"
                  }
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Financing view</span>
              <strong>{candidate?.readinessLabel || "Not reviewed"}</strong>
            </div>
            <div className="info-pair">
              <span>Template</span>
              <strong>{templateSettings.invoiceStyle}</strong>
            </div>
            <div className="info-pair">
              <span>Branch</span>
              <strong>{branch?.name || "Main branch"}</strong>
            </div>
            <div className="info-pair">
              <span>Project</span>
              <strong>{project?.name || "Not linked"}</strong>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Payments & receipts</p>
          {payments.length ? (
            payments.map((payment) => {
              const receipt = receipts.find((record) => record.paymentId === payment.id);
              return (
                <div className="list-row" key={payment.id}>
                  <div className="list-title">
                    <strong>{formatCurrency(payment.amount, currency)}</strong>
                    <span>{formatDate(payment.paymentDate)}</span>
                  </div>
                  <p>{payment.method.replace("_", " ")}</p>
                  <StatusBadge
                    label={getReconciliationForPayment(payment.id)?.status || "unreconciled"}
                    tone={
                      getReconciliationForPayment(payment.id)?.status === "reconciled"
                        ? "success"
                        : getReconciliationForPayment(payment.id)?.status === "mismatch"
                          ? "danger"
                          : getReconciliationForPayment(payment.id)?.status === "partial"
                            ? "warning"
                            : "muted"
                    }
                  />
                  {receipt ? (
                    <Link className="text-button" href={`/app/receipts/${receipt.id}`}>
                      Open {receipt.reference}
                    </Link>
                  ) : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Payments recorded against this invoice will generate receipts automatically."
              title="No payments yet"
            />
          )}
        </Card>
      </div>

      <Card>
        <p className="eyebrow">AI-assisted drafts</p>
        <div className="button-row" style={{ marginBottom: 16 }}>
          <Button
            kind="secondary"
            onClick={() =>
              setDraftMessage(
                generateDraft({
                  kind: "overdue_payment_reminder",
                  relatedEntityType: "invoice",
                  relatedEntityId: invoice.id
                }).message
              )
            }
            type="button"
          >
            Generate overdue reminder
          </Button>
          <Button
            kind="secondary"
            onClick={() =>
              setDraftMessage(
                generateDraft({
                  kind: "invoice_cover_note",
                  relatedEntityType: "invoice",
                  relatedEntityId: invoice.id
                }).message
              )
            }
            type="button"
          >
            Generate cover note
          </Button>
        </div>
        {drafts.length ? (
          drafts.slice(0, 3).map((draft) => (
            <div className="list-row" key={draft.id}>
              <div className="list-title">
                <strong>{draft.title}</strong>
                <span>{formatDate(draft.updatedAt)}</span>
              </div>
              <p>{draft.content}</p>
            </div>
          ))
        ) : (
          <p>No drafts have been generated for this invoice yet.</p>
        )}
      </Card>

      {outstanding > 0 ? (
        <div className="two-col">
          <Card>
            <p className="eyebrow">Record payment</p>
            <PaymentForm
              maxAmount={outstanding}
              onSubmit={(value) => recordPayment(invoice.id, value)}
            />
          </Card>

          <Card>
            <p className="eyebrow">Collection tools</p>
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                setFinanceMessage(
                  createPaymentRequest(invoice.id, {
                    amountRequested: requestForm.amountRequested,
                    expiresOn: requestForm.expiresOn || undefined,
                    message: requestForm.message
                  }).message
                );
              }}
            >
              <Input
                label="Amount requested"
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    amountRequested: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(requestForm.amountRequested)}
              />
              <Input
                label="Expiry date"
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, expiresOn: event.target.value }))
                }
                type="date"
                value={requestForm.expiresOn}
              />
              <Textarea
                label="Collection message"
                onChange={(event) =>
                  setRequestForm((current) => ({ ...current, message: event.target.value }))
                }
                value={requestForm.message}
              />
              <div className="form-actions">
                <Button type="submit">Create payment request</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <Card>
        <p className="eyebrow">Payment request history</p>
        {paymentRequests.length ? (
          paymentRequests.map((request) => (
            <div className="list-row" key={request.id}>
              <div className="list-title">
                <div>
                  <Link href={`/app/finance/collections/${request.id}`}>
                    <strong>{request.reference}</strong>
                  </Link>
                  <p>{request.shareCode}</p>
                </div>
                <StatusBadge
                  label={getEffectivePaymentRequestStatus(request)}
                  tone={
                    getEffectivePaymentRequestStatus(request) === "paid"
                      ? "success"
                      : getEffectivePaymentRequestStatus(request) === "expired"
                        ? "danger"
                        : getEffectivePaymentRequestStatus(request) === "viewed"
                          ? "warning"
                          : "muted"
                  }
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            description="Create a payment request to make collection follow-up easier from this invoice."
            title="No collection requests yet"
          />
        )}
      </Card>

      <Card>
        <p className="eyebrow">Edit invoice</p>
        {templateSettings.footerNote ? <p>{templateSettings.footerNote}</p> : null}
        <DocumentForm
          currency={currency}
          customers={workspaceData.customers}
          initialValue={{
            customerId: invoice.customerId,
            issueDate: invoice.issueDate,
            secondaryDate: invoice.dueDate,
            status: invoice.status,
            lineItems: invoice.lineItems,
            discountAmount: invoice.discountAmount,
            taxRate: invoice.taxRate,
            notes: invoice.notes
          }}
          items={workspaceData.items}
          mode="invoice"
          onSubmit={(value) => {
            if (!("dueDate" in value)) {
              return { success: false, message: "Invalid invoice payload." };
            }
            return saveInvoice(
              {
                ...value,
                linkedQuoteId: invoice.linkedQuoteId
              },
              invoice.id
            );
          }}
          submitLabel="Update invoice"
        />
      </Card>
    </div>
  );
}
