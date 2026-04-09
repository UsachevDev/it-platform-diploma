"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BriefcaseBusiness,
  UserRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { getRoleLabel } from "@/lib/auth/role-labels";

const navItems = [
  {
    href: "/dashboard",
    label: "Главная",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "Проекты",
    icon: FolderKanban,
  },
  {
    href: "/bids",
    label: "Отклики",
    icon: BriefcaseBusiness,
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: UserRound,
  },
];

export function ProtectedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,_#fafafa,_#f4f4f5)]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white shadow-sm"
            >
              IT
            </Link>

            <div>
              <div className="text-sm font-semibold">IT Platform MVP</div>
              <div className="text-xs text-muted-foreground">
                Панель управления платформой
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-black text-white"
                      : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border bg-white px-3 py-2 text-right sm:block">
              <div className="max-w-[180px] truncate text-sm font-medium">
                {user?.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {getRoleLabel(user?.role)}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition hover:bg-black hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 md:hidden lg:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-black text-white"
                    : "border bg-white text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
