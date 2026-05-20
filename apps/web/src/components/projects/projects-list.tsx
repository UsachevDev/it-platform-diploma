"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { SelectMenu } from "@/components/common/select-menu";
import { ProjectCard } from "@/components/projects/project-card";
import { getCategoriesRequest } from "@/lib/api/categories";
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
  const mine = searchParams.get("mine") === "1";
  const responded = searchParams.get("responded") === "1";
  const categoryId = searchParams.get("category") ?? "";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesRequest,
    staleTime: 5 * 60_000,
  });

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Все категории" },
      ...(categories ?? []).map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

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
      mine: mine || undefined,
      responded: responded || undefined,
      categoryId: categoryId || undefined,
    }),
    [page, status, sortBy, searchParam, mine, responded, categoryId],
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["projects", query],
    queryFn: () => getProjectsRequest(query),
    placeholderData: keepPreviousData,
  });

  const isCustomer = user?.role === "CUSTOMER";

  const heading = responded
    ? {
        title: "Я откликнулся",
        description: "Проекты, на которые вы отправили отклик.",
      }
    : mine
      ? isCustomer
        ? {
            title: "Мои проекты",
            description: "Проекты, которые вы создали.",
          }
        : {
            title: "Мои проекты",
            description: "Задачи, где вы выбраны исполнителем.",
          }
      : {
          title: "Проекты",
          description: isCustomer
            ? "Каталог всех проектов на платформе."
            : "Найдите подходящий проект и отправьте отклик.",
        };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{heading.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {heading.description}
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
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Поиск по названию или описанию"
              className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-11 text-sm outline-none transition placeholder:text-zinc-400 focus:border-black [&::-webkit-search-cancel-button]:hidden"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Очистить поиск"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:bg-black/5 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <SelectMenu
            className="lg:w-56"
            ariaLabel="Категория"
            value={categoryId}
            options={categoryOptions}
            onChange={(next) =>
              updateParams({ category: next || undefined, page: undefined })
            }
          />

          <SelectMenu
            className="lg:w-56"
            ariaLabel="Сортировка"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(next) => updateParams({ sort: next, page: undefined })}
          />
        </div>

        {user ? (
          <div className="flex flex-wrap gap-2 border-b border-black/5 pb-3">
            {(() => {
              const viewModes: Array<{
                key: "all" | "mine" | "responded";
                label: string;
                visible: boolean;
              }> = [
                { key: "all", label: "Все проекты", visible: true },
                {
                  key: "mine",
                  label: isCustomer ? "Мои проекты" : "Я исполнитель",
                  visible: true,
                },
                {
                  key: "responded",
                  label: "Я откликнулся",
                  visible: !isCustomer,
                },
              ];

              const currentMode = responded ? "responded" : mine ? "mine" : "all";

              return viewModes
                .filter((m) => m.visible)
                .map((mode) => {
                  const active = currentMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() =>
                        updateParams({
                          mine: mode.key === "mine" ? "1" : undefined,
                          responded:
                            mode.key === "responded" ? "1" : undefined,
                          page: undefined,
                        })
                      }
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-muted-foreground hover:border-black/20 hover:text-foreground"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                });
            })()}
          </div>
        ) : null}

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
  onChange: (page: number) => void;
};

function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

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
