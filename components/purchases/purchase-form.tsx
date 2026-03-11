"use client";

import { useState } from "react";
import {
  calculatePurchaseSummary,
  calculatePurchaseLineTotal,
  formatCurrency,
  toDateInputValue
} from "@/lib/calculations";
import { Item, Purchase, PurchaseLineItem, Supplier } from "@/lib/types";
import { Button, Card, Input, Select, Textarea } from "@/components/shared/ui";

interface PurchaseFormValue {
  supplierId: string;
  purchaseDate: string;
  dueDate: string;
  status: Purchase["status"];
  lineItems: PurchaseLineItem[];
  notes?: string;
}

function createLineItem(): PurchaseLineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    quantity: 1,
    unitCost: 0
  };
}

export function PurchaseForm({
  currency,
  suppliers,
  items,
  initialValue,
  submitLabel = "Save purchase",
  onSubmit
}: {
  currency: string;
  suppliers: Supplier[];
  items: Item[];
  initialValue?: PurchaseFormValue;
  submitLabel?: string;
  onSubmit: (
    value: PurchaseFormValue
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<PurchaseFormValue>({
    supplierId: initialValue?.supplierId || suppliers[0]?.id || "",
    purchaseDate: initialValue?.purchaseDate
      ? toDateInputValue(initialValue.purchaseDate)
      : new Date().toISOString().slice(0, 10),
    dueDate: initialValue?.dueDate
      ? toDateInputValue(initialValue.dueDate)
      : new Date().toISOString().slice(0, 10),
    status: initialValue?.status || "draft",
    lineItems: initialValue?.lineItems?.length ? initialValue.lineItems : [createLineItem()],
    notes: initialValue?.notes || ""
  });
  const [message, setMessage] = useState("");

  function updateField(field: keyof PurchaseFormValue, value: string | Purchase["status"]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLineItem(
    lineId: string,
    field: keyof PurchaseLineItem,
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
              unitCost: item.cost || item.sellingPrice
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
      lineItems: form.lineItems.map((lineItem) => ({
        ...lineItem,
        quantity: Number(lineItem.quantity),
        unitCost: Number(lineItem.unitCost)
      }))
    });
    setMessage(result.message);
  }

  const summary = calculatePurchaseSummary(form.lineItems);

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        <Select
          label="Supplier"
          onChange={(event) => updateField("supplierId", event.target.value)}
          value={form.supplierId}
        >
          <option value="">Select supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </Select>
        <Input
          label="Purchase date"
          onChange={(event) => updateField("purchaseDate", event.target.value)}
          type="date"
          value={form.purchaseDate}
        />
        <Input
          label="Due date"
          onChange={(event) => updateField("dueDate", event.target.value)}
          type="date"
          value={form.dueDate}
        />
        <Select
          label="Status"
          onChange={(event) => updateField("status", event.target.value as Purchase["status"])}
          value={form.status}
        >
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      <div className="panel-stack">
        {form.lineItems.map((lineItem, index) => (
          <Card className="document-line" key={lineItem.id}>
            <div className="split-line">
              <strong>Cost line {index + 1}</strong>
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
                <option value="">Custom line</option>
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
                label="Unit cost"
                min="0"
                onChange={(event) =>
                  updateLineItem(lineItem.id, "unitCost", Number(event.target.value))
                }
                step="0.01"
                type="number"
                value={lineItem.unitCost}
              />
            </div>
            <Textarea
              label="Description"
              onChange={(event) =>
                updateLineItem(lineItem.id, "description", event.target.value)
              }
              value={lineItem.description}
            />
            <div className="summary-line">
              <span>Line total</span>
              <strong>{formatCurrency(calculatePurchaseLineTotal(lineItem), currency)}</strong>
            </div>
          </Card>
        ))}
      </div>

      <div className="form-actions">
        <Button kind="secondary" onClick={addLineItem} type="button">
          Add line item
        </Button>
      </div>

      <Textarea
        label="Notes"
        onChange={(event) => updateField("notes", event.target.value)}
        placeholder="Delivery notes, payment terms, or supplier context."
        value={form.notes}
      />

      <Card>
        <div className="summary-line">
          <span>Purchase total</span>
          <strong>{formatCurrency(summary.total, currency)}</strong>
        </div>
      </Card>

      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
