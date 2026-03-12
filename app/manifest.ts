import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Novoriq Flow",
    short_name: "Flow",
    description:
      "Run operations, receivables, payables, approvals, finance readiness, and intelligent business workflows from one premium mobile-first workspace.",
    start_url: "/signin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f0e5",
    theme_color: "#132226",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icons/flow-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/flow-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
