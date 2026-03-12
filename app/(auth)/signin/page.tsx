"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InstallButton } from "@/components/auth/install-button";
import { AuthScreen } from "@/components/layout/auth-screen";
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
    <AuthScreen
      badges={[
        "Mobile-first control",
        "Installable workspace",
        "Receivables and operations"
      ]}
      highlights={[
        {
          title: "Run the business from one place",
          description:
            "Keep invoices, purchases, receivables, approvals, and day-to-day control in one workspace."
        },
        {
          title: "Stay owner-ready",
          description:
            "Track branch performance, tasks, finance readiness, and alerts without losing operational clarity."
        },
        {
          title: "Install like a real app",
          description:
            "Add Flow to the home screen for a cleaner, faster, app-like launch experience on supported devices."
        }
      ]}
      intro="Access your mobile-first workspace for branches, approvals, invoices, expenses, stock alerts, and daily business control."
      title="Welcome back to Novoriq Flow."
    >
      <div className="auth-form-copy">
        <p className="eyebrow">Sign in</p>
        <h2>Open your workspace</h2>
        <p className="page-description">
          Use the demo account or your existing login to continue where operations,
          finance, network workflows, and intelligence all meet.
        </p>
      </div>

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
        <div className="auth-primary-actions">
          <Button type="submit">Sign in</Button>
        </div>
      </form>

      <InstallButton />

      <div className="notice">
        Default demo: <strong>{demoCredentials.email}</strong> /{" "}
        <strong>{demoCredentials.password}</strong>
        <br />
        Other demo roles:{" "}
        {demoAccounts
          .map((account) => `${account.role} ${account.email}`)
          .join(" · ")}
      </div>

      <div className="auth-footer">
        <Link href="/signup">Create an account</Link>
        <Link href="/forgot-password">Forgot password</Link>
        <Link href="/legal/privacy">Privacy</Link>
      </div>
    </AuthScreen>
  );
}
