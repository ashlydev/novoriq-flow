import Link from "next/link";

export default function SupportPage() {
  return (
    <article className="legal-content">
      <p className="eyebrow">Support</p>
      <h1>Contact and Support</h1>
      <p>
        Novoriq Flow support is designed for onboarding help, account issues, demo
        setup, and general product questions.
      </p>

      <div className="card">
        <div className="support-list">
          <div className="info-pair">
            <span>Email</span>
            <strong>support@novoriq.com</strong>
          </div>
          <div className="info-pair">
            <span>Sales</span>
            <strong>hello@novoriq.com</strong>
          </div>
          <div className="info-pair">
            <span>Hours</span>
            <strong>Mon-Fri, 8am to 5pm CAT</strong>
          </div>
        </div>
      </div>

      <h2>What to include</h2>
      <p>
        Share your business name, the screen or record involved, what action you were
        trying to complete, and any screenshots if relevant.
      </p>

      <div className="legal-links">
        <Link href="/signin">Sign in</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
      </div>
    </article>
  );
}
