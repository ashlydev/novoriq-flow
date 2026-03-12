"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthScreen } from "@/components/layout/auth-screen";
import { useBusinessOS } from "@/components/shared/business-os-provider";
import { Button, Input } from "@/components/shared/ui";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useBusinessOS();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signUp(form);
    setMessage(result.message);

    if (result.success) {
      router.replace("/app/onboarding");
    }
  }

  return (
    <AuthScreen
      badges={["SME-ready", "Mobile-first", "Premium control"]}
      highlights={[
        {
          title: "Build on structured workflows",
          description:
            "Start with customers, suppliers, invoices, expenses, and operational visibility from day one."
        },
        {
          title: "Grow without rebuilding",
          description:
            "Flow already supports branches, approvals, finance readiness, enterprise controls, and intelligence."
        },
        {
          title: "Stay practical",
          description:
            "Keep the experience clean enough for daily work while the platform scales with the business."
        }
      ]}
      intro="Novoriq Flow is built for SMEs that need daily control over customers, invoices, payments, expenses, suppliers, and unpaid money."
      title="Start a fresh business workspace."
    >
      <div className="auth-form-copy">
        <p className="eyebrow">Create account</p>
        <h2>Set up your access</h2>
        <p className="page-description">
          Create the owner account first, then continue into workspace onboarding.
        </p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        {message ? <div className="notice">{message}</div> : null}
        <Input
          label="Full name"
          onChange={(event) => updateField("fullName", event.target.value)}
          required
          value={form.fullName}
        />
        <Input
          label="Email"
          onChange={(event) => updateField("email", event.target.value)}
          required
          type="email"
          value={form.email}
        />
        <Input
          hint="Use 8 or more characters for the MVP."
          label="Password"
          minLength={8}
          onChange={(event) => updateField("password", event.target.value)}
          required
          type="password"
          value={form.password}
        />
        <div className="auth-primary-actions">
          <Button type="submit">Create account</Button>
        </div>
      </form>

      <div className="auth-footer">
        <Link href="/signin">Already have an account?</Link>
        <Link href="/legal/terms">Terms</Link>
      </div>
    </AuthScreen>
  );
}
