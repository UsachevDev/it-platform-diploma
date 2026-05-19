"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Mail, Pencil, UserRound } from "lucide-react";

import { ErrorState } from "@/components/common/error-state";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { ProfileStats } from "@/components/profile/profile-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { getMeRequest } from "@/lib/api/users";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { formatDate } from "@/lib/format";

export function ProfileView() {
  const [isEditing, setIsEditing] = useState(false);

  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", "me"],
    queryFn: getMeRequest,
  });

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !user) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const initial = (user.name ?? "?").charAt(0).toUpperCase();
  const skills = user.skills ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-[32px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-2xl font-semibold text-white">
              {initial}
            </div>

            <div>
              <h1 className="text-2xl font-semibold">{user.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" />
                  {getRoleLabel(user.role)}
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                {user.createdAt ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />С нами с{" "}
                      {formatDate(user.createdAt)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black hover:text-white"
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </button>
          ) : null}
        </div>

        <div className="mt-8">
          {isEditing ? (
            <ProfileEditForm
              user={user}
              onCancel={() => setIsEditing(false)}
              onSaved={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  О себе
                </h2>
                {user.about ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/90">
                    {user.about}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Пока ничего не рассказано. Заполните, чтобы заказчики и
                    исполнители знали о вас больше.
                  </p>
                )}
              </section>

              <section>
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Навыки
                </h2>
                {skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-black/5 px-3 py-1 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Список навыков пуст.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {!isEditing ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Статистика
          </h2>
          <ProfileStats role={user.role} />
        </section>
      ) : null}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[32px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
