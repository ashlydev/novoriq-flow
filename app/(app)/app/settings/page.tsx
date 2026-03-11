"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV3 } from "@/components/shared/flow-v3-provider";
import { useFlowV4 } from "@/components/shared/flow-v4-provider";
import { useFlowV5 } from "@/components/shared/flow-v5-provider";
import { useFlowV6 } from "@/components/shared/flow-v6-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, Input, PageHeader, Select, Textarea } from "@/components/shared/ui";
import { BusinessCategory, CurrencyCode } from "@/lib/types";
import { TemplateSettings } from "@/lib/v3-types";

export default function SettingsPage() {
  const {
    currentUser,
    currentWorkspace,
    resetDemoState,
    updateProfile,
    updateSettings,
    updateWorkspace,
    workspaceData
  } = useBusinessOS();
  const { resetV3DemoState, templateSettings, updateTemplateSettings } = useFlowV3();
  const { currentBusinessProfile, networkPreferences, resetV4DemoState } = useFlowV4();
  const { resetV5DemoState } = useFlowV5();
  const { resetV6DemoState } = useFlowV6();
  const {
    intelligenceSettings,
    resetV7DemoState,
    updateIntelligenceSettings
  } = useFlowV7();
  const [profileMessage, setProfileMessage] = useState("");
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [intelligenceMessage, setIntelligenceMessage] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: ""
  });
  const [workspaceForm, setWorkspaceForm] = useState({
    businessName: "",
    category: "services" as BusinessCategory,
    currency: "USD" as CurrencyCode,
    phone: "",
    email: "",
    address: "",
    taxNumber: ""
  });
  const [settingsForm, setSettingsForm] = useState({
    notificationsEnabled: true,
    paymentRemindersEnabled: true,
    dueSoonDays: 7,
    invoicePrefix: "INV",
    quotePrefix: "Q",
    receiptPrefix: "RCPT",
    purchasePrefix: "PO",
    defaultInvoiceDueDays: 14,
    defaultPurchaseDueDays: 14,
    significantExpenseThreshold: 500,
    termsSnippet: "",
    brandAccent: "#c9a95a"
  });
  const [templateForm, setTemplateForm] = useState<{
    invoiceStyle: TemplateSettings["invoiceStyle"];
    quoteStyle: TemplateSettings["quoteStyle"];
    receiptStyle: TemplateSettings["receiptStyle"];
    footerNote: string;
    showLogo: boolean;
  }>({
    invoiceStyle: "classic",
    quoteStyle: "classic",
    receiptStyle: "compact",
    footerNote: "",
    showLogo: true
  });
  const [intelligenceForm, setIntelligenceForm] = useState({
    assistantEnabled: true,
    automationEnabled: true,
    predictiveInsightsEnabled: true,
    anomalySensitivity: "balanced" as typeof intelligenceSettings.anomalySensitivity
  });

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || ""
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceForm({
        businessName: currentWorkspace.name,
        category: currentWorkspace.category,
        currency: currentWorkspace.currency,
        phone: currentWorkspace.phone || "",
        email: currentWorkspace.email || "",
        address: currentWorkspace.address || "",
        taxNumber: currentWorkspace.taxNumber || ""
      });
      setLogoPreview(currentWorkspace.logoDataUrl || "");
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (workspaceData.settings) {
      setSettingsForm({
        notificationsEnabled: workspaceData.settings.notificationsEnabled,
        paymentRemindersEnabled: workspaceData.settings.paymentRemindersEnabled,
        dueSoonDays: workspaceData.settings.dueSoonDays,
        invoicePrefix: workspaceData.settings.invoicePrefix,
        quotePrefix: workspaceData.settings.quotePrefix,
        receiptPrefix: workspaceData.settings.receiptPrefix,
        purchasePrefix: workspaceData.settings.purchasePrefix,
        defaultInvoiceDueDays: workspaceData.settings.defaultInvoiceDueDays,
        defaultPurchaseDueDays: workspaceData.settings.defaultPurchaseDueDays,
        significantExpenseThreshold: workspaceData.settings.significantExpenseThreshold,
        termsSnippet: workspaceData.settings.termsSnippet || "",
        brandAccent: workspaceData.settings.brandAccent
      });
    }
  }, [workspaceData.settings]);

  useEffect(() => {
    setTemplateForm({
      invoiceStyle: templateSettings.invoiceStyle,
      quoteStyle: templateSettings.quoteStyle,
      receiptStyle: templateSettings.receiptStyle,
      footerNote: templateSettings.footerNote || "",
      showLogo: templateSettings.showLogo
    });
  }, [templateSettings]);

  useEffect(() => {
    setIntelligenceForm({
      assistantEnabled: intelligenceSettings.assistantEnabled,
      automationEnabled: intelligenceSettings.automationEnabled,
      predictiveInsightsEnabled: intelligenceSettings.predictiveInsightsEnabled,
      anomalySensitivity: intelligenceSettings.anomalySensitivity
    });
  }, [intelligenceSettings]);

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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Settings"
        title="Business, profile, and notification controls."
        description="Control branding, document defaults, reminders, templates, and account details from one place."
      />

      <div className="two-col">
        <Card>
          <p className="eyebrow">Profile</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = updateProfile(profileForm);
              setProfileMessage(result.message);
            }}
          >
            {profileMessage ? <div className="notice">{profileMessage}</div> : null}
            <Input
              label="Full name"
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, fullName: event.target.value }))
              }
              value={profileForm.fullName}
            />
            <Input
              label="Email"
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, email: event.target.value }))
              }
              type="email"
              value={profileForm.email}
            />
            <Input
              label="Phone"
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, phone: event.target.value }))
              }
              value={profileForm.phone}
            />
            <div className="form-actions">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Business settings</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = updateWorkspace({
                ...workspaceForm,
                logoDataUrl: logoPreview
              });
              setWorkspaceMessage(result.message);
            }}
          >
            {workspaceMessage ? <div className="notice">{workspaceMessage}</div> : null}
            <div className="form-grid">
              <Input
                label="Business name"
                onChange={(event) =>
                  setWorkspaceForm((current) => ({
                    ...current,
                    businessName: event.target.value
                  }))
                }
                value={workspaceForm.businessName}
              />
              <Select
                label="Category"
                onChange={(event) =>
                  setWorkspaceForm((current) => ({
                    ...current,
                    category: event.target.value as BusinessCategory
                  }))
                }
                value={workspaceForm.category}
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
                  setWorkspaceForm((current) => ({
                    ...current,
                    currency: event.target.value as CurrencyCode
                  }))
                }
                value={workspaceForm.currency}
              >
                <option value="USD">USD</option>
                <option value="ZAR">ZAR</option>
                <option value="ZWG">ZWG</option>
              </Select>
              <Input
                label="Phone"
                onChange={(event) =>
                  setWorkspaceForm((current) => ({ ...current, phone: event.target.value }))
                }
                value={workspaceForm.phone}
              />
              <Input
                label="Email"
                onChange={(event) =>
                  setWorkspaceForm((current) => ({ ...current, email: event.target.value }))
                }
                value={workspaceForm.email}
              />
              <Input
                label="Tax number"
                onChange={(event) =>
                  setWorkspaceForm((current) => ({
                    ...current,
                    taxNumber: event.target.value
                  }))
                }
                value={workspaceForm.taxNumber}
              />
            </div>
            <Input
              label="Address"
              onChange={(event) =>
                setWorkspaceForm((current) => ({ ...current, address: event.target.value }))
              }
              value={workspaceForm.address}
            />
            <label className="field">
              <span>Logo upload</span>
              <input accept="image/*" className="input" onChange={handleLogoChange} type="file" />
            </label>
            {logoPreview ? <img alt="Workspace logo" src={logoPreview} style={{ maxHeight: 64 }} /> : null}
            <div className="form-actions">
              <Button type="submit">Save business</Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Finance settings and tools</p>
        <div className="button-row">
          <Link className="button button-secondary" href="/app/finance">
            Open finance dashboard
          </Link>
          <Link className="button button-secondary" href="/app/finance/reconciliation">
            Reconciliation
          </Link>
          <Link className="button button-secondary" href="/app/finance/readiness">
            Readiness
          </Link>
          <Link className="button button-secondary" href="/app/finance/supplier-credit">
            Supplier credit
          </Link>
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Enterprise controls and admin</p>
        <div className="button-row">
          <Link className="button button-secondary" href="/app/executive">
            Executive dashboard
          </Link>
          <Link className="button button-secondary" href="/app/control-center">
            Control center
          </Link>
          <Link className="button button-secondary" href="/app/permissions">
            Permissions
          </Link>
          <Link className="button button-secondary" href="/app/departments">
            Departments
          </Link>
          <Link className="button button-secondary" href="/app/reviews">
            Maker-checker
          </Link>
          <Link className="button button-secondary" href="/app/admin">
            Admin console
          </Link>
          <Link className="button button-secondary" href="/app/exports">
            Export center
          </Link>
        </div>
      </Card>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Documents & notifications</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = updateSettings({
                ...settingsForm,
                dueSoonDays: Number(settingsForm.dueSoonDays),
                defaultInvoiceDueDays: Number(settingsForm.defaultInvoiceDueDays),
                defaultPurchaseDueDays: Number(settingsForm.defaultPurchaseDueDays),
                significantExpenseThreshold: Number(settingsForm.significantExpenseThreshold)
              });
              setSettingsMessage(result.message);
            }}
          >
            {settingsMessage ? <div className="notice">{settingsMessage}</div> : null}
            <div className="form-grid">
              <Input
                label="Invoice prefix"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    invoicePrefix: event.target.value
                  }))
                }
                value={settingsForm.invoicePrefix}
              />
              <Input
                label="Quote prefix"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    quotePrefix: event.target.value
                  }))
                }
                value={settingsForm.quotePrefix}
              />
              <Input
                label="Receipt prefix"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    receiptPrefix: event.target.value
                  }))
                }
                value={settingsForm.receiptPrefix}
              />
              <Input
                label="Purchase prefix"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    purchasePrefix: event.target.value
                  }))
                }
                value={settingsForm.purchasePrefix}
              />
              <Input
                label="Due soon reminder days"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    dueSoonDays: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(settingsForm.dueSoonDays)}
              />
              <Input
                label="Default invoice due days"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    defaultInvoiceDueDays: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(settingsForm.defaultInvoiceDueDays)}
              />
              <Input
                label="Default purchase due days"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    defaultPurchaseDueDays: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(settingsForm.defaultPurchaseDueDays)}
              />
              <Input
                label="Large expense alert"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    significantExpenseThreshold: Number(event.target.value)
                  }))
                }
                type="number"
                value={String(settingsForm.significantExpenseThreshold)}
              />
              <Input
                label="Accent color"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    brandAccent: event.target.value
                  }))
                }
                type="color"
                value={settingsForm.brandAccent}
              />
              <Select
                label="Notifications"
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    notificationsEnabled: event.target.value === "true"
                  }))
                }
                value={String(settingsForm.notificationsEnabled)}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            </div>
            <Select
              label="Payment reminders"
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  paymentRemindersEnabled: event.target.value === "true"
                }))
              }
              value={String(settingsForm.paymentRemindersEnabled)}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
            <Textarea
              label="Default terms snippet"
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  termsSnippet: event.target.value
                }))
              }
              value={settingsForm.termsSnippet}
            />
            <div className="form-actions">
              <Button type="submit">Save preferences</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Document templates</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = updateTemplateSettings(templateForm);
              setTemplateMessage(result.message);
            }}
          >
            {templateMessage ? <div className="notice">{templateMessage}</div> : null}
            <div className="form-grid">
              <Select
                label="Invoice style"
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    invoiceStyle: event.target.value as typeof current.invoiceStyle
                  }))
                }
                value={templateForm.invoiceStyle}
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="compact">Compact</option>
              </Select>
              <Select
                label="Quote style"
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    quoteStyle: event.target.value as typeof current.quoteStyle
                  }))
                }
                value={templateForm.quoteStyle}
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="compact">Compact</option>
              </Select>
              <Select
                label="Receipt style"
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    receiptStyle: event.target.value as typeof current.receiptStyle
                  }))
                }
                value={templateForm.receiptStyle}
              >
                <option value="compact">Compact</option>
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
              </Select>
              <Select
                label="Show logo"
                onChange={(event) =>
                  setTemplateForm((current) => ({
                    ...current,
                    showLogo: event.target.value === "true"
                  }))
                }
                value={String(templateForm.showLogo)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
            <Textarea
              label="Template footer note"
              onChange={(event) =>
                setTemplateForm((current) => ({
                  ...current,
                  footerNote: event.target.value
                }))
              }
              value={templateForm.footerNote}
            />
            <div className="form-actions">
              <Button type="submit">Save template settings</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Network settings</p>
          <div className="support-list">
            <Link href="/app/network/profile">Business network profile</Link>
            <Link href="/app/network/connections">Connections</Link>
            <Link href="/app/network/catalogs">Catalogs</Link>
          </div>
          <p style={{ marginTop: 20 }}>
            {currentBusinessProfile
              ? `${currentBusinessProfile.visibility} profile · ${networkPreferences?.defaultCatalogVisibility || "connections"} catalog default`
              : "Set up the network profile to start connecting with other businesses."}
          </p>
        </Card>

        <Card>
          <p className="eyebrow">Intelligence controls</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setIntelligenceMessage(updateIntelligenceSettings(intelligenceForm).message);
            }}
          >
            {intelligenceMessage ? <div className="notice">{intelligenceMessage}</div> : null}
            <div className="support-list">
              <Link href="/app/assistant">Assistant</Link>
              <Link href="/app/actions">Action center</Link>
              <Link href="/app/automations">Automations</Link>
              <Link href="/app/anomalies">Anomalies</Link>
              <Link href="/app/predictive">Predictive insights</Link>
            </div>
            <div className="form-grid" style={{ marginTop: 16 }}>
              <Select
                label="Assistant"
                onChange={(event) =>
                  setIntelligenceForm((current) => ({
                    ...current,
                    assistantEnabled: event.target.value === "true"
                  }))
                }
                value={String(intelligenceForm.assistantEnabled)}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
              <Select
                label="Automations"
                onChange={(event) =>
                  setIntelligenceForm((current) => ({
                    ...current,
                    automationEnabled: event.target.value === "true"
                  }))
                }
                value={String(intelligenceForm.automationEnabled)}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
              <Select
                label="Predictive insights"
                onChange={(event) =>
                  setIntelligenceForm((current) => ({
                    ...current,
                    predictiveInsightsEnabled: event.target.value === "true"
                  }))
                }
                value={String(intelligenceForm.predictiveInsightsEnabled)}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
              <Select
                label="Anomaly sensitivity"
                onChange={(event) =>
                  setIntelligenceForm((current) => ({
                    ...current,
                    anomalySensitivity: event.target.value as typeof current.anomalySensitivity
                  }))
                }
                value={intelligenceForm.anomalySensitivity}
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </Select>
            </div>
            <div className="form-actions">
              <Button type="submit">Save intelligence settings</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Legal & support</p>
          <div className="support-list">
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/privacy">Privacy Policy</Link>
            <Link href="/support">Contact & Support</Link>
          </div>
          <p style={{ marginTop: 20 }}>
            Demo reset returns the workspace to seeded Novoriq Flow data so the app stays ready for
            walkthroughs.
          </p>
          <div className="form-actions">
            <Button
              kind="danger"
              onClick={() => {
              resetDemoState();
              resetV3DemoState();
              resetV4DemoState();
              resetV5DemoState();
              resetV6DemoState();
              resetV7DemoState();
            }}
            type="button"
          >
              Reset demo data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
