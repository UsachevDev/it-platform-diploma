"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FolderKanban,
  Plus,
  UserRound,
} from "lucide-react";
import { LatestProjects } from "@/components/dashboard/latest-projects";
import { PlatformStats } from "@/components/dashboard/platform-stats";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  const isCustomer = user?.role === "CUSTOMER";

  const quickActions = isCustomer
    ? [
        {
          title: "Создать проект",
          description: "Опубликуйте новую задачу для исполнителей.",
          href: "/projects/create",
          icon: Plus,
        },
        {
          title: "Мои проекты",
          description: "Проекты, которые вы создали.",
          href: "/projects?mine=1",
          icon: FolderKanban,
        },
        {
          title: "Профиль",
          description: "Личные данные и описание аккаунта.",
          href: "/profile",
          icon: UserRound,
        },
      ]
    : [
        {
          title: "Найти проекты",
          description: "Открыть каталог задач и отправить отклик.",
          href: "/projects",
          icon: FolderKanban,
        },
        {
          title: "Мои проекты",
          description: "Задачи, где вы выбраны исполнителем.",
          href: "/projects?mine=1",
          icon: BriefcaseBusiness,
        },
        {
          title: "Я откликнулся",
          description: "Проекты, на которые вы отправили отклик.",
          href: "/projects?responded=1",
          icon: BriefcaseBusiness,
        },
      ];

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm lg:p-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Добро пожаловать, {user?.name || "пользователь"}
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          {isCustomer
            ? "Создавайте проекты, выбирайте исполнителей и следите за прогрессом."
            : "Находите проекты, отправляйте отклики и берите задачи в работу."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <div className="rounded-full border bg-zinc-50 px-4 py-1.5">
            Роль:{" "}
            <span className="font-medium">{getRoleLabel(user?.role)}</span>
          </div>
          <div className="rounded-full border bg-zinc-50 px-4 py-1.5">
            Email: <span className="font-medium">{user?.email}</span>
          </div>
        </div>
      </section>

      <PlatformStats />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Быстрые действия
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-[28px] border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-medium">{action.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {action.description}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                  Открыть
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <LatestProjects />
    </div>
  );
}
