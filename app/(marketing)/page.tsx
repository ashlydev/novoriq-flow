import Link from "next/link";
import { demoCredentials } from "@/lib/seed";

const featureHighlights = [
  "Receivables, payables, invoices, and approvals in one flow",
  "Projects, stock alerts, branches, and documents in one mobile workspace",
  "Owner-away visibility with cash-flow forecasting and stronger analytics",
  "Demo-ready seed data for founder and sales walkthroughs"
];

export default function MarketingHomePage() {
  return (
    <div className="marketing-shell">
      <div className="marketing-frame">
        <header className="marketing-topbar">
          <Link className="brand-mark" href="/">
            <span>Novoriq</span>
            <strong>Flow</strong>
          </Link>
          <div className="button-row">
            <Link className="button button-secondary" href="/signin">
              Sign in
            </Link>
            <Link className="button button-primary" href="/signup">
              Start now
            </Link>
          </div>
        </header>

        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Run my business</p>
              <h1>Run operations, teams, branches, and business visibility with confidence.</h1>
              <p>
                Novoriq Flow helps growing SMEs manage receivables, payables, branches,
                projects, stock-aware items, approvals, documents, and cash-flow
                visibility from a phone-first workspace.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/signup">
                  Create your workspace
                </Link>
                <Link className="button button-secondary" href="/signin">
                  Explore the demo
                </Link>
              </div>
              <div className="notice">
                Demo sign-in: <strong>{demoCredentials.email}</strong> /{" "}
                <strong>{demoCredentials.password}</strong>
              </div>
            </div>

            <div className="hero-card">
              <p className="eyebrow">V3 Promise</p>
              <h2>Control operations, teams, branches, and financial visibility in one place.</h2>
              <ul className="support-list">
                {featureHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <div className="hero-card">
            <p className="eyebrow">Positioning</p>
            <h3>ZimTill runs the shop. Novoriq Flow runs the business.</h3>
            <p>
              This app focuses on service businesses, traders, freelancers, agencies,
              consultants, contractors, and growing SMEs that need more structure than
              notebooks, spreadsheets, and WhatsApp can provide.
            </p>
          </div>
          <div className="hero-card">
            <p className="eyebrow">Built for growth</p>
            <h3>Focused scope, cleaner extension points.</h3>
            <p>
              Workspace isolation, roles, branches, approvals, stock controls, projects,
              documents, analytics, and seed data are structured so future phases can
              add subscriptions, deeper automation, and integrations without rewriting
              the core.
            </p>
          </div>
        </section>

        <footer className="marketing-topbar" style={{ marginTop: 40 }}>
          <div className="legal-links">
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/support">Support</Link>
          </div>
          <span className="eyebrow">Novoriq Flow V3</span>
        </footer>
      </div>
    </div>
  );
}
