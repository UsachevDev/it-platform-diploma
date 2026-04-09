import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">IT Projects Platform</h1>
      <p className="max-w-xl text-center text-muted-foreground">
        Веб-платформа для взаимодействия заказчиков и исполнителей IT-проектов
      </p>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    </main>
  );
}
