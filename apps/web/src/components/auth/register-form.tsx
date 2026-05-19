"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { UserRole } from "@/lib/auth/auth-types";
import { useAuth } from "@/providers/auth-provider";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (normalizedName.length < 2) {
      return "Имя должно содержать минимум 2 символа.";
    }

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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      router.push("/dashboard");
    } catch (submitError) {
      setError(
        getApiErrorMessage(submitError, "Не удалось зарегистрироваться."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="register-name" className="text-sm font-medium">
          Имя
        </label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Илья"
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="register-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="register-password" className="text-sm font-medium">
          Пароль
        </label>

        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 6 символов"
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

      <div className="space-y-3">
        <div className="text-sm font-medium">Роль</div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("CUSTOMER")}
            className={`rounded-2xl border px-4 py-3 text-sm transition ${
              role === "CUSTOMER"
                ? "border-black bg-black text-white"
                : "border-black/10 bg-white text-foreground hover:bg-black/5"
            }`}
          >
            Заказчик
          </button>

          <button
            type="button"
            onClick={() => setRole("CONTRACTOR")}
            className={`rounded-2xl border px-4 py-3 text-sm transition ${
              role === "CONTRACTOR"
                ? "border-black bg-black text-white"
                : "border-black/10 bg-white text-foreground hover:bg-black/5"
            }`}
          >
            Исполнитель
          </button>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Заказчик создаёт проекты. Исполнитель отправляет отклики на
          опубликованные задачи.
        </p>
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
        {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
        {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
      </button>

      <div className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Войти
        </Link>
      </div>
    </form>
  );
}
