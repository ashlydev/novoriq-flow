import Link from "next/link";

export default function PrivacyPage() {
  return (
    <article className="legal-content">
      <p className="eyebrow">Legal</p>
      <h1>Privacy Policy</h1>
      <p>
        Novoriq Flow is designed to store core business records such as customers,
        suppliers, invoices, payments, receipts, expenses, branches, approvals,
        projects, and settings for your workspace.
      </p>

      <h2>What we collect</h2>
      <p>
        We collect the account and workspace information you provide, together with the
        operational records created while using the app.
      </p>

      <h2>How it is used</h2>
      <p>
        Information is used to operate the product, protect accounts, improve workflows,
        and support your business operations.
      </p>

      <h2>Workspace boundaries</h2>
      <p>
        Data is intended to remain isolated by business workspace. Role expansion and
        future team access controls are planned on top of this foundation.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Archived records may remain stored for reporting and audit-friendly history
        unless you request account closure or deletion through support.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions about privacy, security, or data handling, use the support
        page below.
      </p>

      <div className="legal-links">
        <Link href="/signin">Sign in</Link>
        <Link href="/legal/terms">Terms of service</Link>
        <Link href="/support">Support</Link>
      </div>
    </article>
  );
}
