"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { SelectMenu } from "@/components/common/select-menu";
import { getCategoriesRequest } from "@/lib/api/categories";
import { createProjectRequest } from "@/lib/api/projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type FormErrors = Partial<{
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
}>;

export function CreateProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesRequest,
    staleTime: 5 * 60_000,
  });

  const categoryOptions = [
    { value: "", label: "Без категории" },
    ...(categories ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const mutation = useMutation({
    mutationFn: createProjectRequest,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showSuccessToast("Проект создан");
      router.push(`/projects/${project.id}`);
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error, "Не удалось создать проект"));
    },
  });

  function validate(): FormErrors {
    const next: FormErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 3) {
      next.title = "Название должно содержать минимум 3 символа.";
    } else if (trimmedTitle.length > 120) {
      next.title = "Название не должно превышать 120 символов.";
    }

    if (trimmedDescription.length < 10) {
      next.description = "Описание должно содержать минимум 10 символов.";
    } else if (trimmedDescription.length > 5000) {
      next.description = "Описание не должно превышать 5000 символов.";
    }

    const min = Number(budgetMin);
    const max = Number(budgetMax);

    if (budgetMin === "" || !Number.isFinite(min) || min < 0) {
      next.budgetMin = "Укажите минимальный бюджет (≥ 0).";
    }

    if (budgetMax === "" || !Number.isFinite(max) || max < 0) {
      next.budgetMax = "Укажите максимальный бюджет (≥ 0).";
    }

    if (!next.budgetMin && !next.budgetMax && max < min) {
      next.budgetMax = "Максимум не может быть меньше минимума.";
    }

    return next;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validate();
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      categoryId: categoryId || undefined,
    });
  }

  const isSubmitting = mutation.isPending;

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="project-title" className="text-sm font-medium">
          Название проекта
        </label>
        <input
          id="project-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например, Разработка MVP веб-платформы"
          className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
        />
        {errors.title ? (
          <p className="text-xs text-red-600">{errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="project-description" className="text-sm font-medium">
          Описание
        </label>
        <textarea
          id="project-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Опишите задачу, требования к исполнителю и ожидаемый результат"
          rows={6}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
        />
        {errors.description ? (
          <p className="text-xs text-red-600">{errors.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {description.trim().length} / 5000
          </p>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Категория</span>
        <SelectMenu
          ariaLabel="Категория проекта"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="project-budget-min" className="text-sm font-medium">
            Бюджет от, ₽
          </label>
          <input
            id="project-budget-min"
            type="number"
            inputMode="numeric"
            min={0}
            value={budgetMin}
            onChange={(event) => setBudgetMin(event.target.value)}
            placeholder="30000"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
          />
          {errors.budgetMin ? (
            <p className="text-xs text-red-600">{errors.budgetMin}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="project-budget-max" className="text-sm font-medium">
            Бюджет до, ₽
          </label>
          <input
            id="project-budget-max"
            type="number"
            inputMode="numeric"
            min={0}
            value={budgetMax}
            onChange={(event) => setBudgetMax(event.target.value)}
            placeholder="70000"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
          />
          {errors.budgetMax ? (
            <p className="text-xs text-red-600">{errors.budgetMax}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 text-sm transition hover:bg-black/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Отмена
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Создаём..." : "Создать проект"}
          {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}
