import Link from "next/link";

export default function TermsPage() {
  return (
    <article className="legal-content">
      <p className="eyebrow">Legal</p>
      <h1>Terms of Service</h1>
      <p>
        These terms govern the use of Novoriq Flow, a business operations
        platform for small and growing businesses.
      </p>

      <h2>Use of the service</h2>
      <p>
        You may use the platform only for lawful business activity and must keep your
        account credentials secure. You are responsible for records created under your
        workspace.
      </p>

      <h2>Data ownership</h2>
      <p>
        Your business retains ownership of customers, invoices, payments, receipts,
        expenses, and related records stored inside its workspace.
      </p>

      <h2>Availability</h2>
      <p>
        Novoriq will make reasonable efforts to keep the service available, but no
        uninterrupted uptime is guaranteed at all times.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may not misuse the platform, attempt unauthorized access, or use the
        service to harm other businesses, individuals, or systems.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be directed through the support page linked
        below.
      </p>

      <div className="legal-links">
        <Link href="/signin">Sign in</Link>
        <Link href="/legal/privacy">Privacy policy</Link>
        <Link href="/support">Support</Link>
      </div>
    </article>
  );
}
