"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Save } from "lucide-react";

import { PasswordStrength } from "@/components/common/password-strength";
import { updatePasswordRequest } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/api/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type FormErrors = Partial<{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}>;

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: updatePasswordRequest,
    onSuccess: () => {
      showSuccessToast("Пароль обновлён");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось сменить пароль"));
    },
  });

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!currentPassword) next.currentPassword = "Введите текущий пароль.";
    if (!newPassword) {
      next.newPassword = "Введите новый пароль.";
    } else if (newPassword.length < 6) {
      next.newPassword = "Минимум 6 символов.";
    } else if (newPassword === currentPassword) {
      next.newPassword = "Новый пароль должен отличаться от текущего.";
    }

    if (newPassword !== confirmPassword) {
      next.confirmPassword = "Пароли не совпадают.";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    mutation.mutate({ currentPassword, newPassword });
  }

  const isSubmitting = mutation.isPending;

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="pw-current"
        label="Текущий пароль"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showCurrent}
        onToggle={() => setShowCurrent((p) => !p)}
        error={errors.currentPassword}
      />

      <div className="space-y-2">
        <PasswordField
          id="pw-new"
          label="Новый пароль"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((p) => !p)}
          error={errors.newPassword}
          placeholder="Минимум 6 символов"
        />
        <PasswordStrength password={newPassword} />
      </div>

      <PasswordField
        id="pw-confirm"
        label="Повторите новый пароль"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showNew}
        onToggle={() => setShowNew((p) => !p)}
        error={errors.confirmPassword}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Сохраняем..." : "Сменить пароль"}
          {!isSubmitting ? <Save className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  placeholder?: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  placeholder,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-12 text-sm outline-none transition focus:border-black"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label="Показать пароль"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
