"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { ProjectCard } from "@/components/projects/project-card";
import {
  type GetProjectsQuery,
  type ProjectSortBy,
  type ProjectStatus,
  getProjectsRequest,
} from "@/lib/api/projects";
import { useAuth } from "@/providers/auth-provider";

const PAGE_LIMIT = 9;

const STATUS_FILTERS: Array<{ value: ProjectStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все" },
  { value: "OPEN", label: "Открытые" },
  { value: "IN_WORK", label: "В работе" },
  { value: "DONE", label: "Завершённые" },
  { value: "CANCELED", label: "Отменённые" },
];

const SORT_OPTIONS: Array<{ value: ProjectSortBy; label: string }> = [
  { value: "newest", label: "Сначала новые" },
  { value: "budgetAsc", label: "Бюджет: по возрастанию" },
  { value: "budgetDesc", label: "Бюджет: по убыванию" },
];

function parseStatus(value: string | null): ProjectStatus | undefined {
  if (
    value === "OPEN" ||
    value === "IN_WORK" ||
    value === "DONE" ||
    value === "CANCELED"
  ) {
    return value;
  }
  return undefined;
}

function parseSort(value: string | null): ProjectSortBy {
  if (value === "budgetAsc" || value === "budgetDesc" || value === "newest") {
    return value;
  }
  return "newest";
}

function parsePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

export function ProjectsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const status = parseStatus(searchParams.get("status"));
  const sortBy = parseSort(searchParams.get("sort"));
  const page = parsePage(searchParams.get("page"));
  const searchParam = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const updateParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.replace(`/projects?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (searchInput === searchParam) return;

    const timer = setTimeout(() => {
      updateParams({
        search: searchInput.trim() || undefined,
        page: undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchParam, updateParams]);

  const query: GetProjectsQuery = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      status,
      sortBy,
      search: searchParam.trim() || undefined,
    }),
    [page, status, sortBy, searchParam],
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["projects", query],
    queryFn: () => getProjectsRequest(query),
    placeholderData: keepPreviousData,
  });

  const isCustomer = user?.role === "CUSTOMER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Проекты</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Найдите подходящий проект или создайте свой
          </p>
        </div>

        {isCustomer ? (
          <Link
            href="/projects/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Создать проект
          </Link>
        ) : null}
      </div>

      <div className="space-y-3 rounded-[28px] border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Поиск по названию или описанию"
              className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black"
            />
          </div>

          <select
            value={sortBy}
            onChange={(event) =>
              updateParams({ sort: event.target.value, page: undefined })
            }
            className="h-11 rounded-full border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active =
              (filter.value === "ALL" && !status) || filter.value === status;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  updateParams({
                    status:
                      filter.value === "ALL" ? undefined : filter.value,
                    page: undefined,
                  })
                }
                className={`rounded-full border px-4 py-1.5 text-xs transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-muted-foreground hover:border-black/20 hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <PageSkeleton withHeader={false} cards={6} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Проектов не найдено"
          description={
            searchParam || status
              ? "Попробуйте изменить условия поиска или сбросить фильтры."
              : isCustomer
                ? "Создайте свой первый проект, чтобы привлечь исполнителей."
                : "Пока проектов нет — загляните чуть позже."
          }
          action={
            isCustomer ? (
              <Link
                href="/projects/create"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Создать проект
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${
              isFetching ? "opacity-70 transition" : ""
            }`}
          >
            {data.data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            hasNext={data.meta.hasNext}
            hasPrev={data.meta.hasPrev}
            onChange={(nextPage) =>
              updateParams({
                page: nextPage === 1 ? undefined : String(nextPage),
              })
            }
          />
        </>
      )}
    </div>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onChange: (page: number) => void;
};

function Pagination({
  page,
  totalPages,
  hasNext,
  hasPrev,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={!hasPrev}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-muted-foreground"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="px-3 text-sm text-muted-foreground">
        Страница <span className="font-medium text-foreground">{page}</span> из{" "}
        {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={!hasNext}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-muted-foreground"
        aria-label="Следующая страница"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
