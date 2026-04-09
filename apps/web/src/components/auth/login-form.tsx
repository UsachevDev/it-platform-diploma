"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { isAxiosError } from "axios";
import { useAuth } from "@/providers/auth-provider";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return "Введите email.";
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return "Введите корректный email.";
    }

    if (!password) {
      return "Введите пароль.";
    }

    if (password.length < 6) {
      return "Пароль должен содержать минимум 6 символов.";
    }

    return "";
  }

  function getApiErrorMessage(error: unknown) {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message;

      if (Array.isArray(message) && message.length > 0) {
        return String(message[0]);
      }

      if (typeof message === "string") {
        return message;
      }
    }

    return "Не удалось войти. Проверьте email и пароль.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      router.push("/dashboard");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="login-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="login-password" className="text-sm font-medium">
          Пароль
        </label>

        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-2 text-zinc-500 transition hover:bg-black/5 hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Входим..." : "Войти"}
        {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      <div className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Зарегистрироваться
        </Link>
      </div>
    </form>
  );
}
