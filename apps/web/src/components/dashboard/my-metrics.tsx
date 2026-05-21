"use client";

import Link from "next/link";
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

import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyBidsRequest } from "@/lib/api/bids";
import { type ProjectStatus, getProjectsRequest } from "@/lib/api/projects";
import type { UserRole } from "@/lib/auth/auth-types";

type MetricCardData = {
  label: string;
  value: number | undefined;
  href?: string;
  icon: typeof FolderOpen;
  accent: string;
  isLoading: boolean;
};

function MetricCard({
  label,
  value,
  href,
  icon: Icon,
  accent,
  isLoading,
}: MetricCardData) {
  const inner = (
    <>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-3xl font-semibold leading-none">
            {value ?? 0}
          </div>
        )}
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
      {inner}
    </div>
  );
}

const CUSTOMER_METRICS: ReadonlyArray<{
  label: string;
  status?: ProjectStatus;
  icon: typeof FolderOpen;
  accent: string;
}> = [
  {
    label: "Всего проектов",
    icon: FolderOpen,
    accent: "bg-zinc-100 text-zinc-700",
  },
  {
    label: "Открытые",
    status: "OPEN",
    icon: FolderOpen,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "В работе",
    status: "IN_WORK",
    icon: Hammer,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    label: "Завершённые",
    status: "DONE",
    icon: CheckCircle2,
    accent: "bg-emerald-50 text-emerald-600",
  },
];

function CustomerMetrics() {
  const results = useQueries({
    queries: CUSTOMER_METRICS.map((metric) => ({
      queryKey: ["projects-count", "mine", metric.status ?? "ALL"],
      queryFn: () =>
        getProjectsRequest({
          mine: true,
          page: 1,
          limit: 1,
          ...(metric.status ? { status: metric.status } : {}),
        }),
      staleTime: 60_000,
    })),
  });

  const total = results[0].data?.meta.total;

  if (!results[0].isLoading && total === 0) {
    return (
      <EmptyState
        title="У вас пока нет проектов"
        description="Создайте первый проект, чтобы привлечь исполнителей."
        action={
          <Link
            href="/projects/create"
            className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90"
          >
            Создать проект
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CUSTOMER_METRICS.map((metric, index) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={results[index].data?.meta.total}
          href={
            metric.status
              ? `/projects?mine=1&status=${metric.status}`
              : "/projects?mine=1"
          }
          icon={metric.icon}
          accent={metric.accent}
          isLoading={results[index].isLoading}
        />
      ))}
    </div>
  );
}

function ContractorMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ["bids", "my"],
    queryFn: getMyBidsRequest,
    staleTime: 60_000,
  });

  if (!isLoading && (data?.length ?? 0) === 0) {
    return (
      <EmptyState
        title="Вы пока не откликались"
        description="Найдите подходящий проект и отправьте свой первый отклик."
        action={
          <Link
            href="/projects"
            className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90"
          >
            К проектам
          </Link>
        }
      />
    );
  }

  const total = data?.length;
  const pending = data?.filter((b) => b.status === "PENDING").length;
  const accepted = data?.filter((b) => b.status === "ACCEPTED").length;
  const rejected = data?.filter((b) => b.status === "REJECTED").length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Откликов всего"
        value={total}
        href="/bids"
        icon={Inbox}
        accent="bg-zinc-100 text-zinc-700"
        isLoading={isLoading}
      />
      <MetricCard
        label="Ожидают ответа"
        value={pending}
        href="/bids"
        icon={Clock}
        accent="bg-purple-50 text-purple-600"
        isLoading={isLoading}
      />
      <MetricCard
        label="Приняты"
        value={accepted}
        href="/bids"
        icon={ThumbsUp}
        accent="bg-emerald-50 text-emerald-600"
        isLoading={isLoading}
      />
      <MetricCard
        label="Отклонены"
        value={rejected}
        href="/bids"
        icon={ThumbsDown}
        accent="bg-red-50 text-red-600"
        isLoading={isLoading}
      />
    </div>
  );
}

export function MyMetrics({ role }: { role: UserRole }) {
  return role === "CUSTOMER" ? <CustomerMetrics /> : <ContractorMetrics />;
}
