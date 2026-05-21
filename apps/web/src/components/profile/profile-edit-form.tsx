"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, X } from "lucide-react";

import { SkillsInput } from "@/components/profile/skills-input";
import { updateMeRequest } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { AuthUser } from "@/lib/auth/auth-types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/providers/auth-provider";

type FormErrors = Partial<{
  name: string;
  about: string;
}>;

type ProfileEditFormProps = {
  user: AuthUser;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProfileEditForm({
  user,
  onCancel,
  onSaved,
}: ProfileEditFormProps) {
  const queryClient = useQueryClient();
  const { refreshMe } = useAuth();

  const [name, setName] = useState(user.name ?? "");
  const [about, setAbout] = useState(user.about ?? "");
  const [skills, setSkills] = useState<string[]>(user.skills ?? []);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: updateMeRequest,
    onSuccess: async (data) => {
      queryClient.setQueryData(["users", "me"], data);
      await refreshMe();
      showSuccessToast("Профиль обновлён");
      onSaved();
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось обновить профиль"));
    },
  });

  function validate(): FormErrors {
    const next: FormErrors = {};
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      next.name = "Имя должно содержать минимум 2 символа.";
    } else if (trimmedName.length > 120) {
      next.name = "Имя не длиннее 120 символов.";
    }

    if (about.trim().length > 1000) {
      next.about = "Описание не длиннее 1000 символов.";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const trimmedAbout = about.trim();

    mutation.mutate({
      name: name.trim(),
      about: trimmedAbout.length === 0 ? null : trimmedAbout,
      skills,
    });
  }

  const isSubmitting = mutation.isPending;

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm font-medium">
          Имя
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black"
        />
        {errors.name ? (
          <p className="text-xs text-red-600">{errors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-about" className="text-sm font-medium">
          О себе
        </label>
        <textarea
          id="profile-about"
          rows={5}
          value={about}
          onChange={(event) => setAbout(event.target.value)}
          placeholder="Расскажите про опыт, специализацию и интересы"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
        />
        {errors.about ? (
          <p className="text-xs text-red-600">{errors.about}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {about.trim().length} / 1000
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-skills" className="text-sm font-medium">
          Навыки
        </label>
        <SkillsInput id="profile-skills" value={skills} onChange={setSkills} />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Сохраняем..." : "Сохранить"}
          {!isSubmitting ? <Save className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}
