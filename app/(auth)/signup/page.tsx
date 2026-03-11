"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Create account</p>
        <h1>Start a fresh business workspace.</h1>
        <p>
          Novoriq Flow is built for SMEs that need daily control over customers,
          invoices, payments, expenses, suppliers, and unpaid money.
        </p>
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
          <Button type="submit">Create account</Button>
        </form>
        <div className="auth-footer" style={{ marginTop: 18 }}>
          <Link href="/signin">Already have an account?</Link>
          <Link href="/legal/terms">Terms</Link>
        </div>
      </div>
    </div>
  );
}
