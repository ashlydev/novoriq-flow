"use client";

import { Capacitor } from "@capacitor/core";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type PwaContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isSupported: boolean;
  isPrompting: boolean;
  promptInstall: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function getStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    return true;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standalone = getStandaloneMode();
    const native = Capacitor.isNativePlatform();
    setIsStandalone(standalone);
    setIsInstalled(standalone);
    setIsSupported("serviceWorker" in navigator && !native);
    document.documentElement.dataset.displayMode = standalone ? "standalone" : "browser";

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const updateStandaloneState = () => {
      const nextStandalone = getStandaloneMode();
      setIsStandalone(nextStandalone);
      setIsInstalled(nextStandalone);
      document.documentElement.dataset.displayMode = nextStandalone
        ? "standalone"
        : "browser";
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (getStandaloneMode()) {
        return;
      }

      setDeferredPrompt(event as DeferredInstallPrompt);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsStandalone(true);
      document.documentElement.dataset.displayMode = "standalone";
    };

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if ("serviceWorker" in navigator && !native) {
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker, { once: true });
      }
    }

    mediaQuery.addEventListener?.("change", updateStandaloneState);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
      mediaQuery.removeEventListener?.("change", updateStandaloneState);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt || isStandalone || isInstalled) {
      return false;
    }

    setIsPrompting(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      const accepted = choice.outcome === "accepted";
      setDeferredPrompt(null);
      if (accepted) {
        setIsInstalled(true);
        setIsStandalone(true);
      }
      return accepted;
    } catch {
      setDeferredPrompt(null);
      return false;
    } finally {
      setIsPrompting(false);
    }
  }

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt) && !isInstalled && !isStandalone,
      isInstalled,
      isStandalone,
      isSupported,
      isPrompting,
      promptInstall
    }),
    [deferredPrompt, isInstalled, isPrompting, isStandalone, isSupported]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within PwaProvider");
  }

  return context;
}
