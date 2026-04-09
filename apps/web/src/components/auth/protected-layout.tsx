"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(to_bottom,_#fafafa,_#f4f4f5)]">
        <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-3 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Проверяем сессию...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
