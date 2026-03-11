"use client";

import Link from "next/link";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Card, EmptyState, PageHeader } from "@/components/shared/ui";
import { formatCurrency, formatDate } from "@/lib/calculations";

export default function ExpensesPage() {
  const { currentWorkspace, saveExpense, workspaceData } = useBusinessOS();
  const currency = currentWorkspace?.currency || "USD";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Expenses"
        title="Record operating costs fast."
        description="Capture category, amount, supplier, date, and notes without turning this into full accounting."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Add expense</p>
          <ExpenseForm suppliers={workspaceData.suppliers} onSubmit={(value) => saveExpense(value)} />
        </Card>

        <Card>
          <p className="eyebrow">Expense list</p>
          {workspaceData.expenses.length ? (
            workspaceData.expenses.map((expense) => {
              const supplier = workspaceData.suppliers.find(
                (record) => record.id === expense.supplierId
              );
              return (
                <div className="list-row" key={expense.id}>
                  <div className="list-title">
                    <div>
                      <Link href={`/app/expenses/${expense.id}`}>
                        <strong>{expense.description}</strong>
                      </Link>
                      <p>{supplier?.name || expense.category}</p>
                    </div>
                    <strong>{formatCurrency(expense.amount, currency)}</strong>
                  </div>
                  <p>{formatDate(expense.expenseDate)}</p>
                </div>
              );
            })
          ) : (
            <EmptyState
              description="Your recorded operating costs will appear here and feed profit snapshots."
              title="No expenses yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
