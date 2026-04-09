import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <section className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
        <Construction className="h-6 w-6" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-8 rounded-3xl border bg-zinc-50 p-5">
        <div className="text-sm font-medium">Что уже есть сейчас</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>— Авторизация и регистрация</li>
          <li>— Защищённые маршруты</li>
          <li>— Базовый каркас интерфейса</li>
          <li>— Подготовленная навигация под следующие эпики</li>
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm text-white transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться в кабинет
        </Link>
      </div>
    </section>
  );
}
