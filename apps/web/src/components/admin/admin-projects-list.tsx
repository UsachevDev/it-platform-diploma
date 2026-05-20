"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminProjectsQuery,
  cancelProjectAsAdminRequest,
  deleteProjectAsAdminRequest,
  getAdminProjectsRequest,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Project, ProjectStatus } from "@/lib/api/projects";
import { formatBudgetRange, formatDate } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const PAGE_LIMIT = 10;

const STATUS_FILTERS: Array<{ value: ProjectStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все" },
  { value: "OPEN", label: "Открытые" },
  { value: "IN_WORK", label: "В работе" },
  { value: "DONE", label: "Завершённые" },
  { value: "CANCELED", label: "Отменённые" },
];

export function AdminProjectsPage() {
  return (
    <AdminGuard>
      <AdminProjectsList />
    </AdminGuard>
  );
}

function AdminProjectsList() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query: AdminProjectsQuery = {
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "projects", query],
    queryFn: () => getAdminProjectsRequest(query),
    placeholderData: keepPreviousData,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  }

  const cancelMutation = useMutation({
    mutationFn: cancelProjectAsAdminRequest,
    onSuccess: () => {
      invalidate();
      showSuccessToast("Проект отменён");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProjectAsAdminRequest,
    onSuccess: () => {
      invalidate();
      showSuccessToast("Проект удалён");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  const isBusy = cancelMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Проекты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Все проекты платформы. Неподобающие можно отменить или удалить.
        </p>
      </div>

      <div className="space-y-3 rounded-[28px] border border-black/5 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по названию или описанию"
            className="h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-black"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = filter.value === status;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
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
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[24px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Проекты не найдены"
          description="Измените условия поиска или фильтры."
        />
      ) : (
        <>
          <div
            className={`space-y-3 ${isFetching ? "opacity-70 transition" : ""}`}
          >
            {data.data.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onCancel={() => cancelMutation.mutate(project.id)}
                onDelete={() => deleteMutation.mutate(project.id)}
                isBusy={isBusy}
              />
            ))}
          </div>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  onCancel,
  onDelete,
  isBusy,
}: {
  project: Project;
  onCancel: () => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  const canCancel = project.status === "OPEN" || project.status === "IN_WORK";

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${project.id}`}
              className="font-medium transition hover:underline"
            >
              {project.title}
            </Link>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {project.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              {formatBudgetRange(project.budgetMin, project.budgetMax)}
            </span>
            <span>Заказчик: {project.customer.name}</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {project._count.bids}
            </span>
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-black/5"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть
          </Link>

          {canCancel ? (
            <ConfirmDialog
              title="Отменить проект?"
              description="Проект будет принудительно переведён в статус «Отменён»."
              confirmText="Отменить проект"
              cancelText="Назад"
              onConfirm={onCancel}
              trigger={
                <button
                  type="button"
                  disabled={isBusy}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Отменить
                </button>
              }
            />
          ) : null}

          <ConfirmDialog
            title="Удалить проект?"
            description="Проект и все его отклики будут удалены безвозвратно."
            confirmText="Удалить"
            cancelText="Назад"
            onConfirm={onDelete}
            trigger={
              <button
                type="button"
                disabled={isBusy}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Следующая страница"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
