"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input } from "@/components/shared/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Password reset</p>
        <h1>Request a reset link.</h1>
        <p>
          For the current demo build, the flow is stubbed for readiness. In production this
          page would trigger a secure email reset workflow.
        </p>
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
          <Button type="submit">Request reset</Button>
        </form>
        <div className="auth-footer" style={{ marginTop: 18 }}>
          <Link href="/signin">Back to sign in</Link>
          <Link href="/support">Support</Link>
        </div>
      </div>
    </div>
  );
}
