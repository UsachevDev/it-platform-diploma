"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Save } from "lucide-react";

import { updateEmailRequest } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/api/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/providers/auth-provider";

type FormErrors = Partial<{ newEmail: string; currentPassword: string }>;

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const queryClient = useQueryClient();
  const { refreshMe } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: updateEmailRequest,
    onSuccess: async (data) => {
      queryClient.setQueryData(["users", "me"], data);
      await refreshMe();
      showSuccessToast("Email обновлён");
      setNewEmail("");
      setCurrentPassword("");
      setErrors({});
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось сменить email"));
    },
  });

  function validate(): FormErrors {
    const next: FormErrors = {};
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      next.newEmail = "Введите новый email.";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      next.newEmail = "Введите корректный email.";
    } else if (trimmed === currentEmail.toLowerCase()) {
      next.newEmail = "Новый email совпадает с текущим.";
    }

    if (!currentPassword) {
      next.currentPassword = "Введите текущий пароль для подтверждения.";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    mutation.mutate({
      newEmail: newEmail.trim().toLowerCase(),
      currentPassword,
    });
  }

  const isSubmitting = mutation.isPending;

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="new-email" className="text-sm font-medium">
          Новый email
        </label>
        <input
          id="new-email"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          placeholder={currentEmail}
          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black"
        />
        {errors.newEmail ? (
          <p className="text-xs text-red-600">{errors.newEmail}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="email-current-password" className="text-sm font-medium">
          Текущий пароль
        </label>
        <div className="relative">
          <input
            id="email-current-password"
            type={showPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Подтвердите паролем"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-12 text-sm outline-none transition focus:border-black"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label="Показать пароль"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.currentPassword ? (
          <p className="text-xs text-red-600">{errors.currentPassword}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Сохраняем..." : "Сменить email"}
          {!isSubmitting ? <Save className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}
