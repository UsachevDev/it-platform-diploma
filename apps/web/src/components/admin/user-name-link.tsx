"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type UserNameLinkProps = {
  userId?: string | null;
  name: string;
  className?: string;
};

/**
 * Показывает имя пользователя. Для администратора — кликабельная ссылка
 * на карточку пользователя в админке (быстрый переход к модерации).
 */
export function UserNameLink({ userId, name, className }: UserNameLinkProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  if (isAdmin && userId) {
    return (
      <Link
        href={`/admin/users/${userId}`}
        className={cn(
          "inline-flex items-center gap-1 underline-offset-2 transition hover:underline",
          className,
        )}
      >
        {name}
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
      </Link>
    );
  }

  return <span className={className}>{name}</span>;
}
