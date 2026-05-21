"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { CreateProjectForm } from "@/components/projects/create-project-form";
import { useAuth } from "@/providers/auth-provider";

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== "CUSTOMER") {
      router.replace("/projects");
    }
  }, [user, router]);

  if (!user || user.role !== "CUSTOMER") {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />К списку проектов
        </Link>

        <h1 className="text-2xl font-semibold">Создать проект</h1>
        <p className="text-sm text-muted-foreground">
          Опишите задачу, чтобы исполнители могли отправить отклик
        </p>
      </div>

      <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <CreateProjectForm />
      </div>
    </div>
  );
}
