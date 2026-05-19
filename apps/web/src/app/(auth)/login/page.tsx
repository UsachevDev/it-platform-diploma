"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const sessionExpired = searchParams.get("expired") === "1";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthShell
      badge="Авторизация"
      title="Вход в систему"
      description="Войдите в аккаунт и продолжите работу с проектами и откликами."
    >
      {sessionExpired ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Сессия истекла. Пожалуйста, войдите заново.
        </div>
      ) : null}

      <LoginForm />
    </AuthShell>
  );
}
