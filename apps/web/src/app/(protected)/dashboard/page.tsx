"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FolderKanban,
  Plus,
  UserRound,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getRoleLabel } from "@/lib/auth/role-labels";
import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  const isCustomer = user?.role === "CUSTOMER";

  const quickActions = isCustomer
    ? [
        {
          title: "Создать проект",
          description: "Подготовить новую задачу для исполнителей.",
          href: "/projects/create",
          icon: Plus,
        },
        {
          title: "Мои проекты",
          description: "Посмотреть текущие и будущие публикации.",
          href: "/projects",
          icon: FolderKanban,
        },
        {
          title: "Профиль",
          description: "Проверить личные данные и описание аккаунта.",
          href: "/profile",
          icon: UserRound,
        },
      ]
    : [
        {
          title: "Найти проекты",
          description: "Открыть каталог задач для отклика.",
          href: "/projects",
          icon: FolderKanban,
        },
        {
          title: "Мои отклики",
          description: "Посмотреть отправленные отклики и статусы.",
          href: "/bids",
          icon: BriefcaseBusiness,
        },
        {
          title: "Профиль",
          description: "Проверить свои данные и навыки.",
          href: "/profile",
          icon: UserRound,
        },
      ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-sm">
        <div className="grid gap-6 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Личный кабинет пользователя
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">
                Добро пожаловать, {user?.name || "пользователь"}
              </h1>

              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Здесь начинается работа внутри платформы. Отсюда можно перейти к
                проектам, откликам, профилю и следующим экранам MVP.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-full border bg-zinc-50 px-4 py-2">
                Роль:{" "}
                <span className="font-medium">{getRoleLabel(user?.role)}</span>
              </div>
              <div className="rounded-full border bg-zinc-50 px-4 py-2">
                Email: <span className="font-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border bg-zinc-50 p-6">
            <div className="mb-5 text-sm font-medium">Состояние кабинета</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Авторизация
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Активна
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
                <span className="text-sm text-muted-foreground">Навигация</span>
                <span className="text-sm font-medium">Готова</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Следующий шаг
                </span>
                <span className="text-sm font-medium">
                  {isCustomer ? "Работа с проектами" : "Работа с откликами"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Текущий статус</div>
          <div className="mt-2 text-3xl font-semibold">MVP</div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Авторизация и базовая оболочка интерфейса уже работают.
          </p>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Активный пользователь
          </div>
          <div className="mt-2 text-3xl font-semibold">
            {getRoleLabel(user?.role)}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Интерфейс готов показывать разные пользовательские сценарии.
          </p>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Точка входа</div>
          <div className="mt-2 text-3xl font-semibold">Кабинет</div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Теперь после входа пользователь попадает на понятную стартовую
            страницу.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Быстрые действия
          </h2>
          <p className="text-sm text-muted-foreground">
            Основные переходы внутри интерфейса на ближайшие этапы разработки.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-[28px] border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{action.title}</h3>
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
    </div>
  );
}
