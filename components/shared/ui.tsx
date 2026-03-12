"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("card", className)}>{children}</section>;
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <Card className={cn("metric-card", `tone-${tone}`)}>
      <p className="metric-label">{label}</p>
      <strong className="metric-value">{value}</strong>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </Card>
  );
}

export function StatusBadge({
  label,
  tone = "default"
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  return <span className={cn("status-badge", `badge-${tone}`)}>{label}</span>;
}

export function Button({
  children,
  className,
  href,
  kind = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  kind?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const classes = cn("button", `button-${kind}`, className);

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

export function Input({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" {...props} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea className="textarea" {...props} />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function Select({
  label,
  children,
  hint,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="select" {...props}>
        {children}
      </select>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="empty-state">
      <p className="eyebrow">Ready for setup</p>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </Card>
  );
}

export function InfoPair({
  label,
  value
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="info-pair">
      <span>{label}</span>
      <strong>{value || "Not set"}</strong>
    </div>
  );
}
