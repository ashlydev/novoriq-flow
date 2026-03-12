"use client";

import { useState } from "react";
import { Button } from "@/components/shared/ui";
import { usePwa } from "@/components/shared/pwa-provider";

export function InstallButton() {
  const { canInstall, isInstalled, isPrompting, isStandalone, promptInstall } =
    usePwa();
  const [message, setMessage] = useState("");

  if (!canInstall || isInstalled || isStandalone) {
    return null;
  }

  return (
    <div className="auth-install-card">
      <div>
        <p className="eyebrow">Install app</p>
        <h3>Add Novoriq Flow to this device</h3>
        <p className="page-description auth-install-copy">
          Open the workspace from the home screen with a cleaner, app-like shell and
          faster resume.
        </p>
      </div>

      <div className="auth-install-actions">
        <Button
          kind="secondary"
          onClick={async () => {
            const installed = await promptInstall();
            if (!installed) {
              setMessage("Install was dismissed. The button will reappear when the browser offers it again.");
            }
          }}
          type="button"
        >
          {isPrompting ? "Opening install prompt..." : "Install Novoriq Flow"}
        </Button>
        {message ? <p className="install-helper">{message}</p> : null}
      </div>
    </div>
  );
}
