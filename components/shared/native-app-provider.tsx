"use client";

import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();

    StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    StatusBar.setBackgroundColor({ color: "#132226" }).catch(() => undefined);
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
    Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => undefined);
    SplashScreen.hide().catch(() => undefined);

    return () => {
      delete document.documentElement.dataset.nativePlatform;
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || !link.href) {
        return;
      }

      const rawHref = link.getAttribute("href") || "";
      if (
        rawHref.startsWith("/") ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin) {
          return;
        }

        event.preventDefault();
        void Browser.open({ url: url.toString() });
      } catch {
        return;
      }
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    let active = true;

    const listener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (!active) {
        return;
      }

      const exitRoutes = new Set(["/signin", "/app", "/app/dashboard"]);

      if (canGoBack && !exitRoutes.has(pathname) && window.history.length > 1) {
        window.history.back();
        return;
      }

      if (pathname !== "/app/dashboard" && pathname !== "/app" && pathname !== "/signin") {
        router.push(pathname.startsWith("/app") ? "/app/dashboard" : "/signin");
        return;
      }

      CapacitorApp.exitApp();
    });

    return () => {
      active = false;
      void listener.then((handle) => handle.remove());
    };
  }, [pathname, router]);

  return <>{children}</>;
}
