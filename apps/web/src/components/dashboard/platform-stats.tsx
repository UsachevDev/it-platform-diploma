"use client";

import { useQueries } from "@tanstack/react-query";
import { CheckCircle2, FolderOpen, Hammer } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  type ProjectStatus,
  getProjectsRequest,
} from "@/lib/api/projects";

type StatItem = {
  status: ProjectStatus;
  label: string;
  icon: typeof FolderOpen;
  accent: string;
};

const STATS: ReadonlyArray<StatItem> = [
  {
    status: "OPEN",
    label: "Открытые",
    icon: FolderOpen,
    accent: "text-blue-600 bg-blue-50",
  },
  {
    status: "IN_WORK",
    label: "В работе",
    icon: Hammer,
    accent: "text-amber-600 bg-amber-50",
  },
  {
    status: "DONE",
    label: "Завершённые",
    icon: CheckCircle2,
    accent: "text-emerald-600 bg-emerald-50",
  },
];

export function PlatformStats() {
  const results = useQueries({
    queries: STATS.map((stat) => ({
      queryKey: ["projects-count", stat.status],
      queryFn: () =>
        getProjectsRequest({ status: stat.status, page: 1, limit: 1 }),
      staleTime: 60_000,
    })),
  });

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STATS.map((stat, index) => {
        const Icon = stat.icon;
        const result = results[index];
        const total = result.data?.meta.total;

        return (
          <div
            key={stat.status}
            className="flex items-center gap-4 rounded-[28px] border border-black/5 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.accent}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </div>
              {result.isLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <div className="text-2xl font-semibold leading-tight">
                  {total ?? 0}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
