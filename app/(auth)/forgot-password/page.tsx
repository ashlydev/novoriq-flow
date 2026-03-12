"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthScreen } from "@/components/layout/auth-screen";
import { Button, Input } from "@/components/shared/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <AuthScreen
      badges={["Secure access", "Owner-ready", "Mobile support"]}
      highlights={[
        {
          title: "Keep access recoverable",
          description:
            "The reset surface is ready for a production email flow while keeping the current demo safe and simple."
        },
        {
          title: "Protect the workspace",
          description:
            "Credentials gate the full V1-V7 business workspace, so recovery should stay deliberate and traceable."
        },
        {
          title: "Stay usable on phones",
          description:
            "The auth flow remains centered, touch-friendly, and install-safe across common Android screen sizes."
        }
      ]}
      intro="For the current demo build, the flow is stubbed for readiness. In production this page would trigger a secure email reset workflow."
      title="Request a reset link."
    >
      <div className="auth-form-copy">
        <p className="eyebrow">Password reset</p>
        <h2>Recover your account</h2>
        <p className="page-description">
          Enter the email linked to the workspace and prepare the reset request.
        </p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        {submitted ? (
          <div className="notice">
            Reset instructions were prepared for <strong>{email}</strong>.
          </div>
        ) : null}
        <Input
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <div className="auth-primary-actions">
          <Button type="submit">Request reset</Button>
        </div>
      </form>

      <div className="auth-footer">
        <Link href="/signin">Back to sign in</Link>
        <Link href="/support">Support</Link>
      </div>
    </AuthScreen>
  );
}
