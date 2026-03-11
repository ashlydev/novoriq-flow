"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Button, Input } from "@/components/shared/ui";
import { demoAccounts, demoCredentials } from "@/lib/seed";

export default function SignInPage() {
  const router = useRouter();
  const { currentUser, hasWorkspace, isHydrated, signIn } = useBusinessOS();
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isHydrated || !currentUser) {
      return;
    }

    router.replace(hasWorkspace ? "/app/dashboard" : "/app/onboarding");
  }, [currentUser, hasWorkspace, isHydrated, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signIn({ email, password });
    setMessage(result.message);

    if (result.success) {
      router.replace("/app");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Sign in</p>
        <h1>Welcome back to Novoriq Flow.</h1>
        <p>
          Access your mobile-first workspace for branches, approvals, invoices,
          expenses, stock alerts, and daily business control.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          {message ? <div className="notice">{message}</div> : null}
          <Input
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
          <Input
            label="Password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          <Button type="submit">Sign in</Button>
        </form>
        <div className="notice" style={{ marginTop: 16 }}>
          Default demo: <strong>{demoCredentials.email}</strong> /{" "}
          <strong>{demoCredentials.password}</strong>
          <br />
          Other demo roles:{" "}
          {demoAccounts
            .map((account) => `${account.role} ${account.email}`)
            .join(" · ")}
        </div>
        <div className="auth-footer" style={{ marginTop: 18 }}>
          <Link href="/signup">Create an account</Link>
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/legal/privacy">Privacy</Link>
        </div>
      </div>
    </div>
  );
}
