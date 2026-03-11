"use client";

import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/shared/ui";
import { Expense, Supplier } from "@/lib/types";

interface ExpenseFormValue {
  supplierId?: string;
  category: Expense["category"];
  amount: number;
  expenseDate: string;
  description: string;
  notes?: string;
  attachmentName?: string;
}

export function ExpenseForm({
  suppliers,
  initialValue,
  submitLabel = "Save expense",
  onSubmit
}: {
  suppliers: Supplier[];
  initialValue?: ExpenseFormValue;
  submitLabel?: string;
  onSubmit: (
    value: ExpenseFormValue
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<ExpenseFormValue>({
    supplierId: initialValue?.supplierId || "",
    category: initialValue?.category || "operations",
    amount: initialValue?.amount || 0,
    expenseDate: initialValue?.expenseDate || new Date().toISOString().slice(0, 10),
    description: initialValue?.description || "",
    notes: initialValue?.notes || "",
    attachmentName: initialValue?.attachmentName || ""
  });
  const [message, setMessage] = useState("");

  function updateField(
    field: keyof ExpenseFormValue,
    value: string | number | undefined
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSubmit({
      ...form,
      amount: Number(form.amount),
      supplierId: form.supplierId || undefined
    });
    setMessage(result.message);

    if (result.success && !initialValue) {
      setForm({
        supplierId: "",
        category: "operations",
        amount: 0,
        expenseDate: new Date().toISOString().slice(0, 10),
        description: "",
        notes: "",
        attachmentName: ""
      });
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        <Select
          label="Supplier"
          onChange={(event) => updateField("supplierId", event.target.value)}
          value={form.supplierId}
        >
          <option value="">No supplier linked</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </Select>
        <Select
          label="Category"
          onChange={(event) =>
            updateField("category", event.target.value as ExpenseFormValue["category"])
          }
          value={form.category}
        >
          <option value="operations">Operations</option>
          <option value="rent">Rent</option>
          <option value="transport">Transport</option>
          <option value="utilities">Utilities</option>
          <option value="subscriptions">Subscriptions</option>
          <option value="supplies">Supplies</option>
          <option value="marketing">Marketing</option>
          <option value="salaries">Salaries</option>
          <option value="misc">Miscellaneous</option>
        </Select>
        <Input
          label="Amount"
          min="0"
          onChange={(event) => updateField("amount", Number(event.target.value))}
          step="0.01"
          type="number"
          value={form.amount}
        />
        <Input
          label="Expense date"
          onChange={(event) => updateField("expenseDate", event.target.value)}
          type="date"
          value={form.expenseDate}
        />
        <Input
          label="Attachment name"
          onChange={(event) => updateField("attachmentName", event.target.value)}
          placeholder="receipt-march.jpg"
          value={form.attachmentName}
        />
        <Input
          label="Description"
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Business internet bill"
          value={form.description}
        />
      </div>
      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Anything you want remembered later."
        value={form.notes}
      />
      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
