"use client";

import { useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/shared/ui";
import { formatCurrency, formatDate } from "@/lib/calculations";

export default function CashFlowPage() {
  const { currentWorkspace, saveCashEntry, workspaceData } = useBusinessOS();
  const currency = currentWorkspace?.currency || "USD";
  const [form, setForm] = useState({
    type: "cash_in",
    category: "",
    amount: 0,
    entryDate: new Date().toISOString().slice(0, 10),
    notes: ""
  });
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = saveCashEntry({
      ...form,
      type: form.type as "cash_in" | "cash_out",
      amount: Number(form.amount)
    });
    setMessage(result.message);

    if (result.success) {
      setForm({
        type: "cash_in",
        category: "",
        amount: 0,
        entryDate: new Date().toISOString().slice(0, 10),
        notes: ""
      });
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Cash in / cash out"
        title="See lightweight money movement."
        description="Track basic inflows and outflows without turning the app into a full accounting ledger."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">New cash record</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            {message ? <div className="notice">{message}</div> : null}
            <div className="form-grid">
              <Select
                label="Type"
                onChange={(event) => updateField("type", event.target.value)}
                value={form.type}
              >
                <option value="cash_in">Cash in</option>
                <option value="cash_out">Cash out</option>
              </Select>
              <Input
                label="Category"
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="Customer deposit"
                value={form.category}
              />
              <Input
                label="Amount"
                min="0"
                onChange={(event) => updateField("amount", Number(event.target.value))}
                step="0.01"
                type="number"
                value={form.amount}
              />
              <Input
                label="Date"
                onChange={(event) => updateField("entryDate", event.target.value)}
                type="date"
                value={form.entryDate}
              />
            </div>
            <Textarea
              label="Notes"
              onChange={(event) => updateField("notes", event.target.value)}
              value={form.notes}
            />
            <div className="form-actions">
              <Button type="submit">Save cash record</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Cash movement history</p>
          {workspaceData.cashEntries.length ? (
            workspaceData.cashEntries.map((entry) => (
              <div className="list-row" key={entry.id}>
                <div className="list-title">
                  <div>
                    <strong>{entry.category}</strong>
                    <p>{formatDate(entry.entryDate)}</p>
                  </div>
                  <strong className={entry.type === "cash_in" ? "success-text" : "danger-text"}>
                    {entry.type === "cash_in" ? "+" : "-"}
                    {formatCurrency(entry.amount, currency)}
                  </strong>
                </div>
                <p>{entry.notes || "No notes"}</p>
              </div>
            ))
          ) : (
            <EmptyState
              description="Cash records will appear here as soon as you log money in or out."
              title="No cash movements yet"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
