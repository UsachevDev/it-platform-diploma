"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FolderKanban,
  ShieldCheck,
  Users,
  MessageSquareMore,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

const features = [
  {
    icon: FolderKanban,
    title: "Публикация проектов",
    description:
      "Создавайте проекты с описанием задачи, бюджета и ожидаемых сроков.",
  },
  {
    icon: MessageSquareMore,
    title: "Отклики исполнителей",
    description:
      "Исполнители отправляют предложения с ценой, сроками и сопроводительным сообщением.",
  },
  {
    icon: Users,
    title: "Выбор исполнителя",
    description:
      "Сравнивайте отклики и выбирайте подходящего специалиста для работы над проектом.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Управление процессом",
    description:
      "Следите за статусами проекта и двигайтесь от публикации до завершения работы.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасный доступ",
    description:
      "Ролевая модель, авторизация и защищённые маршруты для разных типов пользователей.",
  },
  {
    icon: CheckCircle2,
    title: "Понятный интерфейс",
    description:
      "Чистая навигация и удобный пользовательский сценарий без перегруженного интерфейса.",
  },
];

export default function HomePage() {
  const { user, isLoading } = useAuth();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.10),_transparent_30%),linear-gradient(to_bottom,_#fafafa,_#f4f4f5)]">
      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <header className="relative z-20 flex items-center justify-between gap-4 rounded-full border border-black/5 bg-white/85 px-5 py-4 shadow-sm backdrop-blur">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
              IT
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                IT Platform
              </div>
              <div className="truncate text-xs text-muted-foreground">
                Платформа для заказчиков и исполнителей
              </div>
            </div>
          </Link>

          <div className="relative z-30 flex shrink-0 items-center gap-2">
            {!isLoading && user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90"
              >
                Перейти в кабинет
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
                >
                  Войти
                </Link>

                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90"
                >
                  Создать аккаунт
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </header>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 lg:px-8 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
              Удобная работа с IT-проектами в одном интерфейсе
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Найдите исполнителя или проект без лишнего хаоса
              </h1>

              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Заказчики публикуют проекты, исполнители отправляют отклики, а
                платформа помогает быстро организовать взаимодействие, выбрать
                подходящего специалиста и вести работу дальше.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3">
              {!isLoading && user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm text-white transition hover:opacity-90"
                >
                  Открыть кабинет
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm text-white transition hover:opacity-90"
                  >
                    Создать аккаунт
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full border bg-white px-6 text-sm transition hover:bg-black hover:text-white"
                  >
                    Уже есть аккаунт
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border bg-white px-4 py-2">
                Заказчики
              </span>
              <span className="rounded-full border bg-white px-4 py-2">
                Исполнители
              </span>
              <span className="rounded-full border bg-white px-4 py-2">
                Проекты
              </span>
              <span className="rounded-full border bg-white px-4 py-2">
                Отклики
              </span>
            </div>
          </div>

          <div className="rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Как это работает</div>
                <div className="text-sm text-muted-foreground">
                  Простой сценарий взаимодействия внутри платформы
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                "Заказчик создаёт проект",
                "Исполнители отправляют отклики",
                "Заказчик выбирает подходящего кандидата",
                "Проект переходит в работу",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-2xl border border-black/5 bg-zinc-50 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm text-white">
                    {index + 1}
                  </div>
                  <div className="pt-1 text-sm text-foreground">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            Возможности платформы
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Всё, что нужно для удобного взаимодействия между заказчиками и
            исполнителями.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-medium">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
