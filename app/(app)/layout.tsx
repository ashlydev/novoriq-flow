import { ProtectedAppLayout } from "@/components/layout/protected-app-layout";

export default function AppGroupLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
