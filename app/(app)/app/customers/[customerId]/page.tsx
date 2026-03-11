"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge
} from "@/components/shared/ui";
import {
  formatCurrency,
  formatDate,
  getCustomerOutstandingTotal,
  getInvoiceStatus
} from "@/lib/calculations";

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const {
    archiveCustomer,
    currentWorkspace,
    saveCustomer,
    workspaceData
  } = useBusinessOS();

  const customer = workspaceData.customers.find(
    (record) => record.id === params.customerId
  );
  const customerInvoices = workspaceData.invoices.filter(
    (invoice) => invoice.customerId === customer?.id
  );
  const customerPayments = workspaceData.payments.filter((payment) =>
    customerInvoices.some((invoice) => invoice.id === payment.invoiceId)
  );
  const currency = currentWorkspace?.currency || "USD";

  if (!customer) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/customers">
            Back to customers
          </Link>
        }
        description="The customer may have been archived or does not exist in this workspace."
        title="Customer not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Customer detail"
        title={customer.name}
        description="Edit contact details, review invoice history, and understand what is still unpaid."
        action={
          <div className="button-row">
            <Link className="button button-secondary" href="/app/invoices/new">
              New invoice
            </Link>
            <button
              className="button button-danger"
              onClick={() => {
                archiveCustomer(customer.id);
                router.push("/app/customers");
              }}
              type="button"
            >
              Archive
            </button>
          </div>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Edit customer</p>
          <CustomerForm
            initialValue={customer}
            onSubmit={(value) => saveCustomer(value, customer.id)}
            submitLabel="Update customer"
          />
        </Card>

        <Card>
          <p className="eyebrow">Balance summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Outstanding</span>
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
            <div className="info-pair">
              <span>Total invoices</span>
              <strong>{customerInvoices.length}</strong>
            </div>
            <div className="info-pair">
              <span>Payments recorded</span>
              <strong>{customerPayments.length}</strong>
            </div>
          </div>
          <div className="panel-stack" style={{ marginTop: 16 }}>
            <div className="info-pair">
              <span>Email</span>
              <strong>{customer.email || "Not set"}</strong>
            </div>
            <div className="info-pair">
              <span>Phone</span>
              <strong>{customer.phone || "Not set"}</strong>
            </div>
            <div className="info-pair">
              <span>Address</span>
              <strong>{customer.address || "Not set"}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Invoice history</p>
          {customerInvoices.length ? (
            customerInvoices.map((invoice) => (
              <div className="list-row" key={invoice.id}>
                <div className="list-title">
                  <Link href={`/app/invoices/${invoice.id}`}>
                    <strong>{invoice.reference}</strong>
                  </Link>
                  <StatusBadge
                    label={getInvoiceStatus(invoice, workspaceData.payments)}
                    tone={
                      getInvoiceStatus(invoice, workspaceData.payments) === "paid"
                        ? "success"
                        : getInvoiceStatus(invoice, workspaceData.payments) === "overdue"
                          ? "danger"
                          : "warning"
                    }
                  />
                </div>
                <p>Due {formatDate(invoice.dueDate)}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Create an invoice for this customer to start the history."
              title="No invoices yet"
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Payment history</p>
          {customerPayments.length ? (
            customerPayments.map((payment) => (
              <div className="list-row" key={payment.id}>
                <div className="list-title">
                  <strong>{formatCurrency(payment.amount, currency)}</strong>
                  <span>{formatDate(payment.paymentDate)}</span>
                </div>
                <p>
                  {payment.method.replace("_", " ")} {payment.reference ? `· ${payment.reference}` : ""}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Payments made against the customer’s invoices will appear here."
              title="No payments recorded"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
