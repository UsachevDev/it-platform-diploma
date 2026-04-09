"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

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
      <LoginForm />
    </AuthShell>
  );
}
