"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { Card, EmptyState, PageHeader } from "@/components/shared/ui";
import { formatCurrency, formatDate } from "@/lib/calculations";

export default function ExpenseDetailPage() {
  const params = useParams<{ expenseId: string }>();
  const router = useRouter();
  const {
    archiveExpense,
    currentWorkspace,
    saveExpense,
    workspaceData
  } = useBusinessOS();
  const { branches, getRecordBranchId, getRecordProjectId, projects } = useFlowV3();
  const currency = currentWorkspace?.currency || "USD";

  const expense = workspaceData.expenses.find((record) => record.id === params.expenseId);
  const supplier = workspaceData.suppliers.find((record) => record.id === expense?.supplierId);
  const branch = branches.find((record) => record.id === getRecordBranchId("expense", params.expenseId));
  const project = projects.find((record) => record.id === getRecordProjectId("expense", params.expenseId));

  if (!expense) {
    return (
      <EmptyState
        action={
          <Link className="button button-primary" href="/app/expenses">
            Back to expenses
          </Link>
        }
        description="The expense does not exist in this workspace."
        title="Expense not found"
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Expense detail"
        title={expense.description}
        description="Review or adjust the recorded operating cost."
        action={
          <button
            className="button button-danger"
            onClick={() => {
              archiveExpense(expense.id);
              router.push("/app/expenses");
            }}
            type="button"
          >
            Archive
          </button>
        }
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Edit expense</p>
          <ExpenseForm
            initialValue={expense}
            onSubmit={(value) => saveExpense(value, expense.id)}
            submitLabel="Update expense"
            suppliers={workspaceData.suppliers}
          />
        </Card>

        <Card>
          <p className="eyebrow">Expense summary</p>
          <div className="kpi-stack">
            <div className="info-pair">
              <span>Amount</span>
              <strong>{formatCurrency(expense.amount, currency)}</strong>
            </div>
            <div className="info-pair">
              <span>Date</span>
              <strong>{formatDate(expense.expenseDate)}</strong>
            </div>
            <div className="info-pair">
              <span>Supplier</span>
              <strong>{supplier?.name || "Not linked"}</strong>
            </div>
            <div className="info-pair">
              <span>Branch</span>
              <strong>{branch?.name || "Main branch"}</strong>
            </div>
            <div className="info-pair">
              <span>Project</span>
              <strong>{project?.name || "Not linked"}</strong>
            </div>
            <div className="info-pair">
              <span>Attachment</span>
              <strong>{expense.attachmentName || "Not attached"}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
