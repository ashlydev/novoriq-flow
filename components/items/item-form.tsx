"use client";

import { useState } from "react";
import { Button, Card, Input, Select, Textarea } from "@/components/shared/ui";
import { Item } from "@/lib/types";

interface ItemFormValue {
  name: string;
  kind: Item["kind"];
  description?: string;
  sellingPrice: number;
  cost?: number;
  sku?: string;
  category?: string;
  isActive: boolean;
  isTracked: boolean;
  openingQuantity: number;
  reorderLevel: number;
}

export function ItemForm({
  initialValue,
  submitLabel = "Save item",
  onSubmit
}: {
  initialValue?: ItemFormValue;
  submitLabel?: string;
  onSubmit: (
    value: ItemFormValue
  ) => { success: boolean; message: string; id?: string };
}) {
  const [form, setForm] = useState<ItemFormValue>({
    name: initialValue?.name || "",
    kind: initialValue?.kind || "service",
    description: initialValue?.description || "",
    sellingPrice: initialValue?.sellingPrice || 0,
    cost: initialValue?.cost || 0,
    sku: initialValue?.sku || "",
    category: initialValue?.category || "",
    isActive: initialValue?.isActive ?? true,
    isTracked: initialValue?.isTracked ?? false,
    openingQuantity: initialValue?.openingQuantity ?? 0,
    reorderLevel: initialValue?.reorderLevel ?? 0
  });
  const [message, setMessage] = useState("");

  function updateField(field: keyof ItemFormValue, value: string | number | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onSubmit({
      ...form,
      sellingPrice: Number(form.sellingPrice),
      cost: Number(form.cost) || undefined
    });
    setMessage(result.message);

    if (result.success && !initialValue) {
      setForm({
        name: "",
        kind: "service",
        description: "",
        sellingPrice: 0,
        cost: 0,
        sku: "",
        category: "",
        isActive: true,
        isTracked: false,
        openingQuantity: 0,
        reorderLevel: 0
      });
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {message ? <div className="notice">{message}</div> : null}
      <div className="form-grid">
        <Input
          label="Item name"
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Brand Retainer"
          required
          value={form.name}
        />
        <Select
          label="Type"
          onChange={(event) =>
            updateField("kind", event.target.value as ItemFormValue["kind"])
          }
          value={form.kind}
        >
          <option value="service">Service</option>
          <option value="product">Product</option>
        </Select>
        <Input
          label="Selling price"
          min="0"
          onChange={(event) => updateField("sellingPrice", Number(event.target.value))}
          step="0.01"
          type="number"
          value={form.sellingPrice}
        />
        <Input
          label="Cost"
          min="0"
          onChange={(event) => updateField("cost", Number(event.target.value))}
          step="0.01"
          type="number"
          value={form.cost}
        />
        <Input
          label="SKU"
          onChange={(event) => updateField("sku", event.target.value)}
          placeholder="BRAND-001"
          value={form.sku}
        />
        <Input
          label="Category"
          onChange={(event) => updateField("category", event.target.value)}
          placeholder="Retainers"
          value={form.category}
        />
      </div>
      <Textarea
        label="Description"
        onChange={(event) => updateField("description", event.target.value)}
        placeholder="What this item includes."
        value={form.description}
      />
      <label className="field">
        <span>Status</span>
        <select
          className="select"
          onChange={(event) => updateField("isActive", event.target.value === "true")}
          value={String(form.isActive)}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>
      <Card>
        <p className="eyebrow">Inventory-lite</p>
        <div className="form-grid">
          <label className="field">
            <span>Stock tracking</span>
            <select
              className="select"
              onChange={(event) => updateField("isTracked", event.target.value === "true")}
              value={String(form.isTracked)}
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </label>
          <Input
            label="Opening quantity"
            onChange={(event) => updateField("openingQuantity", Number(event.target.value))}
            type="number"
            value={String(form.openingQuantity)}
          />
          <Input
            label="Reorder level"
            onChange={(event) => updateField("reorderLevel", Number(event.target.value))}
            type="number"
            value={String(form.reorderLevel)}
          />
        </div>
      </Card>
      <div className="form-actions">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
