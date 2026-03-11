"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccessDeniedState } from "@/components/shared/access-denied";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { useFlowV7 } from "@/components/shared/flow-v7-provider";
import { Button, Card, EmptyState, Input, MetricCard, PageHeader, StatusBadge, Textarea } from "@/components/shared/ui";

export default function AssistantPage() {
  const { canAccess } = useBusinessOS();
  const {
    assistantSessions,
    assistantSuggestedPrompts,
    askAssistant,
    predictiveInsights,
    recommendations,
    summaries
  } = useFlowV7();
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(assistantSessions[0]?.id);

  useEffect(() => {
    if (!selectedSessionId && assistantSessions.length) {
      setSelectedSessionId(assistantSessions[0].id);
    }
  }, [assistantSessions, selectedSessionId]);

  if (!canAccess("view_assistant")) {
    return (
      <AccessDeniedState description="Assistant visibility is limited to roles with intelligent workflow access." />
    );
  }

  const selectedSession =
    assistantSessions.find((session) => session.id === selectedSessionId) || assistantSessions[0];
  const latestInteraction = selectedSession?.interactions[selectedSession.interactions.length - 1];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Assistant"
        title="Ask grounded business questions in plain language."
        description="The assistant uses real workspace data, existing Flow calculations, and explainable rules to summarize risk, receivables, payables, approvals, and recent business activity."
        action={
          <div className="button-row">
            <Link className="button button-secondary" href="/app/actions">
              Action center
            </Link>
            <Link className="button button-secondary" href="/app/predictive">
              Predictive insights
            </Link>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard label="Assistant sessions" value={String(assistantSessions.length)} />
        <MetricCard label="Recommendations" value={String(recommendations.length)} />
        <MetricCard label="Predictive cards" value={String(predictiveInsights.length)} />
        <MetricCard label="Summaries" value={String(summaries.length)} />
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Ask a question</p>
          {message ? <div className="notice">{message}</div> : null}
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const result = askAssistant(question, selectedSessionId);
              setMessage(result.message);
              if (result.success && result.sessionId) {
                setSelectedSessionId(result.sessionId);
                setQuestion("");
              }
            }}
          >
            <Textarea
              label="Business question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What invoices are overdue right now?"
              rows={4}
              value={question}
            />
            <div className="button-row">
              <Button type="submit">Ask assistant</Button>
              {assistantSuggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  kind="secondary"
                  onClick={() => setQuestion(prompt)}
                  type="button"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </form>
        </Card>

        <Card>
          <p className="eyebrow">Latest response</p>
          {latestInteraction ? (
            <div className="form-stack">
              <div>
                <strong>{latestInteraction.question}</strong>
                <p style={{ marginTop: 8 }}>{latestInteraction.answer}</p>
              </div>
              {latestInteraction.hardFacts.length ? (
                <div>
                  <p className="eyebrow">Hard facts</p>
                  {latestInteraction.hardFacts.map((fact) => (
                    <p key={fact}>{fact}</p>
                  ))}
                </div>
              ) : null}
              {latestInteraction.derivedInsights.length ? (
                <div>
                  <p className="eyebrow">Derived insight</p>
                  {latestInteraction.derivedInsights.map((fact) => (
                    <p key={fact}>{fact}</p>
                  ))}
                </div>
              ) : null}
              {latestInteraction.sources.length ? (
                <div className="button-row">
                  {latestInteraction.sources.map((source) =>
                    source.href ? (
                      <Link key={`${source.label}-${source.href}`} className="button button-secondary" href={source.href}>
                        {source.label}
                      </Link>
                    ) : null
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="No assistant history yet"
              description="Ask a grounded question about overdue invoices, payables, approvals, branch performance, or recent activity."
            />
          )}
        </Card>
      </div>

      <div className="two-col">
        <Card>
          <p className="eyebrow">Conversation history</p>
          {assistantSessions.length ? (
            assistantSessions.map((session) => (
              <button
                key={session.id}
                className="list-row"
                onClick={() => setSelectedSessionId(session.id)}
                style={{
                  border:
                    selectedSession?.id === session.id ? "1px solid var(--border-strong)" : undefined,
                  textAlign: "left",
                  width: "100%",
                  background: "transparent"
                }}
                type="button"
              >
                <div className="list-title">
                  <div>
                    <strong>{session.title}</strong>
                    <p>{session.interactions[session.interactions.length - 1]?.question}</p>
                  </div>
                  <StatusBadge label={session.lastIntent.replaceAll("_", " ")} tone="muted" />
                </div>
              </button>
            ))
          ) : (
            <EmptyState
              title="No sessions yet"
              description="Assistant sessions will appear here after the first business question is asked."
            />
          )}
        </Card>

        <Card>
          <p className="eyebrow">Source-backed highlights</p>
          {summaries.slice(0, 3).map((summary) => (
            <div className="list-row" key={summary.id}>
              <div className="list-title">
                <div>
                  <strong>{summary.title}</strong>
                  <p>{summary.summary}</p>
                </div>
                <StatusBadge label={summary.scope} tone="muted" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
