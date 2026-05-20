"use client";

import { CheckCircle2, Circle } from "lucide-react";

import type { AuthUser } from "@/lib/auth/auth-types";

type ProfileCompletenessProps = {
  user: AuthUser;
  onEdit: () => void;
};

export function ProfileCompleteness({
  user,
  onEdit,
}: ProfileCompletenessProps) {
  const checks = [
    { label: "Имя указано", done: Boolean(user.name?.trim()) },
    { label: "Email подтверждён", done: Boolean(user.email) },
    {
      label: "Заполнен раздел «О себе»",
      done: Boolean(user.about?.trim()),
    },
    {
      label: "Добавлены навыки",
      done: (user.skills?.length ?? 0) > 0,
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  const isComplete = doneCount === checks.length;

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Заполненность профиля
          </h2>
          <div className="mt-1 text-2xl font-semibold">{percent}%</div>
        </div>

        {!isComplete ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90"
          >
            Дозаполнить
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Готово
          </span>
        )}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-black transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex items-center gap-2 text-sm"
          >
            {check.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-zinc-300" />
            )}
            <span
              className={
                check.done ? "text-foreground" : "text-muted-foreground"
              }
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
