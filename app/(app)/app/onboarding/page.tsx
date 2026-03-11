"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Button, Card, Input, Select, Textarea } from "@/components/shared/ui";
import { onboardingDefaults } from "@/lib/seed";
import { BusinessCategory, CurrencyCode } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, createWorkspaceFromOnboarding } = useBusinessOS();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    businessName: "",
    category: onboardingDefaults.category as BusinessCategory,
    currency: onboardingDefaults.currency as CurrencyCode,
    phone: "",
    email: currentUser?.email || "",
    address: "",
    taxNumber: "",
    invoicePrefix: onboardingDefaults.invoicePrefix,
    quotePrefix: onboardingDefaults.quotePrefix,
    receiptPrefix: onboardingDefaults.receiptPrefix,
    purchasePrefix: onboardingDefaults.purchasePrefix,
    dueSoonDays: onboardingDefaults.dueSoonDays,
    defaultInvoiceDueDays: onboardingDefaults.defaultInvoiceDueDays,
    defaultPurchaseDueDays: onboardingDefaults.defaultPurchaseDueDays,
    significantExpenseThreshold: onboardingDefaults.significantExpenseThreshold,
    termsSnippet: onboardingDefaults.termsSnippet,
    accentColor: onboardingDefaults.accentColor
  });

  useEffect(() => {
    if (currentUser?.email) {
      setForm((current) => ({ ...current, email: current.email || currentUser.email }));
    }
  }, [currentUser]);

  function updateField(field: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createWorkspaceFromOnboarding({
      ...form,
      category: form.category,
      currency: form.currency,
      dueSoonDays: Number(form.dueSoonDays),
      defaultInvoiceDueDays: Number(form.defaultInvoiceDueDays),
      defaultPurchaseDueDays: Number(form.defaultPurchaseDueDays),
      significantExpenseThreshold: Number(form.significantExpenseThreshold),
      logoDataUrl: logoPreview
    });
    setMessage(result.message);
    if (result.success) {
      router.replace("/app/dashboard");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ width: "min(100%, 760px)" }}>
        <p className="eyebrow">Business onboarding</p>
        <h1>Set up your workspace.</h1>
        <p>
          Start with one business workspace, mobile-first setup, and clean defaults you
          can refine as Flow grows with the business.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          {message ? <div className="notice">{message}</div> : null}
          <div className="form-grid">
            <Input
              label="Business name"
              onChange={(event) => updateField("businessName", event.target.value)}
              required
              value={form.businessName}
            />
            <Select
              label="Business type"
              onChange={(event) =>
                updateField("category", event.target.value as BusinessCategory)
              }
              value={form.category}
            >
              <option value="freelancer">Freelancer</option>
              <option value="agency">Agency</option>
              <option value="consulting">Consulting</option>
              <option value="contractor">Contractor</option>
              <option value="services">Service business</option>
              <option value="trading">Trader</option>
              <option value="wholesale">Wholesale</option>
            </Select>
            <Select
              label="Currency"
              onChange={(event) =>
                updateField("currency", event.target.value as CurrencyCode)
              }
              value={form.currency}
            >
              <option value="USD">USD</option>
              <option value="ZAR">ZAR</option>
              <option value="ZWG">ZWG</option>
            </Select>
            <Input
              label="Business phone"
              onChange={(event) => updateField("phone", event.target.value)}
              value={form.phone}
            />
            <Input
              label="Business email"
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              value={form.email}
            />
            <Input
              label="Tax number"
              onChange={(event) => updateField("taxNumber", event.target.value)}
              value={form.taxNumber}
            />
            <Input
              label="Invoice prefix"
              onChange={(event) => updateField("invoicePrefix", event.target.value)}
              value={form.invoicePrefix}
            />
            <Input
              label="Quote prefix"
              onChange={(event) => updateField("quotePrefix", event.target.value)}
              value={form.quotePrefix}
            />
            <Input
              label="Receipt prefix"
              onChange={(event) => updateField("receiptPrefix", event.target.value)}
              value={form.receiptPrefix}
            />
            <Input
              label="Purchase prefix"
              onChange={(event) => updateField("purchasePrefix", event.target.value)}
              value={form.purchasePrefix}
            />
            <Input
              label="Due soon reminder days"
              onChange={(event) => updateField("dueSoonDays", Number(event.target.value))}
              type="number"
              value={String(form.dueSoonDays)}
            />
            <Input
              label="Default invoice due days"
              onChange={(event) =>
                updateField("defaultInvoiceDueDays", Number(event.target.value))
              }
              type="number"
              value={String(form.defaultInvoiceDueDays)}
            />
            <Input
              label="Default purchase due days"
              onChange={(event) =>
                updateField("defaultPurchaseDueDays", Number(event.target.value))
              }
              type="number"
              value={String(form.defaultPurchaseDueDays)}
            />
            <Input
              label="Significant expense alert"
              onChange={(event) =>
                updateField("significantExpenseThreshold", Number(event.target.value))
              }
              type="number"
              value={String(form.significantExpenseThreshold)}
            />
            <Input
              label="Accent color"
              onChange={(event) => updateField("accentColor", event.target.value)}
              type="color"
              value={form.accentColor}
            />
            <label className="field">
              <span>Logo upload</span>
              <input accept="image/*" className="input" onChange={handleLogoChange} type="file" />
            </label>
          </div>
          <Input
            label="Address"
            onChange={(event) => updateField("address", event.target.value)}
            value={form.address}
          />
          <Textarea
            label="Default terms snippet"
            onChange={(event) => updateField("termsSnippet", event.target.value)}
            value={form.termsSnippet}
          />

          {logoPreview ? (
            <Card>
              <p className="eyebrow">Logo preview</p>
              <img alt="Business logo preview" src={logoPreview} style={{ maxHeight: 64 }} />
            </Card>
          ) : null}

          <div className="form-actions">
            <Button type="submit">Create workspace</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
