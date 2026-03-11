"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/shared/ui";

interface SupplierFormValue {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export function SupplierForm({
  initialValue,
  submitLabel = "Save supplier",
  onSubmit
}: {
  initialValue?: SupplierFormValue;
  submitLabel?: string;
  onSubmit: (
    value: SupplierFormValue
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<SupplierFormValue>({
    name: initialValue?.name || "",
    email: initialValue?.email || "",
    phone: initialValue?.phone || "",
    address: initialValue?.address || "",
    notes: initialValue?.notes || ""
  });
  const [message, setMessage] = useState("");

  function updateField(field: keyof SupplierFormValue, value: string) {
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
          label="Supplier name"
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Metro Telecom"
          required
          value={form.name}
        />
        <Input
          label="Email"
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="sales@supplier.com"
          type="email"
          value={form.email}
        />
        <Input
          label="Phone"
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="+263 78 123 9876"
          value={form.phone}
        />
        <Input
          label="Address"
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="CBD, Harare"
          value={form.address}
        />
      </div>
      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Negotiated rates, service scope, or billing reminders."
        value={form.notes}
      />
      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
