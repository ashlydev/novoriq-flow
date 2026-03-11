"use client";

import { useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/shared/ui";
import { Payment } from "@/lib/types";

interface PaymentFormValue {
  amount: number;
  paymentDate: string;
  method: Payment["method"];
  reference?: string;
  notes?: string;
}

export function PaymentForm({
  maxAmount,
  amountLabel = "Amount received",
  submitLabel = "Record payment",
  onSubmit
}: {
  maxAmount: number;
  amountLabel?: string;
  submitLabel?: string;
  onSubmit: (
    value: PaymentFormValue
  ) => { success: boolean; message: string; receiptId?: string };
}) {
  const [form, setForm] = useState<PaymentFormValue>({
    amount: maxAmount,
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    reference: "",
    notes: ""
  });
  const [message, setMessage] = useState("");

  function updateField(
    field: keyof PaymentFormValue,
    value: string | number | Payment["method"]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSubmit({
      ...form,
      amount: Number(form.amount)
    });
    setMessage(result.message);
    if (result.success) {
      setForm((current) => ({
        ...current,
        amount: 0,
        reference: "",
        notes: ""
      }));
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        <Input
          label={amountLabel}
          max={maxAmount}
          min="0"
          onChange={(event) => updateField("amount", Number(event.target.value))}
          step="0.01"
          type="number"
          value={form.amount}
        />
        <Input
          label="Payment date"
          onChange={(event) => updateField("paymentDate", event.target.value)}
          type="date"
          value={form.paymentDate}
        />
        <Select
          label="Method"
          onChange={(event) =>
            updateField("method", event.target.value as Payment["method"])
          }
          value={form.method}
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="mobile_money">Mobile money</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </Select>
        <Input
          label="Reference"
          onChange={(event) => updateField("reference", event.target.value)}
          placeholder="TRX-9981"
          value={form.reference}
        />
      </div>
      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Partial settlement for launch work."
        value={form.notes}
      />
      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
