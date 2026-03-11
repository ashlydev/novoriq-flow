"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusinessOS } from "@/components/shared/business-os-provider";

export default function AppIndexPage() {
  const router = useRouter();
  const { isHydrated, hasWorkspace } = useBusinessOS();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    router.replace(hasWorkspace ? "/app/dashboard" : "/app/onboarding");
  }, [hasWorkspace, isHydrated, router]);

  return <div className="splash-screen">Loading your workspace...</div>;
}
