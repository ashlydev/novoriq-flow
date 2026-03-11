"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/shared/ui";
import { formatCurrency, formatDate, getSupplierSpendTotal } from "@/lib/calculations";

export default function SupplierDetailPage() {
  const params = useParams<{ supplierId: string }>();
  const router = useRouter();
  const {
    archiveSupplier,
    currentWorkspace,
    saveSupplier,
    workspaceData
  } = useBusinessOS();
  const { getBusinessProfile, getSupplierLinkForSupplier } = useFlowV4();
  const { supplierCreditTerms, supplierCreditSummary } = useFlowV5();

  const supplier = workspaceData.suppliers.find(
    (record) => record.id === params.supplierId
  );
  const supplierExpenses = workspaceData.expenses.filter(
    (expense) => expense.supplierId === supplier?.id
  );
  const linkedBusiness = supplier
    ? getBusinessProfile(getSupplierLinkForSupplier(supplier.id)?.businessProfileId || "")
    : undefined;
  const creditTerm = supplier
    ? supplierCreditTerms.find((entry) => entry.supplierId === supplier.id)
    : undefined;
  const creditRow = supplierCreditSummary.rows.find((entry) => entry.term.supplierId === supplier?.id);
  const currency = currentWorkspace?.currency || "USD";

  if (!supplier) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/suppliers">
            Back to suppliers
          </Link>
        }
        description="The supplier may have been archived or does not exist in this workspace."
        title="Supplier not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Supplier detail"
        title={supplier.name}
        description="Keep supplier contacts tidy and understand the spend linked to each vendor."
        action={
          <button
            className="button button-danger"
            onClick={() => {
              archiveSupplier(supplier.id);
              router.push("/app/suppliers");
            }}
            type="button"
          >
            Archive
          </button>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Edit supplier</p>
          <SupplierForm
            initialValue={supplier}
            onSubmit={(value) => saveSupplier(value, supplier.id)}
            submitLabel="Update supplier"
          />
        </Card>

        <Card>
          <p className="eyebrow">Spend summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Total spend</span>
              <strong>
                {formatCurrency(
                  getSupplierSpendTotal(supplier.id, workspaceData.expenses),
                  currency
                )}
              </strong>
            </div>
            <div className="info-pair">
              <span>Expenses linked</span>
              <strong>{supplierExpenses.length}</strong>
            </div>
            <div className="info-pair">
              <span>Email</span>
              <strong>{supplier.email || "Not set"}</strong>
            </div>
            <div className="info-pair">
              <span>Phone</span>
              <strong>{supplier.phone || "Not set"}</strong>
            </div>
          </div>
        </Card>
      </div>

      {linkedBusiness ? (
        <Card>
          <p className="eyebrow">Connected business</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Network business</span>
              <strong>{linkedBusiness.displayName}</strong>
            </div>
            <div className="info-pair">
              <span>City</span>
              <strong>{linkedBusiness.city}</strong>
            </div>
            <div className="info-pair">
              <span>Visibility</span>
              <strong>{linkedBusiness.visibility}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href={`/app/network/businesses/${linkedBusiness.id}`}>
              Open network profile
            </Link>
          </div>
        </Card>
      ) : null}

      {creditTerm ? (
        <Card>
          <p className="eyebrow">Supplier credit view</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Credit days</span>
              <strong>{creditTerm.creditDays}</strong>
            </div>
            <div className="info-pair">
              <span>Reminder days</span>
              <strong>{creditTerm.reminderDays}</strong>
            </div>
            <div className="info-pair">
              <span>Status</span>
              <strong>
                <StatusBadge
                  label={creditTerm.status}
                  tone={
                    creditTerm.status === "healthy"
                      ? "success"
                      : creditTerm.status === "watch"
                        ? "warning"
                        : "danger"
                  }
                />
              </strong>
            </div>
            <div className="info-pair">
              <span>Outstanding obligations</span>
              <strong>{formatCurrency(creditRow?.outstanding || 0, currency)}</strong>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Link className="button button-secondary" href="/app/finance/supplier-credit">
              Open supplier credit
            </Link>
          </div>
        </Card>
      ) : null}

      <Card>
        <p className="eyebrow">Expense history</p>
        {supplierExpenses.length ? (
          supplierExpenses.map((expense) => (
            <div className="list-row" key={expense.id}>
              <div className="list-title">
                <Link href={`/app/expenses/${expense.id}`}>
                  <strong>{expense.description}</strong>
                </Link>
                <strong>{formatCurrency(expense.amount, currency)}</strong>
              </div>
              <p>
                {formatDate(expense.expenseDate)} · {expense.category}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            description="Expenses linked to this supplier will appear here."
            title="No expense history yet"
          />
        )}
      </Card>
    </div>
  );
}
