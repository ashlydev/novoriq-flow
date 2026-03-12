"use client";

import { cn } from "@/lib/utils";

type Highlight = {
  title: string;
  description: string;
};

export function AuthScreen({
  title,
  intro,
  badges,
  highlights,
  children,
  cardClassName
}: {
  title: string;
  intro: string;
  badges: string[];
  highlights: Highlight[];
  children: React.ReactNode;
  cardClassName?: string;
}) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-brand-row">
            <div className="brand-mark brand-mark-large">
              <span>Novoriq</span>
              <strong>Flow</strong>
            </div>
            <div>
              <p className="sidebar-kicker auth-brand">Novoriq Flow</p>
              <h1>{title}</h1>
            </div>
          </div>

          <p className="auth-intro">{intro}</p>

          <div className="auth-badge-row">
            {badges.map((badge) => (
              <span className="pill-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>

          <div className="auth-highlight-grid">
            {highlights.map((highlight) => (
              <article className="auth-highlight-card" key={highlight.title}>
                <strong>{highlight.title}</strong>
                <span>{highlight.description}</span>
              </article>
            ))}
          </div>
        </section>

        <div className={cn("auth-card", cardClassName)}>{children}</div>
      </div>
    </div>
  );
}
