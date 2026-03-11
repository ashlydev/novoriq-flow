"use client";

import { useState } from "react";
import {
  calculateDocumentSummary,
  formatCurrency,
  toDateInputValue
} from "@/lib/calculations";
import { Customer, Item, LineItem, RecurringInvoiceTemplate } from "@/lib/types";
import { Button, Card, Input, Select, Textarea } from "@/components/shared/ui";

interface RecurringInvoiceFormValue {
  customerId: string;
  label: string;
  frequency: RecurringInvoiceTemplate["frequency"];
  startDate: string;
  nextRunDate: string;
  dueInDays: number;
  isActive: boolean;
  lineItems: LineItem[];
  discountAmount: number;
  taxRate: number;
  notes?: string;
}

function createLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: 1,
    unitPrice: 0
  };
}

export function RecurringInvoiceForm({
  currency,
  customers,
  items,
  initialValue,
  submitLabel = "Save recurring invoice",
  onSubmit
}: {
  currency: string;
  customers: Customer[];
  items: Item[];
  initialValue?: RecurringInvoiceFormValue;
  submitLabel?: string;
  onSubmit: (
    value: RecurringInvoiceFormValue
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<RecurringInvoiceFormValue>({
    customerId: initialValue?.customerId || customers[0]?.id || "",
    label: initialValue?.label || "",
    frequency: initialValue?.frequency || "monthly",
    startDate: initialValue?.startDate
      ? toDateInputValue(initialValue.startDate)
      : new Date().toISOString().slice(0, 10),
    nextRunDate: initialValue?.nextRunDate
      ? toDateInputValue(initialValue.nextRunDate)
      : new Date().toISOString().slice(0, 10),
    dueInDays: initialValue?.dueInDays || 14,
    isActive: initialValue?.isActive ?? true,
    lineItems: initialValue?.lineItems?.length ? initialValue.lineItems : [createLineItem()],
    discountAmount: initialValue?.discountAmount || 0,
    taxRate: initialValue?.taxRate || 0,
    notes: initialValue?.notes || ""
  });
  const [message, setMessage] = useState("");

  function updateField(
    field: keyof RecurringInvoiceFormValue,
    value: string | number | boolean | LineItem[] | RecurringInvoiceTemplate["frequency"]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLineItem(
    lineId: string,
    field: keyof LineItem,
    value: string | number | undefined
  ) {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem) =>
        lineItem.id === lineId ? { ...lineItem, [field]: value } : lineItem
      )
    }));
  }

  function applyItemPreset(lineId: string, itemId: string) {
    const item = items.find((record) => record.id === itemId);
    if (!item) {
      return;
    }

    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem) =>
        lineItem.id === lineId
          ? {
              ...lineItem,
              itemId: item.id,
              name: item.name,
              description: item.description,
              unitPrice: item.sellingPrice,
              unitCost: item.cost
            }
          : lineItem
      )
    }));
  }

  function addLineItem() {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, createLineItem()]
    }));
  }

  function removeLineItem(lineId: string) {
    setForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length === 1
          ? current.lineItems
          : current.lineItems.filter((lineItem) => lineItem.id !== lineId)
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSubmit({
      ...form,
      dueInDays: Number(form.dueInDays),
      discountAmount: Number(form.discountAmount),
      taxRate: Number(form.taxRate)
    });
    setMessage(result.message);
  }

  const summary = calculateDocumentSummary(
    form.lineItems,
    form.discountAmount,
    form.taxRate
  );

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        <Select
          label="Customer"
          onChange={(event) => updateField("customerId", event.target.value)}
          value={form.customerId}
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
        <Input
          label="Template label"
          onChange={(event) => updateField("label", event.target.value)}
          placeholder="Monthly support retainer"
          value={form.label}
        />
        <Select
          label="Frequency"
          onChange={(event) =>
            updateField(
              "frequency",
              event.target.value as RecurringInvoiceTemplate["frequency"]
            )
          }
          value={form.frequency}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </Select>
        <Input
          label="Start date"
          onChange={(event) => updateField("startDate", event.target.value)}
          type="date"
          value={form.startDate}
        />
        <Input
          label="Next run date"
          onChange={(event) => updateField("nextRunDate", event.target.value)}
          type="date"
          value={form.nextRunDate}
        />
        <Input
          label="Due in days"
          onChange={(event) => updateField("dueInDays", Number(event.target.value))}
          type="number"
          value={String(form.dueInDays)}
        />
        <Select
          label="Active"
          onChange={(event) => updateField("isActive", event.target.value === "true")}
          value={String(form.isActive)}
        >
          <option value="true">Active</option>
          <option value="false">Paused</option>
        </Select>
      </div>

      <div className="panel-stack">
        {form.lineItems.map((lineItem, index) => (
          <Card className="document-line" key={lineItem.id}>
            <div className="split-line">
              <strong>Line item {index + 1}</strong>
              <Button kind="ghost" onClick={() => removeLineItem(lineItem.id)} type="button">
                Remove
              </Button>
            </div>
            <div className="line-grid">
              <Select
                label="Preset item"
                onChange={(event) => applyItemPreset(lineItem.id, event.target.value)}
                value={lineItem.itemId || ""}
              >
                <option value="">Custom line item</option>
                {items
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Select>
              <Input
                label="Name"
                onChange={(event) => updateLineItem(lineItem.id, "name", event.target.value)}
                value={lineItem.name}
              />
              <Input
                label="Quantity"
                min="0"
                onChange={(event) =>
                  updateLineItem(lineItem.id, "quantity", Number(event.target.value))
                }
                step="0.01"
                type="number"
                value={lineItem.quantity}
              />
              <Input
                label="Unit price"
                min="0"
                onChange={(event) =>
                  updateLineItem(lineItem.id, "unitPrice", Number(event.target.value))
                }
                step="0.01"
                type="number"
                value={lineItem.unitPrice}
              />
            </div>
            <Textarea
              label="Description"
              onChange={(event) =>
                updateLineItem(lineItem.id, "description", event.target.value)
              }
              value={lineItem.description}
            />
          </Card>
        ))}
      </div>

      <div className="form-actions">
        <Button kind="secondary" onClick={addLineItem} type="button">
          Add line item
        </Button>
      </div>

      <div className="form-grid">
        <Input
          label="Discount amount"
          min="0"
          onChange={(event) => updateField("discountAmount", Number(event.target.value))}
          step="0.01"
          type="number"
          value={String(form.discountAmount)}
        />
        <Input
          label="Tax rate %"
          min="0"
          onChange={(event) => updateField("taxRate", Number(event.target.value))}
          step="0.01"
          type="number"
          value={String(form.taxRate)}
        />
      </div>

      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Scope notes, billing reference, or client reminder."
        value={form.notes}
      />

      <Card>
        <div className="summary-line">
          <span>Total per invoice</span>
          <strong>{formatCurrency(summary.total, currency)}</strong>
        </div>
      </Card>

      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
