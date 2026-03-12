import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { BusinessOSProvider } from "@/components/shared/business-os-provider";
import { FlowV3Provider } from "@/components/shared/flow-v3-provider";
import { FlowV4Provider } from "@/components/shared/flow-v4-provider";
import { FlowV5Provider } from "@/components/shared/flow-v5-provider";
import { FlowV6Provider } from "@/components/shared/flow-v6-provider";
import { FlowV7Provider } from "@/components/shared/flow-v7-provider";
import { PwaProvider } from "@/components/shared/pwa-provider";

export const metadata: Metadata = {
  title: "Novoriq Flow",
  description:
    "Run operations, network business relationships, finance-readiness workflows, enterprise controls, and intelligent automation with confidence.",
  applicationName: "Novoriq Flow",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/flow-icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icons/flow-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"]
  },
  appleWebApp: {
    capable: true,
    title: "Novoriq Flow",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#132226"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaProvider>
          <BusinessOSProvider>
            <FlowV3Provider>
              <FlowV4Provider>
                <FlowV5Provider>
                  <FlowV6Provider>
                    <FlowV7Provider>{children}</FlowV7Provider>
                  </FlowV6Provider>
                </FlowV5Provider>
              </FlowV4Provider>
            </FlowV3Provider>
          </BusinessOSProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
