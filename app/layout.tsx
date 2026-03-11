import type { Metadata } from "next";
import "@/app/globals.css";
import { BusinessOSProvider } from "@/components/shared/business-os-provider";
import { FlowV3Provider } from "@/components/shared/flow-v3-provider";
import { FlowV4Provider } from "@/components/shared/flow-v4-provider";
import { FlowV5Provider } from "@/components/shared/flow-v5-provider";
import { FlowV6Provider } from "@/components/shared/flow-v6-provider";
import { FlowV7Provider } from "@/components/shared/flow-v7-provider";

export const metadata: Metadata = {
  title: "Novoriq Flow",
  description:
    "Run operations, network business relationships, finance-readiness workflows, enterprise controls, and intelligent automation with confidence."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
