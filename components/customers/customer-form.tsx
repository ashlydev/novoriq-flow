"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/shared/ui";

interface CustomerFormValue {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export function CustomerForm({
  initialValue,
  submitLabel = "Save customer",
  onSubmit
}: {
  initialValue?: CustomerFormValue;
  submitLabel?: string;
  onSubmit: (
    value: CustomerFormValue
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<CustomerFormValue>({
    name: initialValue?.name || "",
    email: initialValue?.email || "",
    phone: initialValue?.phone || "",
    address: initialValue?.address || "",
    notes: initialValue?.notes || ""
  });
  const [message, setMessage] = useState("");

  function updateField(field: keyof CustomerFormValue, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSubmit(form);
    setMessage(result.message);

    if (result.success && !initialValue) {
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: ""
      });
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        <Input
          label="Customer name"
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Sunrise Foods"
          required
          value={form.name}
        />
        <Input
          label="Email"
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="finance@customer.com"
          type="email"
          value={form.email}
        />
        <Input
          label="Phone"
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="+263 77 123 4567"
          value={form.phone}
        />
        <Input
          label="Address"
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="Borrowdale, Harare"
          value={form.address}
        />
      </div>
      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Preferred delivery notes, payment expectations, or reminders."
        value={form.notes}
      />
      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
