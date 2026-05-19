"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  FolderOpen,
  Hammer,
  Inbox,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getMyBidsRequest } from "@/lib/api/bids";
import {
  type ProjectStatus,
  getProjectsRequest,
} from "@/lib/api/projects";
import type { UserRole } from "@/lib/auth/auth-types";

type StatCardProps = {
  label: string;
  value: number | undefined;
  icon: typeof FolderOpen;
  accent: string;
  isLoading: boolean;
};

function StatCard({ label, value, icon: Icon, accent, isLoading }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {isLoading ? (
          <Skeleton className="mt-1 h-6 w-10" />
        ) : (
          <div className="text-xl font-semibold leading-tight">
            {value ?? 0}
          </div>
        )}
      </div>
    </div>
  );
}

const CUSTOMER_STATS: ReadonlyArray<{
  label: string;
  status?: ProjectStatus;
  icon: typeof FolderOpen;
  accent: string;
}> = [
  { label: "Всего проектов", icon: FolderOpen, accent: "bg-zinc-100 text-zinc-700" },
  { label: "Открытые", status: "OPEN", icon: FolderOpen, accent: "bg-blue-50 text-blue-600" },
  { label: "В работе", status: "IN_WORK", icon: Hammer, accent: "bg-amber-50 text-amber-600" },
  { label: "Завершённые", status: "DONE", icon: CheckCircle2, accent: "bg-emerald-50 text-emerald-600" },
];

function CustomerStats() {
  const results = useQueries({
    queries: CUSTOMER_STATS.map((stat) => ({
      queryKey: ["profile", "projects-count", stat.status ?? "ALL"],
      queryFn: () =>
        getProjectsRequest({
          mine: true,
          page: 1,
          limit: 1,
          ...(stat.status ? { status: stat.status } : {}),
        }),
      staleTime: 60_000,
    })),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {CUSTOMER_STATS.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={results[index].data?.meta.total}
          icon={stat.icon}
          accent={stat.accent}
          isLoading={results[index].isLoading}
        />
      ))}
    </div>
  );
}

function ContractorStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["bids", "my"],
    queryFn: getMyBidsRequest,
    staleTime: 60_000,
  });

  const total = data?.length;
  const pending = data?.filter((b) => b.status === "PENDING").length;
  const accepted = data?.filter((b) => b.status === "ACCEPTED").length;
  const rejected = data?.filter((b) => b.status === "REJECTED").length;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Отклики всего"
        value={total}
        icon={Inbox}
        accent="bg-zinc-100 text-zinc-700"
        isLoading={isLoading}
      />
      <StatCard
        label="Ожидают"
        value={pending}
        icon={Clock}
        accent="bg-purple-50 text-purple-600"
        isLoading={isLoading}
      />
      <StatCard
        label="Принятые"
        value={accepted}
        icon={ThumbsUp}
        accent="bg-emerald-50 text-emerald-600"
        isLoading={isLoading}
      />
      <StatCard
        label="Отклонённые"
        value={rejected}
        icon={ThumbsDown}
        accent="bg-red-50 text-red-600"
        isLoading={isLoading}
      />
    </div>
  );
}

export function ProfileStats({ role }: { role: UserRole }) {
  return role === "CUSTOMER" ? <CustomerStats /> : <ContractorStats />;
}
