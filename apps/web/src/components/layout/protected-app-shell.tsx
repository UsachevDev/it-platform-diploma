"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BriefcaseBusiness,
  UserRound,
  LogOut,
  BarChart3,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { getRoleLabel } from "@/lib/auth/role-labels";
import type { UserRole } from "@/lib/auth/auth-types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const MEMBER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
  { href: "/projects", label: "Проекты", icon: FolderKanban },
  { href: "/bids", label: "Отклики", icon: BriefcaseBusiness },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

const CONTRACTOR_NAV = MEMBER_NAV;
const CUSTOMER_NAV: NavItem[] = MEMBER_NAV.filter(
  (item) => item.href !== "/bids",
);

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/stats", label: "Статистика", icon: BarChart3 },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/projects", label: "Проекты", icon: FolderKanban },
  { href: "/admin/bids", label: "Отклики", icon: BriefcaseBusiness },
];

function navForRole(role?: UserRole | null): NavItem[] {
  if (role === "ADMIN") return ADMIN_NAV;
  if (role === "CONTRACTOR") return CONTRACTOR_NAV;
  return CUSTOMER_NAV;
}

export function ProtectedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const navItems = navForRole(user?.role);
  const homeHref = isAdmin ? "/admin/stats" : "/dashboard";

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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link
            href={homeHref}
            className="flex items-center gap-2"
            aria-label="IT Platform"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-xs font-semibold text-white">
              IT
            </span>
            <span className="text-sm font-semibold tracking-tight">
              IT Platform
            </span>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </span>
            ) : null}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
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

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Открыть профиль"
              className="hidden h-9 items-center gap-2 rounded-full border border-black/10 bg-white pl-1 pr-3 transition hover:border-black/25 hover:bg-black/[0.03] sm:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[11px] font-semibold uppercase text-white">
                {(user?.name ?? "?").charAt(0)}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="max-w-[140px] truncate text-xs font-medium">
                  {user?.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {getRoleLabel(user?.role)}
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-sm transition hover:bg-black hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
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
