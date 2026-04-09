import type { ReactNode } from "react";
import {
  ShieldCheck,
  Sparkles,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.12),_transparent_35%),linear-gradient(to_bottom,_#fafafa,_#f5f5f5)]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="hidden items-center lg:flex">
          <div className="w-full space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {badge}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-tight text-foreground">
                Платформа для удобного взаимодействия заказчиков и исполнителей
                IT-проектов
              </h1>

              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                Создавайте проекты, отправляйте отклики, выбирайте исполнителей
                и ведите работу в одном понятном интерфейсе.
              </p>
            </div>

            <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-medium">Проекты</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Публикация и управление жизненным циклом проекта.
                </p>
              </div>

              <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-medium">Отклики</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Быстрая подача отклика и удобный выбор исполнителя.
                </p>
              </div>

              <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-medium">Безопасность</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Авторизация, роли пользователей и защищённые маршруты.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm text-muted-foreground">
              <span className="rounded-full border bg-white px-3 py-1.5">
                NestJS + Prisma
              </span>
              <span className="rounded-full border bg-white px-3 py-1.5">
                Next.js + TypeScript
              </span>
              <span className="rounded-full border bg-white px-3 py-1.5">
                PostgreSQL + JWT
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              Нет желания входить сразу?{" "}
              <Link
                href="/"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Вернуться на главную
              </Link>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[32px] border border-black/5 bg-white/90 p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)] backdrop-blur sm:p-8">
            <div className="mb-8 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                {badge}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
