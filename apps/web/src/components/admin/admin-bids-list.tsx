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
  Clock,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminBidsQuery,
  deleteBidAsAdminRequest,
  getAdminBidsRequest,
} from "@/lib/api/admin";
import type { Bid, BidStatus } from "@/lib/api/bids";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime, formatRubles } from "@/lib/format";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const PAGE_LIMIT = 12;

const STATUS_FILTERS: Array<{ value: BidStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Все" },
  { value: "PENDING", label: "На рассмотрении" },
  { value: "ACCEPTED", label: "Принятые" },
  { value: "REJECTED", label: "Отклонённые" },
];

export function AdminBidsPage() {
  return (
    <AdminGuard>
      <AdminBidsList />
    </AdminGuard>
  );
}

function AdminBidsList() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BidStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query: AdminBidsQuery = {
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    status: status === "ALL" ? undefined : status,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "bids", query],
    queryFn: () => getAdminBidsRequest(query),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBidAsAdminRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bids"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      showSuccessToast("Отклик удалён");
    },
    onError: (error) => showErrorToast(getApiErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Отклики</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Все отклики платформы для аудита и модерации.
        </p>
      </div>

      <div className="space-y-3 rounded-[28px] border border-black/5 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по проекту, исполнителю или тексту"
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
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[24px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Отклики не найдены"
          description="Измените условия поиска или фильтры."
        />
      ) : (
        <>
          <div
            className={`space-y-3 ${isFetching ? "opacity-70 transition" : ""}`}
          >
            {data.data.map((bid) => (
              <BidRow
                key={bid.id}
                bid={bid}
                onDelete={() => deleteMutation.mutate(bid.id)}
                isBusy={deleteMutation.isPending}
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

function BidRow({
  bid,
  onDelete,
  isBusy,
}: {
  bid: Bid;
  onDelete: () => void;
  isBusy: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${bid.projectId}`}
              className="font-medium transition hover:underline"
            >
              {bid.project?.title ?? "Проект"}
            </Link>
            <StatusBadge status={bid.status} />
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {bid.contractor?.name ?? "Исполнитель"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {bid.durationDays} дн.
            </span>
            <span>{formatDateTime(bid.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-base font-semibold">
            {formatRubles(bid.price)}
          </div>
          <ConfirmDialog
            title="Удалить отклик?"
            description="Отклик будет удалён безвозвратно."
            confirmText="Удалить"
            cancelText="Назад"
            onConfirm={onDelete}
            trigger={
              <button
                type="button"
                disabled={isBusy}
                aria-label="Удалить отклик"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            }
          />
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {bid.coverLetter}
      </p>
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
