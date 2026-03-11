"use client";

import { useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/shared/ui";
import { automationTemplates, AutomationTemplateKey } from "@/lib/v7-types";

export default function AutomationsPage() {
  const { canAccess } = useBusinessOS();
  const { automationRules, automationRuns, runAutomationRule, saveAutomationRule } = useFlowV7();
  const [message, setMessage] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<AutomationTemplateKey>("overdue_invoice_follow_up");
  const template = automationTemplates.find((entry) => entry.key === selectedTemplateKey)!;
  const [form, setForm] = useState({
    name: template.name,
    description: template.description,
    conditionSummary: template.defaultConditionSummary,
    actionSummary: template.defaultActionSummary,
    isEnabled: true
  });

  if (!canAccess("manage_automations")) {
    return (
      <AccessDeniedState description="Automation management is limited to roles with intelligent workflow controls." />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Automations"
        title="Automate repetitive follow-up without losing human control."
        description="Flow uses clear rule-based automations for reminders, escalations, digests, and intelligent follow-up. Sensitive actions still remain reviewable."
      />

      {message ? <div className="notice">{message}</div> : null}

      <div className="metric-grid">
        <MetricCard label="Active rules" value={String(automationRules.filter((rule) => rule.isEnabled).length)} />
        <MetricCard label="Templates" value={String(automationTemplates.length)} />
        <MetricCard label="Runs logged" value={String(automationRuns.length)} />
        <MetricCard label="Last 7 days" value={String(automationRuns.filter((run) => new Date(run.createdAt).getTime() >= Date.now() - 7 * 86400000).length)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Create automation from template</p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(
                saveAutomationRule({
                  name: form.name,
                  templateKey: selectedTemplateKey,
                  description: form.description,
                  triggerType: template.triggerType,
                  conditionSummary: form.conditionSummary,
                  actionSummary: form.actionSummary,
                  isEnabled: form.isEnabled,
                  targetRoles: ["owner", "admin", "manager"]
                }).message
              );
            }}
          >
            <Select
              label="Template"
              onChange={(event) => {
                const key = event.target.value as AutomationTemplateKey;
                const nextTemplate = automationTemplates.find((entry) => entry.key === key)!;
                setSelectedTemplateKey(key);
                setForm({
                  name: nextTemplate.name,
                  description: nextTemplate.description,
                  conditionSummary: nextTemplate.defaultConditionSummary,
                  actionSummary: nextTemplate.defaultActionSummary,
                  isEnabled: true
                });
              }}
              value={selectedTemplateKey}
            >
              {automationTemplates.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.name}
                </option>
              ))}
            </Select>
            <Input
              label="Rule name"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              value={form.name}
            />
            <Textarea
              label="Description"
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              value={form.description}
            />
            <Textarea
              label="Condition summary"
              onChange={(event) =>
                setForm((current) => ({ ...current, conditionSummary: event.target.value }))
              }
              rows={3}
              value={form.conditionSummary}
            />
            <Textarea
              label="Action summary"
              onChange={(event) =>
                setForm((current) => ({ ...current, actionSummary: event.target.value }))
              }
              rows={3}
              value={form.actionSummary}
            />
            <Select
              label="Enabled"
              onChange={(event) =>
                setForm((current) => ({ ...current, isEnabled: event.target.value === "yes" }))
              }
              value={form.isEnabled ? "yes" : "no"}
            >
              <option value="yes">Enabled</option>
              <option value="no">Paused</option>
            </Select>
            <div className="form-actions">
              <Button type="submit">Save automation</Button>
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Template library</p>
          {automationTemplates.map((entry) => (
            <div className="list-row" key={entry.key}>
              <div className="list-title">
                <div>
                  <strong>{entry.name}</strong>
                  <p>{entry.description}</p>
                </div>
                <StatusBadge label={entry.triggerType.replaceAll("_", " ")} tone="muted" />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Live automation rules</p>
          {automationRules.length ? (
            automationRules.map((rule) => (
              <div className="list-row" key={rule.id}>
                <div className="list-title">
                  <div>
                    <strong>{rule.name}</strong>
                    <p>{rule.description}</p>
                  </div>
                  <div className="button-row">
                    <StatusBadge
                      label={rule.isEnabled ? "enabled" : "paused"}
                      tone={rule.isEnabled ? "success" : "muted"}
                    />
                    <StatusBadge label={rule.triggerType.replaceAll("_", " ")} tone="muted" />
                  </div>
                </div>
                <p>{rule.conditionSummary}</p>
                <div className="button-row">
                  <Button
                    kind="secondary"
                    onClick={() => setMessage(runAutomationRule(rule.id).message)}
                    type="button"
                  >
                    Run now
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No automation rules yet"
              description="Start from one of the presets above to enable practical reminders and escalations."
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Recent runs</p>
          {automationRuns.length ? (
            automationRuns.slice(0, 8).map((run) => (
              <div className="list-row" key={run.id}>
                <div className="list-title">
                  <div>
                    <strong>{run.title}</strong>
                    <p>{run.summary}</p>
                  </div>
                  <StatusBadge
                    label={run.status}
                    tone={
                      run.status === "completed"
                        ? "success"
                        : run.status === "skipped"
                          ? "muted"
                          : "warning"
                    }
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No automation history yet"
              description="Run an automation or use the seeded demo data to see execution history here."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
