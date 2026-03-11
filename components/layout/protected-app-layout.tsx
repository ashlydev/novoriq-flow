"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useBusinessOS } from "@/components/shared/business-os-provider";

export function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, currentUser, hasWorkspace } = useBusinessOS();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!currentUser) {
      router.replace("/signin");
      return;
    }

    if (!hasWorkspace && pathname !== "/app/onboarding") {
      router.replace("/app/onboarding");
      return;
    }

    if (hasWorkspace && pathname === "/app/onboarding") {
      router.replace("/app/dashboard");
    }
  }, [currentUser, hasWorkspace, isHydrated, pathname, router]);

  if (!isHydrated) {
    return <div className="splash-screen">Loading your workspace...</div>;
  }

  if (!currentUser) {
    return <div className="splash-screen">Redirecting to sign in...</div>;
  }

  if (!hasWorkspace && pathname !== "/app/onboarding") {
    return <div className="splash-screen">Preparing onboarding...</div>;
  }

  if (pathname === "/app/onboarding") {
    return <div className="onboarding-shell">{children}</div>;
  }

  return <AppShell>{children}</AppShell>;
}
