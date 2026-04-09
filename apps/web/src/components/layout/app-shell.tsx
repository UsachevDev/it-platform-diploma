"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PropsWithChildren, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusSquare,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const dashboardItem: NavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const profileItem: NavItem = {
  href: "/profile",
  label: "Профиль",
  icon: UserCircle2,
};

const customerItems: NavItem[] = [
  {
    href: "/projects",
    label: "Проекты",
    icon: FolderKanban,
  },
  {
    href: "/projects/create",
    label: "Создать проект",
    icon: PlusSquare,
  },
];

const contractorItems: NavItem[] = [
  {
    href: "/projects",
    label: "Проекты",
    icon: FolderKanban,
  },
  {
    href: "/bids",
    label: "Мои отклики",
    icon: BriefcaseBusiness,
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Проекты",
  "/projects/create": "Создать проект",
  "/bids": "Мои отклики",
  "/profile": "Профиль",
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  if (pathname.startsWith("/projects/")) {
    return "Детали проекта";
  }

  return "Платформа";
}

function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/projects") {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

type NavListProps = {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
};

function NavList({ items, pathname, onNavigate }: NavListProps) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = useMemo(() => {
    const role = user?.role;

    const roleItems =
      role === "CUSTOMER"
        ? customerItems
        : role === "CONTRACTOR"
          ? contractorItems
          : [];

    return [dashboardItem, ...roleItems, profileItem];
  }, [user?.role]);

  const title = getPageTitle(pathname);

  const roleLabel =
    user?.role === "CUSTOMER"
      ? "Заказчик"
      : user?.role === "CONTRACTOR"
        ? "Исполнитель"
        : "Пользователь";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r bg-card md:flex md:flex-col">
          <div className="border-b px-5 py-4">
            <p className="text-lg font-semibold">IT Platform</p>
            <p className="text-sm text-muted-foreground">Diploma MVP</p>
          </div>

          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-6">
              <div>
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Навигация
                </p>
                <NavList items={navItems} pathname={pathname} />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-3">
              <div className="space-y-1">
                <p className="truncate text-sm font-medium">
                  {user?.name || "Без имени"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || "email не загружен"}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex items-center gap-3">
                <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="md:hidden"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-xs p-0">
                    <DialogHeader className="border-b px-4 py-4">
                      <DialogTitle>Меню</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 p-4">
                      <NavList
                        items={navItems}
                        pathname={pathname}
                        onNavigate={() => setMobileMenuOpen(false)}
                      />

                      <div className="space-y-3 rounded-2xl border p-3">
                        <div className="space-y-1">
                          <p className="truncate text-sm font-medium">
                            {user?.name || "Без имени"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user?.email || "email не загружен"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {roleLabel}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logout();
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Выйти
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div>
                  <h1 className="text-lg font-semibold">{title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Базовый каркас приватной части приложения
                  </p>
                </div>
              </div>

              <div className="hidden text-right md:block">
                <p className="text-sm font-medium">
                  {user?.name || "Пользователь"}
                </p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
