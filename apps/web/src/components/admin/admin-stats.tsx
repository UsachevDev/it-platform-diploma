"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  FolderKanban,
  FolderOpen,
  Hammer,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { type AdminStats, getAdminStatsRequest } from "@/lib/api/admin";

export function AdminStatsPage() {
  return (
    <AdminGuard>
      <AdminStatsContent />
    </AdminGuard>
  );
}

function AdminStatsContent() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStatsRequest,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Статистика платформы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Сводка по пользователям, проектам и откликам.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[0, 1, 2].map((group) => (
            <div key={group} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((card) => (
                <Skeleton key={card} className="h-28 rounded-[28px]" />
              ))}
            </div>
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <StatsGroups stats={data} />
      )}
    </div>
  );
}

function StatsGroups({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-8">
      <StatGroup title="Пользователи">
        <StatCard
          label="Всего"
          value={stats.users.total}
          icon={Users}
          accent="bg-zinc-100 text-zinc-700"
        />
        <StatCard
          label="Заказчики"
          value={stats.users.customers}
          icon={UserRound}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Исполнители"
          value={stats.users.contractors}
          icon={BriefcaseBusiness}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Заблокированы"
          value={stats.users.blocked}
          icon={Ban}
          accent="bg-red-50 text-red-600"
        />
      </StatGroup>

      <StatGroup title="Проекты">
        <StatCard
          label="Всего"
          value={stats.projects.total}
          icon={FolderKanban}
          accent="bg-zinc-100 text-zinc-700"
        />
        <StatCard
          label="Открытые"
          value={stats.projects.open}
          icon={FolderOpen}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="В работе"
          value={stats.projects.inWork}
          icon={Hammer}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Завершённые"
          value={stats.projects.done}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600"
        />
      </StatGroup>

      <StatGroup title="Отклики">
        <StatCard
          label="Всего"
          value={stats.bids.total}
          icon={BriefcaseBusiness}
          accent="bg-zinc-100 text-zinc-700"
        />
        <StatCard
          label="На рассмотрении"
          value={stats.bids.pending}
          icon={Clock}
          accent="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Принятые"
          value={stats.bids.accepted}
          icon={ThumbsUp}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Отклонённые"
          value={stats.bids.rejected}
          icon={ThumbsDown}
          accent="bg-red-50 text-red-600"
        />
      </StatGroup>

      <StatGroup title="Отменённые проекты">
        <StatCard
          label="Отменены"
          value={stats.projects.canceled}
          icon={XCircle}
          accent="bg-zinc-100 text-zinc-700"
        />
      </StatGroup>
    </div>
  );
}

function StatGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-3xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
