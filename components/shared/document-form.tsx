"use client";

import { useState } from "react";
import {
  calculateDocumentSummary,
  formatCurrency,
  toDateInputValue
} from "@/lib/calculations";
import { Customer, InvoiceStatus, Item, LineItem, QuoteStatus } from "@/lib/types";
import { Button, Card, Input, Select, Textarea } from "@/components/shared/ui";

type Mode = "quote" | "invoice";

interface DocumentFormValue {
  customerId: string;
  issueDate: string;
  secondaryDate: string;
  status: QuoteStatus | InvoiceStatus;
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

export function DocumentForm({
  mode,
  currency,
  customers,
  items,
  initialValue,
  submitLabel,
  onSubmit
}: {
  mode: Mode;
  currency: string;
  customers: Customer[];
  items: Item[];
  initialValue?: DocumentFormValue;
  submitLabel?: string;
  onSubmit: (
    value:
      | {
          customerId: string;
          issueDate: string;
          expiryDate: string;
          status: QuoteStatus;
          lineItems: LineItem[];
          discountAmount: number;
          taxRate: number;
          notes?: string;
        }
      | {
          customerId: string;
          issueDate: string;
          dueDate: string;
          status: InvoiceStatus;
          lineItems: LineItem[];
          discountAmount: number;
          taxRate: number;
          notes?: string;
        }
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<DocumentFormValue>({
    customerId: initialValue?.customerId || customers[0]?.id || "",
    issueDate: initialValue?.issueDate
      ? toDateInputValue(initialValue.issueDate)
      : new Date().toISOString().slice(0, 10),
    secondaryDate: initialValue?.secondaryDate
      ? toDateInputValue(initialValue.secondaryDate)
      : new Date().toISOString().slice(0, 10),
    status:
      initialValue?.status || (mode === "quote" ? "draft" : "draft"),
    lineItems: initialValue?.lineItems?.length
      ? initialValue.lineItems
      : [createLineItem()],
    discountAmount: initialValue?.discountAmount || 0,
    taxRate: initialValue?.taxRate || 0,
    notes: initialValue?.notes || ""
  });
  const [message, setMessage] = useState("");

  function updateField(
    field: keyof DocumentFormValue,
    value: string | number | LineItem[] | QuoteStatus | InvoiceStatus
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

    const payload = {
      customerId: form.customerId,
      issueDate: form.issueDate,
      lineItems: form.lineItems,
      discountAmount: Number(form.discountAmount),
      taxRate: Number(form.taxRate),
      notes: form.notes
    };

    const result =
      mode === "quote"
        ? onSubmit({
            ...payload,
            expiryDate: form.secondaryDate,
            status: form.status as QuoteStatus
          })
        : onSubmit({
            ...payload,
            dueDate: form.secondaryDate,
            status: form.status as InvoiceStatus
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
          label="Issue date"
          onChange={(event) => updateField("issueDate", event.target.value)}
          type="date"
          value={form.issueDate}
        />
        <Input
          label={mode === "quote" ? "Expiry date" : "Due date"}
          onChange={(event) => updateField("secondaryDate", event.target.value)}
          type="date"
          value={form.secondaryDate}
        />
        <Select
          label="Status"
          onChange={(event) =>
            updateField("status", event.target.value as DocumentFormValue["status"])
          }
          value={form.status}
        >
          {mode === "quote" ? (
            <>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </>
          ) : (
            <>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </>
          )}
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
          value={form.discountAmount}
        />
        <Input
          label="Tax rate %"
          min="0"
          onChange={(event) => updateField("taxRate", Number(event.target.value))}
          step="0.01"
          type="number"
          value={form.taxRate}
        />
      </div>

      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Payment terms, scope notes, or reminders."
        value={form.notes}
      />

      <Card>
        <div className="summary-line">
          <span>Subtotal</span>
          <strong>{formatCurrency(summary.subtotal, currency)}</strong>
        </div>
        <div className="summary-line">
          <span>Discount</span>
          <strong>{formatCurrency(summary.discountAmount, currency)}</strong>
        </div>
        <div className="summary-line">
          <span>Tax</span>
          <strong>{formatCurrency(summary.tax, currency)}</strong>
        </div>
        <div className="summary-line">
          <span>Total</span>
          <strong>{formatCurrency(summary.total, currency)}</strong>
        </div>
      </Card>

      <div className="form-actions">
        <Button type="submit">{submitLabel || (mode === "quote" ? "Save quote" : "Save invoice")}</Button>
      </div>
    </form>
  );
}
