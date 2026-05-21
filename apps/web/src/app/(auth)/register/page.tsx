"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
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
      badge="Регистрация"
      title="Создание аккаунта"
      description="Заполните данные и начните работу на платформе."
    >
      <RegisterForm />
    </AuthShell>
  );
}
