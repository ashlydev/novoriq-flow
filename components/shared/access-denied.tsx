"use client";

import Link from "next/link";
import { EmptyState } from "@/components/shared/ui";

export function AccessDeniedState({
  title = "Access restricted",
  description = "Your role does not have access to this area of Novoriq Flow.",
  href = "/app/dashboard",
  actionLabel = "Back to dashboard"
}: {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <EmptyState
      action={
        <Link className="button button-primary" href={href}>
          {actionLabel}
        </Link>
      }
      description={description}
      title={title}
    />
  );
}
