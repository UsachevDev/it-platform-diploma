import { ProtectedLayout } from "@/components/auth/protected-layout";
import { ProtectedAppShell } from "@/components/layout/protected-app-shell";

export default function ProtectedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout>
      <ProtectedAppShell>{children}</ProtectedAppShell>
    </ProtectedLayout>
  );
}
