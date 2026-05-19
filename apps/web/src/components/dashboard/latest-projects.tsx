"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { ErrorState } from "@/components/common/error-state";
import { ProjectCard } from "@/components/projects/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectsRequest } from "@/lib/api/projects";

export function LatestProjects() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["projects", "latest-open"],
    queryFn: () =>
      getProjectsRequest({
        status: "OPEN",
        sortBy: "newest",
        page: 1,
        limit: 3,
      }),
    staleTime: 60_000,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Свежие открытые проекты
        </h2>
        <Link
          href="/projects?status=OPEN"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          Все проекты
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-[28px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-black/10 bg-white px-6 py-10 text-center text-sm text-muted-foreground">
          Пока нет открытых проектов. Они появятся здесь, как только заказчики
          их опубликуют.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {data.data.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
